# 3D 지도와 발사 지점 불꽃 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 행사·명당 지도를 기울여 지형이 보이게 하고, 발사 추정 지점 위에서 Three.js 불꽃이 터지게 하고, 한 글자 지도 핀을 픽토그램과 단어로 바꾼다.

**Architecture:** MapLibre는 그대로 둔다. 지형은 AWS Terrain Tiles(`terrarium`)를 `raster-dem`으로 물리고 기존 地理院タイル 래스터가 그 위에 덮인다. 불꽃은 MapLibre `type: "custom"` 레이어 안에서 Three.js가 그리고, 카메라 행렬은 MapLibre가 준 것을 그대로 쓴다. 궤적·폭발·미확정 좌표 계산은 전부 `src/domain/burst.ts`의 순수 함수로 빼서 테스트한다.

**Tech Stack:** React 19, Vite 7, TypeScript 5.9, maplibre-gl 5.24, three 0.180, vitest 3

**Spec:** [docs/prd/2026-09-03-map-3d-fireworks.md](../../prd/2026-09-03-map-3d-fireworks.md)

## Global Constraints

- 커밋 작성자·커미터는 항상 `tolaria <tolaria@naver.com>`. `GIT_AUTHOR_NAME=tolaria GIT_AUTHOR_EMAIL=tolaria@naver.com GIT_COMMITTER_NAME=tolaria GIT_COMMITTER_EMAIL=tolaria@naver.com git commit -m "..."`. `Co-Authored-By` 등 트레일러 금지.
- 커밋 메시지 본문은 영어. 코드 주석과 UI 문자열은 한국어(문서 규칙 그대로).
- 지도 타일과 DEM 타일을 저장·재배포·프록시하지 않는다. 브라우저가 직접 읽는다.
- 배경 래스터는 `https://cyberjapandata.gsi.go.jp/xyz/{pale|std}/{z}/{x}/{y}.png` 그대로 둔다.
- 지형 DEM은 `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, `encoding: "terrarium"`.
- 국토지리원 DEM(`dem_png`, `dem5a_png`)은 쓰지 않는다. 무효 화소 `RGB(128,0,0)`이 83,886m 스파이크가 된다.
- 아이콘은 Material Symbols (Apache-2.0) 경로 데이터. JIS Z 8210은 쓰지 않는다.
- 세 언어(`ko`/`ja`/`en`) 어디에도 한 글자 핀 라벨을 남기지 않는다.
- `THREE.Points`는 `sizeAttenuation: false`. MapLibre 투영 행렬 아래서 `true`는 크기를 못 믿는다.
- 지도 레이어·소스 조작은 `map.on("load")`가 아니라 `map.on("style.load")`에 붙인다. 백그라운드 탭은 `document.hidden`이라 `requestAnimationFrame`이 멈추고 `load`가 영영 안 온다.
- 터치 타깃 44px 규칙을 지도 위 명당 핀(`.pin`)에는 적용하지 않는다. 360px에서 겹쳐 지도를 덮는다.
- 새 npm 의존성을 추가하지 않는다. `maplibre-gl`, `three` 둘 다 이미 설치돼 있다.
- 모든 태스크 종료 시 `npm test` 와 `npx tsc --noEmit` 이 초록이어야 한다.

## 파일 구조

| 파일 | 책임 |
| --- | --- |
| `src/domain/burst.ts` (신규) | 셸 궤적·폭발 전개·미확정 좌표. 순수 함수만. `Math.random`/`Date.now` 금지 |
| `tests/domain/burst.test.ts` (신규) | 위 세 함수의 시임 테스트 |
| `src/ui/map/gsi-style.ts` (수정) | 지형 소스, 밤 래스터 paint, sky 루트 속성 |
| `src/ui/map/fireworks-layer.ts` (신규) | MapLibre custom layer + Three.js 렌더. 도메인 계산은 `burst.ts`에 위임 |
| `src/ui/map/pin-icons.ts` (신규) | SVG 픽토그램 마크업 상수. 핀이 명령형 DOM이라 React 컴포넌트가 아니다 |
| `src/ui/map/MapLegend.tsx` (신규) | 접이식 범례. React |
| `src/ui/map/FestivalMap.tsx` (수정) | pitch·지형·불꽃 레이어 배선, 핀 교체, `style.load` 이관 |
| `src/ui/i18n.ts` (수정) | 한 글자 라벨을 단어로. 범례·토글 키 추가 |
| `src/styles.css` (수정) | 핀 칩, 범례 |
| `src/ui/pages/FestivalPage.tsx` (수정) | `?fw=` 토글, 범례 배치, 라벨 키 교체 |
| `src/ui/pages/SpotPage.tsx` (수정) | 라벨 키 교체 |

`FestivalMap.tsx`는 지금 366줄이다. 핀 아이콘과 범례를 빼내므로 늘지 않는다.

---

### Task 1: 불꽃 도메인 순수 함수

**Files:**
- Create: `src/domain/burst.ts`
- Test: `tests/domain/burst.test.ts`

**Interfaces:**
- Consumes: `Coord` from `src/domain/types.ts`; `distanceMetersToLaunch` from `src/domain/spot.ts` (테스트에서만)
- Produces:
  - `export const BASE_Y = 100`
  - `export type Shell = { t0: number; riseSec: number; peakY: number; east: number; north: number; burstR: number; life: number; hue: number; count: number }`
  - `export function makeShell(seq: number, t0: number): Shell`
  - `export function shellAt(shell: Shell, t: number): { x: number; y: number; z: number } | null`
  - `export function burstAge(shell: Shell, t: number): number | null`
  - `export function burstSpread(shell: Shell, age: number): { spread: number; drop: number; fade: number }`
  - `export function unknownLaunchOffset(center: Coord, seed: string): Coord`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/domain/burst.test.ts` 를 새로 만든다.

```ts
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
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run tests/domain/burst.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/domain/burst.ts"`

- [ ] **Step 3: 최소 구현을 쓴다**

`src/domain/burst.ts` 를 새로 만든다.

```ts
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
```

- [ ] **Step 4: 초록을 확인한다**

Run: `npx vitest run tests/domain/burst.test.ts && npx tsc --noEmit`
Expected: 11 tests passed, tsc 출력 없음

- [ ] **Step 5: 커밋**

```bash
git add src/domain/burst.ts tests/domain/burst.test.ts
GIT_AUTHOR_NAME=tolaria GIT_AUTHOR_EMAIL=tolaria@naver.com \
GIT_COMMITTER_NAME=tolaria GIT_COMMITTER_EMAIL=tolaria@naver.com \
git commit -m "feat: add shell trajectory, burst spread, and unknown-launch offset"
```

---

### Task 2: 지형과 밤 하늘

**Files:**
- Modify: `src/ui/map/gsi-style.ts` (전체 교체)
- Modify: `src/ui/map/FestivalMap.tsx:100-143` (Map 생성 옵션과 `load` 훅)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `export const TERRAIN_SOURCE_ID = "terrain"`
  - `gsiStyle(layer: GsiLayer): StyleSpecification` — 지형 소스·밤 paint·sky를 포함한 스타일을 돌려준다. 시그니처는 그대로다.

- [ ] **Step 1: `gsi-style.ts` 를 교체한다**

이 파일에는 테스트를 쓰지 않는다. MapLibre가 해석하는 선언 데이터라, 값을 다시 적는 테스트는 스펙을 두 번 쓰는 것뿐이다. 검증은 Task 7의 실제 Chrome 확인이다.

```ts
import type { StyleSpecification } from "maplibre-gl";

export type GsiLayer = "pale" | "std";

export const TERRAIN_SOURCE_ID = "terrain";

const GSI_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" rel="noreferrer">地理院タイル</a>';

// 국토지리원 DEM은 못 쓴다. 무효 화소 RGB(128,0,0)이 83,886m 벽이 된다.
// 자세한 근거는 docs/prd/2026-09-03-map-3d-fireworks.md D2.
const TERRAIN_ATTRIBUTION =
  "SRTM terrain data courtesy of the U.S. Geological Survey";

export function gsiStyle(layer: GsiLayer): StyleSpecification {
  const id = layer === "pale" ? "pale" : "std";
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      gsi: {
        type: "raster",
        tiles: [`https://cyberjapandata.gsi.go.jp/xyz/${id}/{z}/{x}/{y}.png`],
        tileSize: 256,
        minzoom: 5,
        maxzoom: 18,
        attribution: GSI_ATTRIBUTION,
      },
      [TERRAIN_SOURCE_ID]: {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15,
        attribution: TERRAIN_ATTRIBUTION,
      },
    },
    terrain: { source: TERRAIN_SOURCE_ID, exaggeration: 1.3 },
    sky: {
      "sky-color": "#0a0f24",
      "horizon-color": "#3a2140",
      "fog-color": "#140b1c",
      "fog-ground-blend": 0.5,
      "horizon-fog-blend": 0.6,
      "sky-horizon-blend": 0.8,
      "atmosphere-blend": 0.9,
    },
    layers: [
      {
        id: "bg",
        type: "background",
        paint: { "background-color": "#060814" },
      },
      {
        id: "gsi-raster",
        type: "raster",
        source: "gsi",
        // 타일은 원본 그대로 받고 표시만 밤으로 누른다. 재배포가 아니다.
        paint: {
          "raster-brightness-max": 0.15,
          "raster-brightness-min": 0,
          "raster-saturation": -0.75,
          "raster-contrast": 0.35,
          "raster-opacity": 1,
        },
      },
    ],
  };
}
```

- [ ] **Step 2: `FestivalMap.tsx` 의 지도 생성을 기울인다**

`src/ui/map/FestivalMap.tsx` 에서 `new maplibregl.Map({...})` 호출을 찾아 아래로 바꾼다. 바뀌는 곳은 `zoom` 다음 세 줄과 `maxPitch`다.

```tsx
    const map = new maplibregl.Map({
      container: root.current,
      style: gsiStyle(layer),
      center: [center.lng, center.lat],
      zoom: area?.zoom ?? (launch ? 15 : 5),
      pitch: launch || area ? 83 : 0,
      bearing: 0,
      canvasContextAttributes: { antialias: true },
      attributionControl: false,
      maxPitch: 85,
    });
```

- [ ] **Step 3: 오버레이를 `style.load` 로 옮긴다**

같은 파일에서 아래 블록을 찾는다.

```tsx
    const redraw = () => drawOverlays(map, markers, state.current);
    map.on("load", () => {
      map.resize();
      fitView(map, viewPoints(state.current));
      redraw();
    });
    map.on("style.load", redraw);
```

아래로 바꾼다. `load`는 백그라운드 탭에서 영영 안 온다.

```tsx
    const redraw = () => drawOverlays(map, markers, state.current);
    let firstStyle = true;
    map.on("style.load", () => {
      if (firstStyle) {
        firstStyle = false;
        map.resize();
        fitView(map, viewPoints(state.current));
      }
      redraw();
    });
```

- [ ] **Step 4: 진입 오비트를 넣는다**

스펙 F1의 「90°에 40초」다. 다만 **사용자가 지도를 만지는 순간 멈춘다.** 계속 도는 지도는
패닝과 싸운다. 인트로는 살리고 조작은 뺏지 않는다.

`src/ui/map/FestivalMap.tsx` 의 `useEffect` 안, Task 2 Step 3에서 고친 `style.load` 핸들러 **아래**에 넣는다.

```tsx
    // 진입 오비트. 발사점을 중심으로 90°를 40초에 돈다. 사용자가 만지면 멈춘다.
    let orbiting = launch != null || area != null;
    const stopOrbit = () => {
      if (!orbiting) return;
      orbiting = false;
      map.stop();
    };
    const orbitStep = () => {
      if (!orbiting) return;
      map.easeTo({
        bearing: map.getBearing() + 90,
        duration: 40000,
        easing: (t) => t,
        essential: false,
      });
    };
    map.on("moveend", orbitStep);
    map.on("dragstart", stopOrbit);
    map.on("zoomstart", stopOrbit);
    map.on("rotatestart", stopOrbit);
    map.on("pitchstart", stopOrbit);
```

`essential: false` 라서 `prefers-reduced-motion: reduce` 인 사용자에게는 MapLibre가 애니메이션을
건너뛴다. 스펙의 정지 조건이 카메라에도 그대로 걸린다.

정리 함수에 리스너 해제를 추가한다. Task 4에서 같은 정리 함수를 또 고치므로 순서에 주의한다.

```tsx
      map.off("moveend", orbitStep);
      map.off("dragstart", stopOrbit);
      map.off("zoomstart", stopOrbit);
      map.off("rotatestart", stopOrbit);
      map.off("pitchstart", stopOrbit);
```

`style.load` 핸들러 끝(`redraw();` 다음)에서 첫 회전을 시작한다.

```tsx
      if (orbiting) orbitStep();
```

- [ ] **Step 5: 타입과 테스트를 돌린다**

Run: `npx tsc --noEmit && npm test`
Expected: tsc 출력 없음, 기존 56 + 신규 11 = 67 tests passed

- [ ] **Step 6: 커밋**

```bash
git add src/ui/map/gsi-style.ts src/ui/map/FestivalMap.tsx
GIT_AUTHOR_NAME=tolaria GIT_AUTHOR_EMAIL=tolaria@naver.com \
GIT_COMMITTER_NAME=tolaria GIT_COMMITTER_EMAIL=tolaria@naver.com \
git commit -m "feat: tilt the map onto night terrain from open elevation tiles"
```

---

### Task 3: 불꽃 custom layer

**Files:**
- Create: `src/ui/map/fireworks-layer.ts`

**Interfaces:**
- Consumes: `BASE_Y`, `Shell`, `makeShell`, `shellAt`, `burstAge`, `burstSpread` from `src/domain/burst.ts`; `Coord` from `src/domain/types.ts`
- Produces:
  - `export const FIREWORKS_LAYER_ID = "fireworks"`
  - `export type FireworksLayer = maplibregl.CustomLayerInterface & { setRunning(on: boolean): void }`
  - `export function createFireworksLayer(origin: Coord): FireworksLayer`

- [ ] **Step 1: 파일을 만든다**

이 파일에는 유닛 테스트를 쓰지 않는다. WebGL 렌더와 MapLibre 카메라는 목하지 않는다는 스펙 결정이다. 계산은 전부 Task 1에서 이미 테스트했다.

`src/ui/map/fireworks-layer.ts`:

```ts
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

      const texture = sparkTexture();
      groups = [];
      shells = [];

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
```

- [ ] **Step 2: 타입을 확인한다**

Run: `npx tsc --noEmit`
Expected: 출력 없음

- [ ] **Step 3: 기존 테스트가 그대로인지 본다**

Run: `npm test`
Expected: 67 tests passed

- [ ] **Step 4: 커밋**

```bash
git add src/ui/map/fireworks-layer.ts
GIT_AUTHOR_NAME=tolaria GIT_AUTHOR_EMAIL=tolaria@naver.com \
GIT_COMMITTER_NAME=tolaria GIT_COMMITTER_EMAIL=tolaria@naver.com \
git commit -m "feat: burst fireworks over the launch anchor in a custom map layer"
```

---

### Task 4: 불꽃 배선과 정지 조건

**Files:**
- Modify: `src/ui/map/FestivalMap.tsx` (Props, 레이어 부착, 정지 조건)
- Modify: `src/ui/pages/FestivalPage.tsx` (`?fw=` 토글, prop 전달)
- Modify: `src/ui/pages/SpotPage.tsx` (prop 전달)
- Modify: `src/ui/i18n.ts` (토글 라벨)

**Interfaces:**
- Consumes: `createFireworksLayer`, `FIREWORKS_LAYER_ID` from `src/ui/map/fireworks-layer.ts`; `unknownLaunchOffset` from `src/domain/burst.ts`
- Produces: `FestivalMap` 에 `fireworks?: boolean` 과 `fireworksSeed?: string` prop 추가

- [ ] **Step 1: i18n에 토글 라벨을 넣는다**

`src/ui/i18n.ts` 의 `ko` 객체에서 `pitch: "고각",` 바로 위에 넣는다.

```ts
  overlayFireworks: "불꽃",
```

`ja` 객체의 같은 자리에:

```ts
  overlayFireworks: "花火",
```

`en` 객체의 같은 자리에:

```ts
  overlayFireworks: "Fireworks",
```

- [ ] **Step 2: `FestivalMap` 에 prop을 추가한다**

`src/ui/map/FestivalMap.tsx` 의 `type Props` 안에서 `showCrowd?: boolean;` 아래에 넣는다.

```tsx
  fireworks?: boolean;
  fireworksSeed?: string;
```

같은 파일에서 구조 분해 목록의 `showCrowd = false,` 아래에 넣는다.

```tsx
  fireworks = true,
  fireworksSeed,
```

`state.current` 를 만드는 두 객체 리터럴 모두에 `fireworks,` 와 `fireworksSeed,` 를 추가한다. 두 곳 다 고쳐야 한다. 빠뜨리면 값이 갱신되지 않는다.

`useEffect` 의존성 배열(`[launch, area, station, spots, ...]`)에도 `fireworks`, `fireworksSeed` 를 추가한다.

- [ ] **Step 3: 레이어를 붙이고 정지 조건을 건다**

같은 파일 상단 import에 추가한다.

```tsx
import { unknownLaunchOffset } from "../../domain/burst.ts";
import { createFireworksLayer, FIREWORKS_LAYER_ID } from "./fireworks-layer.ts";
```

`const mapRef = useRef<maplibregl.Map | null>(null);` 아래에 추가한다.

```tsx
  const fireworksRef = useRef<ReturnType<typeof createFireworksLayer> | null>(null);
```

Task 2에서 만든 `style.load` 핸들러 안, `redraw();` 앞에 레이어 부착을 넣는다.

```tsx
    map.on("style.load", () => {
      if (firstStyle) {
        firstStyle = false;
        map.resize();
        fitView(map, viewPoints(state.current));
      }
      if (!map.getLayer(FIREWORKS_LAYER_ID)) {
        const seed = state.current.fireworksSeed ?? "unknown";
        const base = state.current.launch ?? state.current.area?.coord ?? null;
        if (base) {
          const anchor = state.current.launch ?? unknownLaunchOffset(base, seed);
          const created = createFireworksLayer(anchor);
          fireworksRef.current = created;
          map.addLayer(created);
        }
      }
      redraw();
    });
```

같은 `useEffect` 안, `const ro = new ResizeObserver(...)` 앞에 정지 조건을 건다.

```tsx
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncRunning = () => {
      fireworksRef.current?.setRunning(
        state.current.fireworks !== false && !document.hidden && !reduced.matches,
      );
    };
    document.addEventListener("visibilitychange", syncRunning);
    reduced.addEventListener("change", syncRunning);
    syncRunning();
```

같은 `useEffect` 의 정리 함수에서 리스너를 뗀다.

```tsx
    return () => {
      document.removeEventListener("visibilitychange", syncRunning);
      reduced.removeEventListener("change", syncRunning);
      ro.disconnect();
      for (const marker of markers.current) marker.remove();
      markers.current = [];
      fireworksRef.current = null;
      map.remove();
      mapRef.current = null;
    };
```

prop이 바뀔 때 반영되도록, 기존 `drawOverlays` 재호출 `useEffect` 아래에 하나 더 둔다.

```tsx
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    fireworksRef.current?.setRunning(
      fireworks !== false && !document.hidden && !reduced.matches,
    );
  }, [fireworks]);
```

- [ ] **Step 4: `FestivalPage` 에 토글을 붙인다**

`src/ui/pages/FestivalPage.tsx` 에서 `const showCrowd = params.get("crowd") !== "0";` 아래에 넣는다.

```tsx
  const showFireworks = params.get("fw") !== "0";
```

`<FestivalMap ... />` 호출에서 `showCrowd={showCrowd && tab !== "settings"}` 아래에 넣는다.

```tsx
        fireworks={showFireworks}
        fireworksSeed={festival.id}
```

`.toggles` 안 `showCrowd` 체크박스 `</label>` 바로 뒤에 같은 모양으로 하나 더 넣는다.

```tsx
              <label>
                <input
                  type="checkbox"
                  checked={showFireworks}
                  onChange={(e) => {
                    params.set("fw", e.target.checked ? "1" : "0");
                    setParams(params, { replace: true });
                  }}
                />
                {t.overlayFireworks}
              </label>
```

- [ ] **Step 5: `SpotPage` 에도 전달한다**

`src/ui/pages/SpotPage.tsx` 의 `<FestivalMap ... />` 호출에서 `showCrowd` 아래에 넣는다.

```tsx
        fireworks
        fireworksSeed={festival.id}
```

- [ ] **Step 6: 타입과 테스트를 돌린다**

Run: `npx tsc --noEmit && npm test`
Expected: tsc 출력 없음, 67 tests passed

- [ ] **Step 7: 커밋**

```bash
git add src/ui/map/FestivalMap.tsx src/ui/pages/FestivalPage.tsx src/ui/pages/SpotPage.tsx src/ui/i18n.ts
GIT_AUTHOR_NAME=tolaria GIT_AUTHOR_EMAIL=tolaria@naver.com \
GIT_COMMITTER_NAME=tolaria GIT_COMMITTER_EMAIL=tolaria@naver.com \
git commit -m "feat: wire the fireworks layer with a toggle and motion guards"
```

---

### Task 5: 픽토그램 핀과 단어 라벨

**Files:**
- Create: `src/ui/map/pin-icons.ts`
- Modify: `src/ui/map/FestivalMap.tsx` (`pin()` 함수와 호출부)
- Modify: `src/ui/i18n.ts` (한 글자 라벨 → 단어)
- Modify: `src/ui/pages/FestivalPage.tsx`, `src/ui/pages/SpotPage.tsx` (`pinApprox` → `pinLaunchUnknown`)
- Modify: `src/styles.css` (핀 칩)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `export type PinKind = "launch" | "launchUnknown" | "station" | "share"`
  - `export function pinIcon(kind: PinKind): string` — `<svg>` 마크업 문자열

- [ ] **Step 1: 픽토그램 파일을 만든다**

`src/ui/map/pin-icons.ts`:

```ts
/**
 * 지도 핀 픽토그램.
 * 역·미확정·공유는 Material Symbols (Apache-2.0) 경로 데이터다.
 * 발사 지점 버스트는 자체 제작이다. 花火 도기호가 어느 표준에도 없다.
 * JIS Z 8210은 쓰지 않는다. 근거는 docs/prd/2026-09-03-map-3d-fireworks.md D5.
 */
export type PinKind = "launch" | "launchUnknown" | "station" | "share";

const BOX = 'viewBox="0 -960 960 960" width="16" height="16" aria-hidden="true" focusable="false"';

const PATHS: Record<PinKind, string> = {
  // 자체 제작: 중심에서 여덟 갈래로 터지는 버스트
  launch:
    "M450-820h60v170h-60v-170Zm0 500h60v170h-60v-170Zm370-190v60H650v-60h170Zm-500 0v60H150v-60h170Zm372-282 42 42-120 120-42-42 120-120ZM268-310l42 42-120 120-42-42 120-120Zm424 302-120-120 42-42 120 120-42 42ZM190-732l120 120-42 42-120-120 42-42ZM480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560Z",
  // Material Symbols: not_listed_location
  launchUnknown:
    "M480-320q17 0 29.5-12.5T522-362q0-17-12.5-29.5T480-404q-17 0-29.5 12.5T438-362q0 17 12.5 29.5T480-320Zm-30-124h60q0-19 1.5-30t4.5-18q4-8 11.5-16.5T552-534q21-21 31.5-42t10.5-42q0-47-31-74.5T480-720q-41 0-72 23t-42 61l54 22q7-23 23-35.5t37-12.5q24 0 39 13t15 33q0 17-7.5 29.5T500-558q-17 14-27 25.5T458-510q-5 10-6.5 24.5T450-444Zm30 364Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z",
  // Material Symbols: directions_railway
  station:
    "M160-80l80-80h480l80 80H160Zm120-120 40-40h-20q-58 0-99-41t-41-99v-260q0-129 92.5-204.5T480-920q135 0 227.5 75.5T800-640v260q0 58-41 99t-99 41h-20l40 40H280Zm20-120h360q25 0 42.5-17.5T720-380v-140H240v140q0 25 17.5 42.5T300-320Zm180-40q25 0 42.5-17.5T540-420q0-25-17.5-42.5T480-480q-25 0-42.5 17.5T420-420q0 25 17.5 42.5T480-360ZM240-600h480v-40q0-23-4.5-42.5T703-720H257q-8 18-12.5 37.5T240-640v40Z",
  // Material Symbols: share
  share:
    "M720-80q-50 0-85-35t-35-85q0-7 1-14.5t3-13.5L322-392q-17 15-38 23.5t-44 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q23 0 44 8.5t38 23.5l282-164q-2-6-3-13.5t-1-14.5q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-23 0-44-8.5T638-672L356-508q2 6 3 13.5t1 14.5q0 7-1 14.5t-3 13.5l282 164q17-15 38-23.5t44-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Z",
};

export function pinIcon(kind: PinKind): string {
  return `<svg ${BOX}><path fill="currentColor" d="${PATHS[kind]}"/></svg>`;
}
```

- [ ] **Step 2: i18n의 한 글자 라벨을 단어로 바꾼다**

`src/ui/i18n.ts` 의 `ko` 객체에서 `pinApprox: "대략",` 를 지우고 `pinLaunch`/`pinShare`/`pinStation` 세 줄과 함께 아래로 바꾼다.

```ts
  pinLaunch: "발사 지점",
  pinLaunchUnknown: "발사 지점 미확정",
  pinShare: "공유 위치",
  pinStation: "가까운 역",
```

`ja` 객체의 대응 네 줄:

```ts
  pinLaunch: "打上げ地点",
  pinLaunchUnknown: "打上げ地点 未確定",
  pinShare: "共有した位置",
  pinStation: "最寄り駅",
```

`en` 객체의 대응 네 줄:

```ts
  pinLaunch: "Launch point",
  pinLaunchUnknown: "Launch point unknown",
  pinShare: "Shared spot",
  pinStation: "Nearest station",
```

`ja`/`en` 은 `Record<keyof typeof ko, string>` 이라 `pinApprox` 를 지우고 `pinLaunchUnknown` 을 넣지 않으면 tsc가 잡는다.

- [ ] **Step 3: 호출부의 `pinApprox` 를 바꾼다**

`src/ui/pages/FestivalPage.tsx` 와 `src/ui/pages/SpotPage.tsx` 의 `labels` 객체에서 `approx: t.pinApprox,` 를 아래로 바꾼다. 두 파일 다 있다.

```tsx
          approx: t.pinLaunchUnknown,
```

- [ ] **Step 4: `pin()` 이 아이콘과 단어를 같이 그리게 한다**

`src/ui/map/FestivalMap.tsx` 상단 import에 추가한다.

```tsx
import { pinIcon, type PinKind } from "./pin-icons.ts";
```

파일 맨 아래 `pin()` 함수를 아래로 바꾼다.

```tsx
function pin(
  map: maplibregl.Map,
  coord: Coord,
  className: string,
  kind: PinKind,
  label: string,
  aria: string,
) {
  const el = document.createElement("button");
  el.className = className;
  el.type = "button";
  // 마크업은 우리 상수뿐이다. 사용자 입력이 들어오지 않는다.
  el.innerHTML = pinIcon(kind);
  const text = document.createElement("span");
  text.textContent = label;
  el.appendChild(text);
  el.setAttribute("aria-label", aria);
  return new maplibregl.Marker({ element: el }).setLngLat([coord.lng, coord.lat]).addTo(map);
}
```

`drawOverlays` 안의 네 호출을 아래로 바꾼다. 한 글자 폴백을 전부 없앤다.

```tsx
  if (props.launch) {
    markers.current.push(
      pin(map, props.launch, "pin pin-launch", "launch",
        props.labels?.launch ?? "발사 지점",
        props.labels?.launchAria ?? "발사 지점"),
    );
  } else if (props.area && props.area.precision !== "launch") {
    markers.current.push(
      pin(map, props.area.coord, "pin pin-approx", "launchUnknown",
        props.labels?.approx ?? "발사 지점 미확정",
        props.labels?.approxAria ?? props.labels?.approx ?? "발사 지점 미확정"),
    );
  }

  if (props.station) {
    markers.current.push(
      pin(map, props.station, "pin pin-station", "station",
        props.labels?.station ?? "가까운 역",
        props.labels?.stationAria ?? props.labels?.station ?? "가까운 역"),
    );
  }

  if (props.sharePin) {
    markers.current.push(
      pin(map, props.sharePin, "pin pin-share", "share",
        props.labels?.share ?? "공유 위치",
        props.labels?.shareAria ?? "공유 위치"),
    );
  }
```

- [ ] **Step 5: 칩 모양 CSS를 넣는다**

`src/styles.css` 의 `.pin { ... }` 블록을 아래로 바꾼다. 명당 번호 핀은 정사각이고, 아이콘 핀은 라벨이 붙어 가로로 늘어난다.

```css
.pin {
  min-width: 28px;
  height: 28px;
  border-radius: var(--r2);
  border: 1px solid rgba(255, 255, 255, 0.55);
  color: #1a0b06;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 6px;
  line-height: 1;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}
.pin svg { flex: 0 0 auto; }
.pin-open,
.pin-paid,
.pin-vehicle,
.pin-blocked {
  width: 28px;
  padding: 0;
}
```

기존 `.pin-approx { ... }` 블록은 지운다. 이제 모든 아이콘 핀이 같은 규칙을 쓴다.

- [ ] **Step 6: 세 언어 어디에도 한 글자가 남지 않았는지 본다**

Run: `grep -nE '"(발|공|역|打|共|駅|L|S|St)"' src/ui/i18n.ts src/ui/map/FestivalMap.tsx`
Expected: 출력 없음

- [ ] **Step 7: 타입과 테스트를 돌린다**

Run: `npx tsc --noEmit && npm test`
Expected: tsc 출력 없음, 67 tests passed

- [ ] **Step 8: 커밋**

```bash
git add src/ui/map/pin-icons.ts src/ui/map/FestivalMap.tsx src/ui/i18n.ts src/ui/pages/FestivalPage.tsx src/ui/pages/SpotPage.tsx src/styles.css
GIT_AUTHOR_NAME=tolaria GIT_AUTHOR_EMAIL=tolaria@naver.com \
GIT_COMMITTER_NAME=tolaria GIT_COMMITTER_EMAIL=tolaria@naver.com \
git commit -m "feat: replace one-character map pins with pictograms and words"
```

---

### Task 6: 범례

**Files:**
- Create: `src/ui/map/MapLegend.tsx`
- Modify: `src/ui/i18n.ts` (범례 문자열)
- Modify: `src/ui/pages/FestivalPage.tsx` (범례 배치)
- Modify: `src/styles.css` (범례 스타일)

**Interfaces:**
- Consumes: `pinIcon` from `src/ui/map/pin-icons.ts`; `useLang` from `src/ui/Lang.tsx`
- Produces: `export function MapLegend(): JSX.Element`

- [ ] **Step 1: i18n에 범례 문자열을 넣는다**

`src/ui/i18n.ts` 의 `ko` 객체에서 `overlayFireworks: "불꽃",` 아래에 넣는다.

```ts
  legend: "범례",
  legendSpotOpen: "설 수 있음",
  legendSpotPaid: "유료 게이트",
  legendSpotBlocked: "통제로 못 섬",
  legendSpotNumber: "번호는 아래 목록 순서입니다.",
```

`ja` 객체의 같은 자리:

```ts
  legend: "凡例",
  legendSpotOpen: "立てる",
  legendSpotPaid: "有料ゲート",
  legendSpotBlocked: "規制で立てない",
  legendSpotNumber: "番号は下のリストの順です。",
```

`en` 객체의 같은 자리:

```ts
  legend: "Legend",
  legendSpotOpen: "Can stand here",
  legendSpotPaid: "Paid gate",
  legendSpotBlocked: "Blocked by control",
  legendSpotNumber: "Numbers follow the list below.",
```

- [ ] **Step 2: 범례 컴포넌트를 만든다**

`src/ui/map/MapLegend.tsx`:

```tsx
import { useLang } from "../Lang.tsx";
import { pinIcon, type PinKind } from "./pin-icons.ts";

function Glyph({ kind }: { kind: PinKind }) {
  return <span className="legend-glyph" dangerouslySetInnerHTML={{ __html: pinIcon(kind) }} />;
}

/** 접어 둔 상태로 시작한다. 360px에서 지도를 덮지 않는다. */
export function MapLegend() {
  const { t } = useLang();
  return (
    <details className="legend">
      <summary>{t.legend}</summary>
      <ul>
        <li>
          <Glyph kind="launch" /> {t.pinLaunch}
        </li>
        <li>
          <Glyph kind="launchUnknown" /> {t.pinLaunchUnknown}
        </li>
        <li>
          <Glyph kind="station" /> {t.pinStation}
        </li>
        <li>
          <Glyph kind="share" /> {t.pinShare}
        </li>
        <li>
          <span className="pin pin-open legend-chip">1</span> {t.legendSpotOpen}
        </li>
        <li>
          <span className="pin pin-paid legend-chip">1</span> {t.legendSpotPaid}
        </li>
        <li>
          <span className="pin pin-blocked legend-chip">1</span> {t.legendSpotBlocked}
        </li>
      </ul>
      <p className="note">{t.legendSpotNumber}</p>
    </details>
  );
}
```

`useLang()` 은 `{ lang, setLang, t }` 를 돌려준다 (`src/ui/Lang.tsx`). 여기서는 `t` 만 쓴다.

- [ ] **Step 3: 범례를 지도 위에 놓는다**

`src/ui/pages/FestivalPage.tsx` 상단 import에 추가한다.

```tsx
import { MapLegend } from "../map/MapLegend.tsx";
```

`<FestivalMap ... />` 닫는 태그 바로 다음 줄에 넣는다.

```tsx
      <MapLegend />
```

- [ ] **Step 4: 범례 CSS를 넣는다**

`src/styles.css` 의 `.maplibregl-ctrl-attrib { font-size: 10px; }` 바로 위에 넣는다.

```css
.legend {
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  z-index: 3;
  max-width: min(15rem, calc(100vw - 1rem));
  border-radius: var(--r4);
  padding: 0.4rem 0.6rem;
  background: rgba(18, 12, 16, 0.55);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--ink);
  font-size: 0.8rem;
}
.legend summary { cursor: pointer; min-height: 32px; display: flex; align-items: center; }
.legend ul { list-style: none; margin: 0.4rem 0 0; padding: 0; display: grid; gap: 0.35rem; }
.legend li { display: flex; align-items: center; gap: 0.45rem; }
.legend-glyph { display: inline-flex; color: var(--ink); }
.legend-chip { pointer-events: none; }
```

- [ ] **Step 5: 타입과 테스트를 돌린다**

Run: `npx tsc --noEmit && npm test`
Expected: tsc 출력 없음, 67 tests passed

- [ ] **Step 6: 커밋**

```bash
git add src/ui/map/MapLegend.tsx src/ui/i18n.ts src/ui/pages/FestivalPage.tsx src/styles.css
GIT_AUTHOR_NAME=tolaria GIT_AUTHOR_EMAIL=tolaria@naver.com \
GIT_COMMITTER_NAME=tolaria GIT_COMMITTER_EMAIL=tolaria@naver.com \
git commit -m "feat: explain every map pictogram in a collapsed legend"
```

---

### Task 7: 실제 브라우저 검수와 정리

**Files:**
- Delete: `proto.html`, `proto-main.ts` (리포 루트의 추적되지 않는 프로토타입)
- Modify: `README.md` (출처 두 줄)
- Modify: `docs/prd/2026-09-03-map-3d-fireworks.md` (성공 기준 결과 기록)

**Interfaces:**
- Consumes: 앞의 모든 태스크
- Produces: 없음

- [ ] **Step 1: 프로토타입을 지운다**

```bash
rm -f proto.html proto-main.ts
git status --short
```
Expected: `proto.html` / `proto-main.ts` 가 목록에 없다

- [ ] **Step 2: 빌드하고 미리보기를 띄운다**

```bash
GITHUB_PAGES=1 npm run build
GITHUB_PAGES=1 npx vite preview --port 4173
```
Expected: 빌드 성공, `Local: http://localhost:4173/lumos-fireworks/`

- [ ] **Step 3: 실제 Chrome에서 성공 기준을 하나씩 본다**

`http://localhost:4173/lumos-fireworks/e/atami-kaijo-2026-09-13` 을 **포그라운드 창**에서 연다. 백그라운드 탭은 `requestAnimationFrame`이 멈춰 지도가 비어 보인다. 지도가 검게 나오면 창을 앞으로 가져오고 다시 본다.

확인할 것:

1. 지도가 기울어져 있고 熱海湾을 둘러싼 산의 기복이 보인다. 바다에 벽이 서지 않는다.
2. 발사 지점 위로 불꽃이 터진다. 지도를 드래그해 돌리면 불꽃도 같이 돈다.
2-1. 들어가면 카메라가 저절로 천천히 돈다. 지도를 드래그하는 순간 멈추고 다시 돌지 않는다.
3. 핀에 픽토그램과 단어가 같이 있다. 한 글자 핀이 없다.
4. 범례를 펼치면 각 픽토그램의 뜻이 단어로 나온다.
5. 설정 탭의 `불꽃` 체크를 끄면 멈추고, 켜면 다시 터진다. URL에 `fw=0` 이 붙는다.
6. 언어를 日本語·English로 바꿔도 핀과 범례가 그 언어로 바뀐다.

발사 앵커가 없는 행사도 본다: `http://localhost:4173/lumos-fireworks/e/suwako-shinsaku-2026-09-12` (`launch: null`).

7. 「발사 지점 미확정」 핀이 뜨고, 화면 어디에도 거리(m)가 없다.
8. 새로고침해도 불꽃이 같은 자리에서 터진다 (시드가 `festival.id`라서).

- [ ] **Step 4: 360px과 reduced-motion을 본다**

Chrome 창을 좁힐 수 없으면 같은 출처에서 iframe으로 뷰포트를 만든다. 콘솔에 붙여 넣는다.

```js
document.head.querySelectorAll('style,link[rel=stylesheet]').forEach(e=>e.remove());
document.body.innerHTML=''; document.body.style.cssText='margin:0;background:#222';
const f=document.createElement('iframe');
f.style.cssText='width:360px;height:740px;border:0;display:block';
f.src='/lumos-fireworks/e/atami-kaijo-2026-09-13';
document.body.appendChild(f);
```

확인할 것: 가로 스크롤이 없다 (`f.contentDocument.documentElement.scrollWidth === 360`). 범례가 접힌 상태로 지도를 덮지 않는다.

`prefers-reduced-motion` 은 Chrome DevTools의 Rendering 패널에서 `Emulate CSS media feature prefers-reduced-motion: reduce` 로 켠다. 불꽃이 멈춰야 한다.

- [ ] **Step 5: README의 출처를 두 줄로 만든다**

`README.md` 의 지도 출처 문단을 아래로 바꾼다.

```markdown
지도 배경은 국토지리원 [地理院タイル](https://maps.gsi.go.jp/development/ichiran.html)입니다. 지형 표고는 AWS Terrain Tiles(SRTM terrain data courtesy of the U.S. Geological Survey)입니다. 어느 쪽도 저장·재배포하지 않습니다.

지도 픽토그램은 [Material Symbols](https://github.com/google/material-design-icons) (Apache-2.0)입니다. 발사 지점 아이콘만 자체 제작입니다.
```

- [ ] **Step 6: PRD에 결과를 적는다**

`docs/prd/2026-09-03-map-3d-fireworks.md` 의 `## 7. 성공 기준` 바로 아래에 한 줄을 넣는다. 실제로 본 것만 적는다. 안 본 항목은 안 봤다고 적는다.

```markdown
> 2026-09-04 macOS Chrome 확인. 1–8 통과. 360px 가로 스크롤 없음. reduced-motion에서 정지 확인.
```

통과하지 못한 항목이 있으면 그 번호와 관측한 것을 그대로 쓴다. 통과로 적지 않는다.

- [ ] **Step 7: 전체 검증**

Run: `npm test && npx tsc --noEmit && GITHUB_PAGES=1 npm run build`
Expected: 67 tests passed, tsc 출력 없음, 빌드 성공

- [ ] **Step 8: 커밋**

```bash
git add README.md docs/prd/2026-09-03-map-3d-fireworks.md
GIT_AUTHOR_NAME=tolaria GIT_AUTHOR_EMAIL=tolaria@naver.com \
GIT_COMMITTER_NAME=tolaria GIT_COMMITTER_EMAIL=tolaria@naver.com \
git commit -m "docs: credit both tile sources and record the browser check"
```

---

## 배포

배포는 이 계획에 넣지 않는다. 사용자가 그 턴에 명시적으로 지시할 때만 한다. 지시가 오면 직전 사이클과 같은 절차다 — `ChungHwemo/lumos-fireworks` 에 push → CI 확인 → `rsync -a --delete dist/` 로 `Hwemo-Chung.github.io/lumos-fireworks/` 갱신 → `gh auth switch --user Hwemo-Chung` → push → 계정 복귀.
