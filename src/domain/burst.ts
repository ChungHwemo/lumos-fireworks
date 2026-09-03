import type { Coord } from "./types.ts";

/** 셸이 뜨는 지상 높이. 능선에 걸리지 않게 공중에서 시작한다. */
export const BASE_Y = 100;

/** 발사 앵커가 없을 때 중심에서 벗어날 수 있는 최대 거리. */
const MAX_UNKNOWN_OFFSET_M = 400;

const G = 9.8;
const DROP_SCALE = 0.55;
const SPREAD_RATE = 1.9;
const HUES = [0xffc46b, 0xff6f9c, 0x8fd0ff, 0xfff0b8, 0xa8ff9e];

export type Shell = {
  t0: number;
  riseSec: number;
  peakY: number;
  east: number;
  north: number;
  burstR: number;
  life: number;
  hue: number;
  count: number;
};

/** seq만으로 결정된다. Math.random을 부르지 않는다. */
export function makeShell(seq: number, t0: number): Shell {
  const a = frac(Math.sin(seq * 12.9898) * 43758.5453);
  const b = frac(Math.sin(seq * 78.233) * 12345.6789);
  return {
    t0,
    riseSec: 1.6 + a * 0.7,
    peakY: 620 + a * 380,
    east: (a - 0.5) * 200,
    north: (b - 0.5) * 200,
    burstR: 230 + b * 190,
    life: 4 + b * 1.5,
    hue: HUES[seq % HUES.length],
    count: 340,
  };
}

/** 상승 중인 셸의 위치. 폭발 전에만 값이 있다. */
export function shellAt(shell: Shell, t: number): { x: number; y: number; z: number } | null {
  if (t < 0 || t > shell.riseSec) return null;
  const k = t / shell.riseSec;
  return {
    x: shell.east,
    y: BASE_Y + shell.peakY * (1 - (1 - k) * (1 - k)),
    z: shell.north,
  };
}

/** 폭발 뒤 경과 시간. 폭발 전이거나 수명이 끝났으면 없다. */
export function burstAge(shell: Shell, t: number): number | null {
  const age = t - shell.riseSec;
  if (age < 0 || age > shell.life) return null;
  return age;
}

/** 폭발 입자의 반경·처짐·감쇠. */
export function burstSpread(
  shell: Shell,
  age: number,
): { spread: number; drop: number; fade: number } {
  return {
    spread: shell.burstR * (1 - Math.exp(-age * SPREAD_RATE)),
    drop: 0.5 * G * age * age * DROP_SCALE,
    fade: Math.max(0, 1 - age / shell.life),
  };
}

/**
 * 발사 앵커가 없는 행사의 폭발 위치.
 * 시드는 festival.id다. 열 때마다 자리가 바뀌면 좌표를 읽는 것처럼 보이고,
 * 고정하면 없는 앵커를 있는 것처럼 보인다.
 */
export function unknownLaunchOffset(center: Coord, seed: string): Coord {
  const angle = hash(seed) * Math.PI * 2;
  const radius = Math.sqrt(hash(`${seed}#r`)) * MAX_UNKNOWN_OFFSET_M;
  const north = Math.cos(angle) * radius;
  const east = Math.sin(angle) * radius;
  const latPerMeter = 1 / 111_320;
  const lngPerMeter = 1 / (111_320 * Math.cos((center.lat * Math.PI) / 180));
  return {
    lng: center.lng + east * lngPerMeter,
    lat: center.lat + north * latPerMeter,
  };
}

function frac(value: number): number {
  return value - Math.floor(value);
}

/** FNV-1a. 문자열 하나에서 0 이상 1 미만을 뽑는다. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
