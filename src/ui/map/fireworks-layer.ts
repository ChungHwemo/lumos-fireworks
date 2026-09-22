import {
  MercatorCoordinate,
  type CustomLayerInterface,
  type MapLibreMap,
} from "maplibre-gl";
import * as THREE from "three";
import {
  BASE_Y,
  burstAge,
  burstParticles,
  burstSpread,
  makeShell,
  shellAt,
  spawnGap,
  type Particle,
  type Shell,
} from "../../domain/burst.ts";
import type { Coord } from "../../domain/types.ts";

export const FIREWORKS_LAYER_ID = "fireworks";

const MAX_SHELLS = 8;
const MAX_COUNT = 420;
const MAX_TRAIL = 12;
const TRAIL_DT = 0.045;
const COMET_POINTS = 40;
const COMET_DT = 0.02;
const FLASH_SEC = 0.32;

export type FireworksLayer = CustomLayerInterface & {
  setRunning(on: boolean): void;
  /** 디버그·테스트용 스냅숏. 렌더 상태를 숫자로만 돌려준다. */
  stats(): { frames: number; seq: number; active: number; lastError: string | null };
};

type Attr = {
  position: Float32Array;
  color: Float32Array;
  size: Float32Array;
  alpha: Float32Array;
  geometry: THREE.BufferGeometry;
  points: THREE.Points;
};

type Slot = {
  shell: Shell | null;
  particles: Particle[];
  burst: Attr; // 입자 본체
  trail: Attr; // 입자 꼬리 (count × trail)
  comet: Attr; // 상승 셸 머리와 꼬리
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
    gradient.addColorStop(0.18, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.35)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const VERTEX = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aAlpha;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // MapLibre 투영 아래서는 거리 감쇠를 믿을 수 없다. 픽셀 크기로 고정한다.
    gl_PointSize = aSize * uPixelRatio;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    if (tex.a * vAlpha < 0.004) discard;
    gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha);
  }
`;

function makeAttr(count: number, material: THREE.Material): Attr {
  const position = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const alpha = new Float32Array(count);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { position, color, size, alpha, geometry, points };
}

function touch(attr: Attr, count: number): void {
  attr.geometry.setDrawRange(0, count);
  for (const name of ["position", "aColor", "aSize", "aAlpha"] as const) {
    attr.geometry.attributes[name].needsUpdate = true;
  }
}

function setColor(target: Float32Array, index: number, rgb: THREE.Color, gain = 1): void {
  target[index * 3] = rgb.r * gain;
  target[index * 3 + 1] = rgb.g * gain;
  target[index * 3 + 2] = rgb.b * gain;
}

export function createFireworksLayer(origin: Coord): FireworksLayer {
  const anchor = origin;
  let running = true;
  let map: MapLibreMap | null = null;
  let camera: THREE.Camera | null = null;
  let scene: THREE.Scene | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let texture: THREE.CanvasTexture | null = null;
  let material: THREE.ShaderMaterial | null = null;
  let slots: Slot[] = [];
  let flash: Attr | null = null;
  let startedAt = 0;
  let nextSpawn = 0;
  let seq = 0;
  let frames = 0;
  let lastError: string | null = null;

  const outer = new THREE.Color();
  const inner = new THREE.Color();
  const cometHead = new THREE.Color(0xfff2cc);
  const cometTail = new THREE.Color(0xffb36b);
  const flashColor = new THREE.Color(0xfff6e6);

  return {
    id: FIREWORKS_LAYER_ID,
    type: "custom",
    renderingMode: "3d",

    setRunning(on) {
      running = on;
      if (on) map?.triggerRepaint();
    },

    stats() {
      return {
        frames,
        seq,
        active: slots.filter((s) => s.shell != null).length,
        lastError,
      };
    },

    onAdd(addedMap, gl) {
      map = addedMap;
      camera = new THREE.Camera();
      scene = new THREE.Scene();
      // three는 y가 위, z가 시청자 쪽이다. MapLibre에 맞춰 x=동 y=위 z=북으로 돌린다.
      scene.rotateX(Math.PI / 2);
      scene.scale.multiply(new THREE.Vector3(1, 1, -1));

      texture = sparkTexture();
      material = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: texture },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        // 지형 뒤에서 터져도 보인다. 능선에 가려 한 프레임도 안 보이는 것보다 낫다.
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });

      slots = [];
      for (let i = 0; i < MAX_SHELLS; i++) {
        const slot: Slot = {
          shell: null,
          particles: [],
          burst: makeAttr(MAX_COUNT, material),
          trail: makeAttr(MAX_COUNT * MAX_TRAIL, material),
          comet: makeAttr(COMET_POINTS, material),
        };
        scene.add(slot.trail.points, slot.burst.points, slot.comet.points);
        slots.push(slot);
      }
      flash = makeAttr(MAX_SHELLS, material);
      scene.add(flash.points);

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
      for (const slot of slots) {
        slot.burst.geometry.dispose();
        slot.trail.geometry.dispose();
        slot.comet.geometry.dispose();
      }
      slots = [];
      flash?.geometry.dispose();
      flash = null;
      material?.dispose();
      material = null;
      // 텍스처는 모든 머티리얼이 공유한다. material.dispose() 는 이걸 놓아주지 않는다.
      texture?.dispose();
      texture = null;
      renderer?.dispose();
      renderer = null;
      scene = null;
      camera = null;
      map = null;
    },

    render(gl, args) {
      if (!map || !camera || !scene || !renderer || !flash) return;
      frames++;
      const now = (performance.now() - startedAt) / 1000;
      if (frames % 120 === 1) {
        const err = gl.getError();
        if (err !== gl.NO_ERROR) lastError = `gl error ${err}`;
      }

      if (running && now > nextSpawn) {
        const slot = slots.find(
          (s) => !s.shell || now - s.shell.t0 > s.shell.riseSec + s.shell.life,
        );
        if (slot) {
          const shell = makeShell(seq, now);
          slot.shell = shell;
          slot.particles = burstParticles(shell.kind ?? "peony", shell.count, seq * 7919 + 17);
          nextSpawn = now + spawnGap(seq);
          seq++;
        } else {
          nextSpawn = now + 0.1;
        }
      }

      let alive = false;
      let flashes = 0;

      for (const slot of slots) {
        const shell = slot.shell;
        if (!shell) {
          slot.burst.points.visible = false;
          slot.trail.points.visible = false;
          slot.comet.points.visible = false;
          continue;
        }
        const t = now - shell.t0;
        const rising = shellAt(shell, t);
        slot.comet.points.visible = rising != null;
        if (rising) {
          alive = true;
          const wobble = Math.sin(t * 23 + shell.east) * 1.6;
          for (let k = 0; k < COMET_POINTS; k++) {
            const past = shellAt(shell, Math.max(0, t - k * COMET_DT)) ?? rising;
            const i = k * 3;
            slot.comet.position[i] = past.x + (k > 0 ? wobble * (k / COMET_POINTS) : 0);
            slot.comet.position[i + 1] = past.y;
            slot.comet.position[i + 2] = past.z;
            const fadeK = 1 - k / COMET_POINTS;
            setColor(slot.comet.color, k, k === 0 ? cometHead : cometTail, k === 0 ? 1.4 : 1);
            slot.comet.size[k] = k === 0 ? 24 : 5 + 11 * fadeK;
            slot.comet.alpha[k] = k === 0 ? 1 : 0.75 * fadeK * fadeK;
          }
          touch(slot.comet, COMET_POINTS);
        }

        const age = burstAge(shell, t);
        slot.burst.points.visible = age != null;
        slot.trail.points.visible = age != null && (shell.trail ?? 0) > 0;
        if (age == null) continue;
        alive = true;

        outer.setHex(shell.hue);
        inner.setHex(shell.hue2 ?? shell.hue);
        const trailLen = Math.min(shell.trail ?? 0, MAX_TRAIL);
        const baseSize = shell.size ?? 22;
        const cx = shell.east;
        const cy = BASE_Y + shell.peakY;
        const cz = shell.north;
        const count = Math.min(shell.count, MAX_COUNT, slot.particles.length);
        // 마지막 1초는 불티가 꺼져 가듯 붉어진다.
        const ember = Math.min(1, Math.max(0, (age - (shell.life - 1.2)) / 1.2));

        let trailIndex = 0;
        for (let k = 0; k < count; k++) {
          const p = slot.particles[k];
          const { spread, drop, fade } = burstSpread(shell, age, p.rate, p.gravity);
          const i = k * 3;
          slot.burst.position[i] = cx + p.dx * spread;
          slot.burst.position[i + 1] = cy + p.dy * spread - drop;
          slot.burst.position[i + 2] = cz + p.dz * spread;

          const tone = p.inner ? inner : outer;
          const gain = age < 0.25 ? 1 + (0.25 - age) * 5 : 1;
          slot.burst.color[i] = tone.r * gain * (1 - ember * 0.25);
          slot.burst.color[i + 1] = tone.g * gain * (1 - ember * 0.6);
          slot.burst.color[i + 2] = tone.b * gain * (1 - ember * 0.85);

          let alpha = fade * fade;
          if (shell.twinkle) alpha *= 0.35 + 0.65 * Math.max(0, Math.sin(age * 28 + p.phase));
          slot.burst.alpha[k] = alpha;
          slot.burst.size[k] = baseSize * (0.6 + 0.4 * fade) + (age < 0.2 ? 14 : 0);

          for (let q = 1; q <= trailLen; q++) {
            const pastAge = age - q * TRAIL_DT;
            if (pastAge < 0) break;
            const past = burstSpread(shell, pastAge, p.rate, p.gravity);
            const j = trailIndex * 3;
            slot.trail.position[j] = cx + p.dx * past.spread;
            slot.trail.position[j + 1] = cy + p.dy * past.spread - past.drop;
            slot.trail.position[j + 2] = cz + p.dz * past.spread;
            const decay = 1 - q / (trailLen + 1);
            slot.trail.color[j] = tone.r * (1 - ember * 0.25);
            slot.trail.color[j + 1] = tone.g * (1 - ember * 0.6);
            slot.trail.color[j + 2] = tone.b * (1 - ember * 0.85);
            slot.trail.alpha[trailIndex] = alpha * decay * decay * 0.55;
            slot.trail.size[trailIndex] = baseSize * 0.55 * decay + 3;
            trailIndex++;
          }
        }
        touch(slot.burst, count);
        touch(slot.trail, trailIndex);

        if (age < FLASH_SEC) {
          const k = 1 - age / FLASH_SEC;
          const i = flashes * 3;
          flash.position[i] = cx;
          flash.position[i + 1] = cy;
          flash.position[i + 2] = cz;
          setColor(flash.color, flashes, flashColor, 1.2);
          flash.size[flashes] = 90 + 160 * k;
          flash.alpha[flashes] = 0.85 * k * k;
          flashes++;
        }
      }

      flash.points.visible = flashes > 0;
      if (flashes > 0) touch(flash, flashes);

      const elevation = map.queryTerrainElevation(anchor) ?? 0;
      const mercator = MercatorCoordinate.fromLngLat(anchor, elevation);
      const scale = mercator.meterInMercatorCoordinateUnits();
      const projection = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
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
