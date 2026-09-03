import { useEffect, useRef } from "react";
import * as THREE from "three";
import { lookAtLaunch } from "../../domain/look-at.ts";
import type { Coord } from "../../domain/types.ts";

const EARTH_M = 6_371_000;

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
}: {
  from: Coord;
  launch: Coord;
  water?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const view = lookAtLaunch(from, launch);
    if (!view) return;

    const { east, north } = enu(from, launch);
    const width = host.clientWidth || 320;
    const height = host.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b18);
    scene.fog = new THREE.Fog(0x070b18, 80, Math.max(2400, view.distanceMeters * 3));

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 20000);
    camera.position.set(0, 1.7, 6);
    camera.lookAt(east, 220, -north);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x4a6a88, 0x221100, 0.7));
    const moon = new THREE.DirectionalLight(0xc5d4ff, 0.45);
    moon.position.set(-180, 420, 80);
    scene.add(moon);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(9000, 9000),
      new THREE.MeshLambertMaterial({ color: water ? 0x0b1c2e : 0x1a1410 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    if (water) {
      const sea = new THREE.Mesh(
        new THREE.CircleGeometry(2200, 56),
        new THREE.MeshLambertMaterial({
          color: 0x12324a,
          transparent: true,
          opacity: 0.88,
        }),
      );
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(east * 0.55, 0.15, -north * 0.55);
      scene.add(sea);
    }

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 8, 2, 16),
      new THREE.MeshLambertMaterial({ color: 0xff6a3d }),
    );
    pad.position.set(east, 1, -north);
    scene.add(pad);

    const person = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 1.6, 8),
      new THREE.MeshLambertMaterial({ color: 0xf6ebe0 }),
    );
    person.position.set(0, 0.8, 0);
    scene.add(person);

    const count = 200;
    const positions = new Float32Array(count * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const sparks = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xffc978,
        size: 3.2,
        sizeAttenuation: true,
      }),
    );
    scene.add(sparks);

    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const burst = ((now - started) / 1000) % 4;
      const spread = Math.min(1, burst / 1.15);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const ring = 10 + (i % 8) * 8;
        positions[i * 3] = east + Math.cos(angle) * ring * spread;
        positions[i * 3 + 1] = 50 + burst * 80 + Math.sin(i) * 10;
        positions[i * 3 + 2] = -north + Math.sin(angle) * ring * spread;
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const resize = () => {
      const nextW = host.clientWidth;
      const nextH = host.clientHeight;
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
      geometry.dispose();
      host.replaceChildren();
    };
  }, [from.lng, from.lat, launch.lng, launch.lat, water]);

  return <div ref={root} className="look" role="img" aria-label="시선 스케치" />;
}
