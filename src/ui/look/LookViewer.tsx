import { useEffect, useRef } from "react";
import * as THREE from "three";
import { lookAtLaunch } from "../../domain/look-at.ts";
import type { Coord } from "../../domain/types.ts";

const EARTH_M = 6_371_000;
const SPARK_COUNT = 200;
const BURST_PERIOD_S = 4;

function enu(from: Coord, to: Coord) {
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  return {
    east: dLng * Math.cos((from.lat * Math.PI) / 180) * EARTH_M,
    north: dLat * EARTH_M,
  };
}

export function LookViewer({
  from,
  launch,
  water = false,
  label,
}: {
  from: Coord;
  launch: Coord;
  water?: boolean;
  label: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  // 좌표는 원시값으로 풀어 의존성에 넣는다. 부모가 같은 좌표의 새 객체를 줘도 씬을 다시 만들지 않는다.
  const { lng: fromLng, lat: fromLat } = from;
  const { lng: launchLng, lat: launchLat } = launch;

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const origin = { lng: fromLng, lat: fromLat };
    const target = { lng: launchLng, lat: launchLat };
    const view = lookAtLaunch(origin, target);
    if (!view) return;

    const { east, north } = enu(origin, target);
    const width = host.clientWidth || 320;
    const height = host.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b18);
    scene.fog = new THREE.Fog(0x070b18, 80, Math.max(2400, view.distanceMeters * 3));

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 20000);
    camera.position.set(0, 1.7, 6);
    camera.lookAt(east, 220, -north);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (error) {
      console.error("sightline renderer failed", error);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    // 만든 것은 전부 여기 모아 해제한다. renderer.dispose() 는 지오메트리·머티리얼을 놓아주지 않는다.
    const disposables: { dispose(): void }[] = [];
    const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
      disposables.push(geometry, material);
      return new THREE.Mesh(geometry, material);
    };

    scene.add(new THREE.HemisphereLight(0x4a6a88, 0x221100, 0.7));
    const moon = new THREE.DirectionalLight(0xc5d4ff, 0.45);
    moon.position.set(-180, 420, 80);
    scene.add(moon);

    const ground = mesh(
      new THREE.PlaneGeometry(9000, 9000),
      new THREE.MeshLambertMaterial({ color: water ? 0x0b1c2e : 0x1a1410 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    if (water) {
      const sea = mesh(
        new THREE.CircleGeometry(2200, 56),
        new THREE.MeshLambertMaterial({ color: 0x12324a, transparent: true, opacity: 0.88 }),
      );
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(east * 0.55, 0.15, -north * 0.55);
      scene.add(sea);
    }

    const pad = mesh(
      new THREE.CylinderGeometry(6, 8, 2, 16),
      new THREE.MeshLambertMaterial({ color: 0xff6a3d }),
    );
    pad.position.set(east, 1, -north);
    scene.add(pad);

    const person = mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 1.6, 8),
      new THREE.MeshLambertMaterial({ color: 0xf6ebe0 }),
    );
    person.position.set(0, 0.8, 0);
    scene.add(person);

    const positions = new Float32Array(SPARK_COUNT * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const sparkMaterial = new THREE.PointsMaterial({
      color: 0xffc978,
      size: 3.2,
      sizeAttenuation: true,
    });
    disposables.push(geometry, sparkMaterial);
    scene.add(new THREE.Points(geometry, sparkMaterial));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const started = performance.now();
    const draw = (now: number) => {
      const burst = ((now - started) / 1000) % BURST_PERIOD_S;
      const spread = Math.min(1, burst / 1.15);
      for (let i = 0; i < SPARK_COUNT; i++) {
        const angle = (i / SPARK_COUNT) * Math.PI * 2;
        const ring = 10 + (i % 8) * 8;
        positions[i * 3] = east + Math.cos(angle) * ring * spread;
        positions[i * 3 + 1] = 50 + burst * 80 + Math.sin(i) * 10;
        positions[i * 3 + 2] = -north + Math.sin(angle) * ring * spread;
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    const tick = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(tick);
    };
    // 탭이 숨겨졌거나 모션 감소면 첫 프레임만 그리고 루프를 세운다.
    const syncLoop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (document.hidden) return;
      if (reduced.matches) {
        draw(started + 1150);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    syncLoop();
    document.addEventListener("visibilitychange", syncLoop);
    reduced.addEventListener("change", syncLoop);

    const resize = () => {
      const nextW = host.clientWidth;
      const nextH = host.clientHeight;
      if (nextW === 0 || nextH === 0) return;
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
      if (!frame) draw(performance.now());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", syncLoop);
      reduced.removeEventListener("change", syncLoop);
      observer.disconnect();
      for (const item of disposables) item.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      host.replaceChildren();
    };
  }, [fromLng, fromLat, launchLng, launchLat, water]);

  return <div ref={root} className="look" role="img" aria-label={label} />;
}
