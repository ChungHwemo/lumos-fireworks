import maplibregl from "maplibre-gl";
import * as THREE from "three";
import {
  BASE_Y,
  burstAge,
  burstSpread,
  makeShell,
  shellAt,
  type Shell,
} from "../../domain/burst.ts";
import type { Coord } from "../../domain/types.ts";

export const FIREWORKS_LAYER_ID = "fireworks";

const MAX_SHELLS = 6;
const TRAIL_POINTS = 20;

export type FireworksLayer = maplibregl.CustomLayerInterface & {
  setRunning(on: boolean): void;
};

type Group = {
  points: THREE.Points;
  trail: THREE.Points;
  positions: Float32Array;
  trailPositions: Float32Array;
  directions: Float32Array;
};

/** 파일 없이 불티 스프라이트를 만든다. 요청 0회, 라이선스 0줄. */
function sparkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,240,200,0.9)");
    gradient.addColorStop(1, "rgba(255,170,80,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

/** 입자가 퍼질 방향. 구면 위 난수라 여기서만 Math.random을 쓴다. */
function unitSphere(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    const jitter = 0.55 + Math.random() * 0.45;
    out[i * 3] = r * Math.cos(theta) * jitter;
    out[i * 3 + 1] = u * jitter;
    out[i * 3 + 2] = r * Math.sin(theta) * jitter;
  }
  return out;
}

export function createFireworksLayer(origin: Coord): FireworksLayer {
  const anchor = origin;
  let running = true;
  let map: maplibregl.Map | null = null;
  let camera: THREE.Camera | null = null;
  let scene: THREE.Scene | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let texture: THREE.CanvasTexture | null = null;
  let groups: Group[] = [];
  let shells: (Shell | null)[] = [];
  let startedAt = 0;
  let nextSpawn = 0;
  let seq = 0;

  return {
    id: FIREWORKS_LAYER_ID,
    type: "custom",
    renderingMode: "3d",

    setRunning(on) {
      running = on;
      if (on) map?.triggerRepaint();
    },

    onAdd(addedMap, gl) {
      map = addedMap;
      camera = new THREE.Camera();
      scene = new THREE.Scene();
      // three는 y가 위, z가 시청자 쪽이다. MapLibre에 맞춰 x=동 y=위 z=북으로 돌린다.
      scene.rotateX(Math.PI / 2);
      scene.scale.multiply(new THREE.Vector3(1, 1, -1));

      texture = sparkTexture();
      groups = [];
      shells = [];

      // 버퍼 길이는 makeShell 의 count(항상 340)에 기댄다. 셸마다 다른 count 를 주게 되면 넘친다.
      for (let i = 0; i < MAX_SHELLS; i++) {
        const count = makeShell(i, 0).count;

        const positions = new Float32Array(count * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const points = new THREE.Points(
          geometry,
          new THREE.PointsMaterial({
            size: 26,
            map: texture,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false,
          }),
        );
        points.frustumCulled = false;

        const trailPositions = new Float32Array(TRAIL_POINTS * 3);
        const trailGeometry = new THREE.BufferGeometry();
        trailGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(trailPositions, 3),
        );
        const trail = new THREE.Points(
          trailGeometry,
          new THREE.PointsMaterial({
            size: 18,
            map: texture,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false,
            color: 0xffd9a0,
          }),
        );
        trail.frustumCulled = false;

        scene.add(points, trail);
        groups.push({
          points,
          trail,
          positions,
          trailPositions,
          directions: unitSphere(count),
        });
        shells.push(null);
      }

      renderer = new THREE.WebGLRenderer({
        canvas: addedMap.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      startedAt = performance.now();
      nextSpawn = 0;
      seq = 0;
    },

    onRemove() {
      for (const group of groups) {
        group.points.geometry.dispose();
        group.trail.geometry.dispose();
        (group.points.material as THREE.PointsMaterial).dispose();
        (group.trail.material as THREE.PointsMaterial).dispose();
      }
      groups = [];
      shells = [];
      // 텍스처는 모든 머티리얼이 공유한다. material.dispose() 는 이걸 놓아주지 않는다.
      texture?.dispose();
      texture = null;
      renderer?.dispose();
      renderer = null;
      scene = null;
      camera = null;
      map = null;
    },

    render(_gl, args) {
      if (!map || !camera || !scene || !renderer) return;
      const now = (performance.now() - startedAt) / 1000;

      if (running && now > nextSpawn) {
        const slot = shells.findIndex(
          (shell) => !shell || now - shell.t0 > shell.riseSec + shell.life,
        );
        if (slot >= 0) shells[slot] = makeShell(seq++, now);
        nextSpawn = now + 0.28 + (seq % 3) * 0.22;
      }

      let alive = false;

      for (let i = 0; i < groups.length; i++) {
        const shell = shells[i];
        const group = groups[i];
        if (!shell) {
          group.points.visible = false;
          group.trail.visible = false;
          continue;
        }
        const t = now - shell.t0;

        const rising = shellAt(shell, t);
        group.trail.visible = rising != null;
        if (rising) {
          alive = true;
          for (let k = 0; k < TRAIL_POINTS; k++) {
            const past = shellAt(shell, Math.max(0, t - k * 0.04)) ?? rising;
            group.trailPositions[k * 3] = past.x;
            group.trailPositions[k * 3 + 1] = past.y;
            group.trailPositions[k * 3 + 2] = past.z;
          }
          group.trail.geometry.attributes.position.needsUpdate = true;
        }

        const age = burstAge(shell, t);
        group.points.visible = age != null;
        if (age != null) {
          alive = true;
          const { spread, drop, fade } = burstSpread(shell, age);
          for (let k = 0; k < shell.count; k++) {
            group.positions[k * 3] = shell.east + group.directions[k * 3] * spread;
            group.positions[k * 3 + 1] =
              BASE_Y + shell.peakY + group.directions[k * 3 + 1] * spread - drop;
            group.positions[k * 3 + 2] =
              shell.north + group.directions[k * 3 + 2] * spread;
          }
          group.points.geometry.attributes.position.needsUpdate = true;
          const material = group.points.material as THREE.PointsMaterial;
          material.opacity = fade * fade;
          material.color.setHex(shell.hue);
          material.size = 18 + fade * 40;
        }
      }

      const elevation = map.queryTerrainElevation(anchor) ?? 0;
      const mercator = maplibregl.MercatorCoordinate.fromLngLat(anchor, elevation);
      const scale = mercator.meterInMercatorCoordinateUnits();
      const projection = new THREE.Matrix4().fromArray(
        args.defaultProjectionData.mainMatrix,
      );
      const model = new THREE.Matrix4()
        .makeTranslation(mercator.x, mercator.y, mercator.z)
        .scale(new THREE.Vector3(scale, -scale, scale));

      camera.projectionMatrix = projection.multiply(model);
      renderer.resetState();
      renderer.render(scene, camera);

      // 꺼져 있고 남은 입자도 없으면 다음 프레임을 요청하지 않는다.
      if (running || alive) map.triggerRepaint();
    },
  };
}
