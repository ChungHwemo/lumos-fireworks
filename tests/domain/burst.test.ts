import { expect, test } from "vitest";
import {
  BASE_Y,
  burstAge,
  burstSpread,
  makeShell,
  shellAt,
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

test("셸은 지상 100m에서 떠서 정점까지 올라간다", () => {
  expect(shellAt(SHELL, -0.1)).toBeNull();
  expect(shellAt(SHELL, 0)).toEqual({ x: 0, y: 100, z: 0 });
  expect(shellAt(SHELL, 1)).toEqual({ x: 0, y: 475, z: 0 });
  expect(shellAt(SHELL, 2)).toEqual({ x: 0, y: 600, z: 0 });
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
  for (const shell of [one, two]) {
    expect(shell.riseSec).toBeGreaterThanOrEqual(1.6);
    expect(shell.riseSec).toBeLessThanOrEqual(2.3);
    expect(shell.peakY).toBeGreaterThanOrEqual(620);
    expect(shell.peakY).toBeLessThanOrEqual(1000);
    expect(shell.count).toBe(340);
  }
});

test("BASE_Y는 100m다", () => {
  expect(BASE_Y).toBe(100);
});
