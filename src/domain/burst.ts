import type { Coord } from "./types.ts";

/**
 * 셸이 뜨는 지상 높이. 지형과의 깊이 판정을 끄고 그리므로 능선에 가려지지 않는다.
 * 발사 불빛이 땅에서 올라오는 것이 보이도록 지표(0m)에서 뜬다.
 */
export const BASE_Y = 0;

/** 발사 앵커가 없을 때 중심에서 벗어날 수 있는 최대 거리. */
const MAX_UNKNOWN_OFFSET_M = 400;

const G = 9.8;
const DROP_SCALE = 0.55;
const SPREAD_RATE = 1.9;

/** 셸 종류. 일본 花火의 대표 형태를 흉내 낸다. 데이터가 아니라 연출이다. */
export type ShellKind =
  | "peony" // 牡丹. 둥근 구, 두 색
  | "chrysanthemum" // 菊. 꼬리가 길게 남는 구
  | "willow" // 柳. 금빛으로 늘어져 떨어진다
  | "ring" // 輪. 한 평면의 고리
  | "glitter" // 銀冠. 은백색이 깜빡이며 오래 남는다
  | "palm"; // 椰子. 굵은 줄기 몇 가닥

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
  kind?: ShellKind;
  /** 안쪽 입자의 색. 없으면 hue 하나로 그린다. */
  hue2?: number;
  /** 중력 배수. 柳는 크고 輪은 작다. */
  gravity?: number;
  /** 퍼지는 속도 배수. 작을수록 천천히 퍼진다. */
  drag?: number;
  /** 꼬리 표본 수. 0이면 꼬리가 없다. */
  trail?: number;
  /** 입자 기본 크기(px). */
  size?: number;
  /** 깜빡임 여부. */
  twinkle?: boolean;
};

const KINDS: readonly ShellKind[] = [
  "peony",
  "peony",
  "chrysanthemum",
  "willow",
  "peony",
  "ring",
  "glitter",
  "chrysanthemum",
  "palm",
  "peony",
];

const HUES = [0xffc46b, 0xff4d6d, 0x8fd0ff, 0xfff0b8, 0x8dffb0, 0xc29bff, 0xff9a3c, 0xff6fd8];
const GOLD = 0xffb857;
const EMBER = 0xff8c42;
const SILVER = 0xfff3dc;

/** seq만으로 결정된다. Math.random을 부르지 않는다. */
export function makeShell(seq: number, t0: number): Shell {
  const a = frac(Math.sin(seq * 12.9898) * 43758.5453);
  const b = frac(Math.sin(seq * 78.233) * 12345.6789);
  const c = frac(Math.sin(seq * 39.425) * 27182.8182);
  const kind = KINDS[seq % KINDS.length];
  const base: Shell = {
    t0,
    riseSec: 1.6 + a * 0.7,
    peakY: 620 + a * 380,
    east: (a - 0.5) * 200,
    north: (b - 0.5) * 200,
    burstR: 200 + b * 160,
    life: 4 + b * 1.5,
    hue: HUES[Math.floor(c * HUES.length) % HUES.length],
    count: 340,
    kind,
    gravity: 1,
    drag: 1,
    trail: 3,
    size: 22,
    twinkle: false,
  };
  switch (kind) {
    case "peony":
      return { ...base, hue2: HUES[(Math.floor(c * HUES.length) + 3) % HUES.length], trail: 3 };
    case "chrysanthemum":
      return { ...base, hue: c < 0.5 ? GOLD : SILVER, hue2: EMBER, trail: 7, size: 20, life: 4.6 + b };
    case "willow":
      return {
        ...base,
        hue: GOLD,
        hue2: EMBER,
        gravity: 1.7,
        drag: 0.75,
        trail: 9,
        size: 17,
        life: 5.4 + b * 1.2,
        burstR: 260 + b * 120,
      };
    case "ring":
      return { ...base, count: 260, gravity: 0.6, trail: 2, size: 24, burstR: 300 + b * 120 };
    case "glitter":
      return { ...base, hue: SILVER, hue2: 0xffffff, twinkle: true, count: 420, trail: 1, size: 15, life: 5 + b, gravity: 0.9 };
    case "palm":
      return {
        ...base,
        hue: GOLD,
        hue2: EMBER,
        count: 56,
        gravity: 1.25,
        drag: 0.7,
        trail: 12,
        size: 34,
        burstR: 320 + b * 140,
        life: 4.4 + b,
      };
  }
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

/**
 * 폭발 입자의 반경·처짐·감쇠.
 * rateScale·gravityScale 은 입자마다 조금씩 다르게 주어 구가 딱딱한 껍질처럼 보이지 않게 한다.
 */
export function burstSpread(
  shell: Shell,
  age: number,
  rateScale = 1,
  gravityScale = 1,
): { spread: number; drop: number; fade: number } {
  const rate = SPREAD_RATE * (shell.drag ?? 1) * rateScale;
  return {
    spread: shell.burstR * (1 - Math.exp(-age * rate)),
    drop: 0.5 * G * age * age * DROP_SCALE * (shell.gravity ?? 1) * gravityScale,
    fade: Math.max(0, 1 - age / shell.life),
  };
}

export type Particle = {
  /** 단위 방향 × 속도 배율. */
  dx: number;
  dy: number;
  dz: number;
  /** 퍼지는 속도 배수(0.8–1.2). */
  rate: number;
  /** 중력 배수(0.7–1.3). */
  gravity: number;
  /** 깜빡임 위상(0–2π). */
  phase: number;
  /** 안쪽 입자면 hue2 를 쓴다. */
  inner: boolean;
};

/**
 * 셸 종류에 맞는 입자 방향. 같은 seed 면 같은 배열이다. Math.random 을 부르지 않는다.
 * - 구형: 균일 구 위 점에 속도 지터
 * - 輪: 무작위로 기울어진 한 평면의 원
 * - 椰子: 위쪽으로 치우친 굵은 줄기 몇 가닥
 */
export function burstParticles(kind: ShellKind, count: number, seed: number): Particle[] {
  const next = prng(seed);
  const out: Particle[] = [];
  const tilt = next() * Math.PI * 0.45;
  const spin = next() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    let z: number;
    let speed: number;
    if (kind === "ring") {
      const theta = (i / count) * Math.PI * 2 + (next() - 0.5) * 0.05;
      const px = Math.cos(theta);
      const pz = Math.sin(theta);
      // 평면을 tilt 만큼 세우고 spin 만큼 돌린다.
      const ty = pz * Math.sin(tilt);
      const tz = pz * Math.cos(tilt);
      x = px * Math.cos(spin) - tz * Math.sin(spin);
      z = px * Math.sin(spin) + tz * Math.cos(spin);
      y = ty;
      speed = 0.94 + next() * 0.08;
    } else if (kind === "palm") {
      const u = 0.15 + next() * 0.85;
      const theta = next() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      x = r * Math.cos(theta);
      y = u;
      z = r * Math.sin(theta);
      speed = 0.7 + next() * 0.3;
    } else {
      const u = next() * 2 - 1;
      const theta = next() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      x = r * Math.cos(theta);
      y = u;
      z = r * Math.sin(theta);
      const tight = kind === "chrysanthemum" || kind === "glitter";
      speed = tight ? 0.82 + next() * 0.18 : 0.5 + next() * 0.5;
    }
    out.push({
      dx: x * speed,
      dy: y * speed,
      dz: z * speed,
      rate: 0.85 + next() * 0.3,
      gravity: 0.75 + next() * 0.5,
      phase: next() * Math.PI * 2,
      inner: speed < 0.7,
    });
  }
  return out;
}

/**
 * 다음 셸까지의 간격(초). 8발마다 한 번은 3발을 거의 동시에 올린다.
 * seq 만으로 정해진다.
 */
export function spawnGap(seq: number): number {
  const volley = seq % 8 === 5 || seq % 8 === 6;
  if (volley) return 0.12;
  const a = frac(Math.sin(seq * 91.17) * 4321.7);
  return 0.55 + a * 0.5;
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

/** mulberry32. 정수 시드에서 0 이상 1 미만 수열을 뽑는다. */
export function prng(seed: number): () => number {
  let a = (seed >>> 0) || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
