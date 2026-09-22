import { expect, test } from "vitest";
import {
  BASE_Y,
  burstAge,
  burstParticles,
  burstSpread,
  makeShell,
  prng,
  shellAt,
  spawnGap,
  unknownLaunchOffset,
  type Shell,
} from "../../src/domain/burst.ts";
import { distanceMetersToLaunch } from "../../src/domain/spot.ts";

const SHELL: Shell = {
  t0: 0,
  riseSec: 2,
  peakY: 500,
  east: 0,
  north: 0,
  burstR: 200,
  life: 4,
  hue: 0xffc46b,
  count: 340,
};

test("셸은 지표에서 떠서 정점까지 올라간다", () => {
  expect(shellAt(SHELL, -0.1)).toBeNull();
  expect(shellAt(SHELL, 0)).toEqual({ x: 0, y: 0, z: 0 });
  expect(shellAt(SHELL, 1)).toEqual({ x: 0, y: 375, z: 0 });
  expect(shellAt(SHELL, 2)).toEqual({ x: 0, y: 500, z: 0 });
});

test("폭발한 뒤에는 상승 궤적이 없다", () => {
  expect(shellAt(SHELL, 2.01)).toBeNull();
});

test("폭발 전에는 입자가 없다", () => {
  expect(burstAge(SHELL, 1.9)).toBeNull();
  expect(burstAge(SHELL, 2)).toBe(0);
});

test("수명이 끝나면 입자가 사라진다", () => {
  expect(burstAge(SHELL, 6)).toBe(4);
  expect(burstAge(SHELL, 6.01)).toBeNull();
});

test("폭발 순간 반경은 0이고 처짐도 0이다", () => {
  expect(burstSpread(SHELL, 0)).toEqual({ spread: 0, drop: 0, fade: 1 });
});

test("시간이 갈수록 퍼지고 중력에 처지고 흐려진다", () => {
  const half = burstSpread(SHELL, 2);
  expect(half.spread).toBeGreaterThan(0);
  expect(half.spread).toBeLessThan(SHELL.burstR);
  expect(half.drop).toBeCloseTo(10.78, 5);
  expect(half.fade).toBeCloseTo(0.5, 5);

  const late = burstSpread(SHELL, 3.5);
  expect(late.spread).toBeGreaterThan(half.spread);
  expect(late.drop).toBeGreaterThan(half.drop);
  expect(late.fade).toBeLessThan(half.fade);
});

test("입자별 배수는 처짐과 퍼짐을 그만큼 바꾼다", () => {
  const base = burstSpread(SHELL, 2);
  const heavy = burstSpread(SHELL, 2, 1, 1.3);
  expect(heavy.drop).toBeCloseTo(base.drop * 1.3, 5);
  expect(heavy.spread).toBe(base.spread);
  const slow = burstSpread(SHELL, 2, 0.5, 1);
  expect(slow.spread).toBeLessThan(base.spread);
});

test("柳는 같은 나이에 더 많이 처진다", () => {
  const willow = { ...SHELL, gravity: 1.7 };
  expect(burstSpread(willow, 2).drop).toBeCloseTo(10.78 * 1.7, 5);
});

test("수명 끝에서 완전히 흐려진다", () => {
  expect(burstSpread(SHELL, 4).fade).toBe(0);
});

test("같은 시드는 같은 좌표를 준다", () => {
  const center = { lng: 139.077, lat: 35.096 };
  const a = unknownLaunchOffset(center, "atami-kaijo-2026-09-13");
  const b = unknownLaunchOffset(center, "atami-kaijo-2026-09-13");
  expect(a).toEqual(b);
  expect(a.lng).toBeCloseTo(139.0749153554045, 6);
  expect(a.lat).toBeCloseTo(35.09644403004916, 6);
});

test("다른 행사는 다른 좌표를 쓰고 400m 안에 있다", () => {
  const center = { lng: 139.077, lat: 35.096 };
  const a = unknownLaunchOffset(center, "atami-kaijo-2026-09-13");
  const b = unknownLaunchOffset(center, "sakata-hanabi-2026");
  expect(a).not.toEqual(b);
  for (const point of [a, b]) {
    const meters = distanceMetersToLaunch(point, center);
    expect(meters).not.toBeNull();
    expect(meters!).toBeLessThanOrEqual(400);
  }
});

test("셸은 시드마다 다르고 값이 범위 안에 있다", () => {
  const one = makeShell(0, 0);
  const two = makeShell(1, 0);
  expect(one).not.toEqual(two);
  for (let seq = 0; seq < 20; seq++) {
    const shell = makeShell(seq, 0);
    expect(shell.riseSec).toBeGreaterThanOrEqual(1.6);
    expect(shell.riseSec).toBeLessThanOrEqual(2.3);
    expect(shell.peakY).toBeGreaterThanOrEqual(620);
    expect(shell.peakY).toBeLessThanOrEqual(1000);
    // 椰子는 굵은 줄기 몇 가닥, 銀冠은 잔불이 많다. 렌더 버퍼 상한은 420이다.
    expect(shell.count).toBeGreaterThanOrEqual(40);
    expect(shell.count).toBeLessThanOrEqual(420);
    expect(shell.life).toBeGreaterThan(3.5);
  }
});

test("열 발 안에 여섯 종류가 모두 나온다", () => {
  const kinds = new Set(Array.from({ length: 10 }, (_, seq) => makeShell(seq, 0).kind));
  expect(kinds).toEqual(
    new Set(["peony", "chrysanthemum", "willow", "ring", "glitter", "palm"]),
  );
});

test("같은 시드의 입자 방향은 같고 단위 속도 안에 있다", () => {
  const a = burstParticles("peony", 50, 7);
  const b = burstParticles("peony", 50, 7);
  expect(a).toEqual(b);
  for (const p of a) {
    const speed = Math.hypot(p.dx, p.dy, p.dz);
    expect(speed).toBeGreaterThan(0.45);
    expect(speed).toBeLessThanOrEqual(1.0001);
  }
});

test("輪은 한 평면에 놓이고 椰子는 위로 치우친다", () => {
  const ring = burstParticles("ring", 120, 3);
  // 평면의 법선을 두 점의 외적으로 잡고, 나머지 점이 그 평면에서 벗어나지 않는지 본다.
  const [p, q] = ring;
  const n = {
    x: p.dy * q.dz - p.dz * q.dy,
    y: p.dz * q.dx - p.dx * q.dz,
    z: p.dx * q.dy - p.dy * q.dx,
  };
  const len = Math.hypot(n.x, n.y, n.z);
  for (const r of ring) {
    const off = Math.abs((r.dx * n.x + r.dy * n.y + r.dz * n.z) / len);
    expect(off).toBeLessThan(0.08);
  }
  const palm = burstParticles("palm", 40, 3);
  expect(palm.every((r) => r.dy > 0.1)).toBe(true);
});

test("여덟 발마다 볼리가 있고 그 밖은 반 초 이상 띈다", () => {
  expect(spawnGap(5)).toBeLessThan(0.2);
  expect(spawnGap(6)).toBeLessThan(0.2);
  for (const seq of [0, 1, 2, 3, 4, 7, 8]) {
    expect(spawnGap(seq)).toBeGreaterThanOrEqual(0.55);
    expect(spawnGap(seq)).toBeLessThanOrEqual(1.05);
  }
});

test("prng 는 시드에 결정적이고 0 이상 1 미만이다", () => {
  const a = prng(42);
  const b = prng(42);
  for (let i = 0; i < 100; i++) {
    const x = a();
    expect(x).toBe(b());
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(1);
  }
});

test("셸은 지표(0m)에서 뜬다", () => {
  expect(BASE_Y).toBe(0);
});
