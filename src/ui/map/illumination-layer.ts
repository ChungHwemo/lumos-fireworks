import { MercatorCoordinate, type MapLibreMap } from "maplibre-gl";
import * as THREE from "three";
import type { Coord } from "../../domain/types.ts";
import { FIREWORKS_LAYER_ID, type FireworksLayer } from "./fireworks-layer.ts";

const COUNT = 480;

type Bulb = { x: number; y: number; z: number; r: number; g: number; b: number; phase: number };

/** 가로수와 터널. 불꽃 궤적은 만들지 않는다. */
function bulbs(): Bulb[] {
  const out: Bulb[] = [];
  const push = (x: number, y: number, z: number, tone: [number, number, number]) => {
    out.push({ x, y, z, r: tone[0], g: tone[1], b: tone[2], phase: out.length * 0.37 });
  };
  const warm: [number, number, number] = [1, 0.82, 0.45];
  const ice: [number, number, number] = [0.65, 0.82, 1];
  const rose: [number, number, number] = [1, 0.55, 0.72];
  for (let i = 0; i < 28; i++) {
    const x = (i - 13.5) * 7;
    for (const z of [-16, 16]) {
      for (let y = 3; y <= 14; y += 2.2) {
        push(x, y, z + Math.sin(i) * 1.4, i % 3 === 0 ? ice : warm);
      }
    }
  }
  for (let i = 0; i < 36; i++) {
    const t = (i / 35) * Math.PI;
    push((i - 18) * 3.2, 3 + Math.sin(t) * 8, 0, i % 2 === 0 ? warm : rose);
  }
  while (out.length < COUNT) {
    const i = out.length;
    push((i % 24) * 4 - 46, 1.2 + (i % 5), ((i * 3) % 20) - 10, ice);
  }
  return out.slice(0, COUNT);
}

/**
 * 지도 위에 얹는 일루미네이션. 같은 레이어 id 를 써서 불꽃과 동시에 올라가지 않는다.
 * 좌표는 앵커 기준 미터. 폭죽은 쏘지 않고 밝기만 숨 쉰다.
 */
export function createIlluminationLayer(anchor: Coord): FireworksLayer {
  const points = bulbs();
  let map: MapLibreMap | null = null;
  let camera: THREE.Camera | null = null;
  let scene: THREE.Scene | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let geometry: THREE.BufferGeometry | null = null;
  let material: THREE.PointsMaterial | null = null;
  let running = true;
  let frames = 0;
  let lastError: string | null = null;
  const colors = new Float32Array(COUNT * 3);
  const positions = new Float32Array(COUNT * 3);
  points.forEach((bulb, i) => {
    positions[i * 3] = bulb.x;
    positions[i * 3 + 1] = bulb.y;
    positions[i * 3 + 2] = bulb.z;
  });

  return {
    id: FIREWORKS_LAYER_ID,
    type: "custom",
    renderingMode: "3d",

    setRunning(on) {
      running = on;
      if (on) map?.triggerRepaint();
    },

    stats() {
      return { frames, seq: 0, active: running ? COUNT : 0, lastError };
    },

    onAdd(addedMap, gl) {
      map = addedMap;
      camera = new THREE.Camera();
      scene = new THREE.Scene();
      scene.rotateX(Math.PI / 2);
      scene.scale.multiply(new THREE.Vector3(1, 1, -1));
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      material = new THREE.PointsMaterial({
        size: 4.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      scene.add(new THREE.Points(geometry, material));
      renderer = new THREE.WebGLRenderer({
        canvas: addedMap.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
    },

    onRemove() {
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
      geometry = null;
      material = null;
      renderer = null;
      scene = null;
      camera = null;
      map = null;
    },

    render(gl, args) {
      if (!map || !camera || !scene || !renderer || !geometry) return;
      frames++;
      if (frames % 120 === 1) {
        const err = gl.getError();
        if (err !== gl.NO_ERROR) lastError = `gl error ${err}`;
      }
      const now = performance.now() / 1000;
      for (let i = 0; i < COUNT; i++) {
        const bulb = points[i];
        const breathe = running ? 0.35 + 0.65 * Math.abs(Math.sin(now * 1.4 + bulb.phase)) : 0.8;
        colors[i * 3] = bulb.r * breathe;
        colors[i * 3 + 1] = bulb.g * breathe;
        colors[i * 3 + 2] = bulb.b * breathe;
      }
      const colorAttr = geometry.getAttribute("color");
      colorAttr.needsUpdate = true;

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
      if (running) map.triggerRepaint();
    },
  };
}
