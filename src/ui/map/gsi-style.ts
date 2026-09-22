import type {
  LayerSpecification,
  SourceSpecification,
  StyleSpecification,
} from "maplibre-gl";
import gsiOptimalStd from "./gsi-optimal-std.json";

/**
 * 지도 배경 셋.
 * - night: 国土地理院 최적화 벡터타일을 밤 팔레트로 다시 칠한 기본 지도. 글자·도로·물이 읽힌다.
 * - photo: 地理院タイル 시무리스 공중사진을 어둡게 눌러 위성 야경처럼 쓴다.
 * - pale:  地理院タイル 淡色地図 래스터. 낮에 읽기 편하다.
 * 타일은 어느 쪽도 저장·프록시하지 않는다.
 */
export type MapStyleId = "night" | "photo" | "pale";

export const MAP_STYLES: readonly MapStyleId[] = ["night", "photo", "pale"];

export function parseMapStyle(raw: string | null): MapStyleId {
  if (raw === "photo" || raw === "pale") return raw;
  return "night";
}

const TERRAIN_SOURCE_ID = "terrain";

const GSI_TILE_LINK =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" rel="noreferrer">地理院タイル</a>';
const GSI_VECTOR_LINK =
  '<a href="https://github.com/gsi-cyberjapan/optimal_bvmap" rel="noreferrer">国土地理院最適化ベクトルタイル</a>';
const PICTOGRAM_CREDIT =
  'pictograms <a href="https://github.com/google/material-design-icons" rel="noreferrer">Material Symbols</a> (Apache-2.0)';

// 국토지리원 DEM은 못 쓴다. 무효 화소 RGB(128,0,0)이 83,886m 벽이 된다.
// 자세한 근거는 docs/prd/2026-09-03-map-3d-fireworks.md D2.
const TERRAIN_ATTRIBUTION = "SRTM terrain data courtesy of the U.S. Geological Survey";

const terrainSource: SourceSpecification = {
  type: "raster-dem",
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  encoding: "terrarium",
  tileSize: 256,
  maxzoom: 15,
  attribution: TERRAIN_ATTRIBUTION,
};

const NIGHT_SKY: StyleSpecification["sky"] = {
  "sky-color": "#070b1a",
  "horizon-color": "#2b1a33",
  "fog-color": "#0e0a16",
  "fog-ground-blend": 0.55,
  "horizon-fog-blend": 0.65,
  "sky-horizon-blend": 0.8,
  "atmosphere-blend": 0.9,
};

const TERRAIN = { source: TERRAIN_SOURCE_ID, exaggeration: 1.3 } as const;

export function gsiTileUrl(layer: "pale" | "std" | "seamlessphoto"): string {
  const ext = layer === "seamlessphoto" ? "jpg" : "png";
  return `https://cyberjapandata.gsi.go.jp/xyz/${layer}/{z}/{x}/{y}.${ext}`;
}

export function mapStyle(id: MapStyleId): StyleSpecification {
  switch (id) {
    case "night":
      return nightStyle();
    case "photo":
      return rasterStyle({
        tiles: gsiTileUrl("seamlessphoto"),
        minzoom: 2,
        maxzoom: 18,
        attribution: `${GSI_TILE_LINK}（シームレス空中写真） · ${PICTOGRAM_CREDIT}`,
        // 위성 사진은 밝기만 눌러도 야경이 된다. 채도는 조금만 뺀다.
        paint: {
          "raster-brightness-max": 0.62,
          "raster-brightness-min": 0,
          "raster-saturation": -0.25,
          "raster-contrast": 0.12,
        },
        background: "#05070f",
      });
    case "pale":
      return rasterStyle({
        tiles: gsiTileUrl("pale"),
        minzoom: 5,
        maxzoom: 18,
        attribution: `${GSI_TILE_LINK} · ${PICTOGRAM_CREDIT}`,
        // 淡色地図는 원본이 밝다. 글자가 읽히는 선까지만 어둡게 누른다.
        paint: {
          "raster-brightness-max": 0.72,
          "raster-brightness-min": 0.04,
          "raster-saturation": -0.3,
          "raster-contrast": 0.1,
        },
        background: "#1a1c22",
      });
  }
}

function rasterStyle(options: {
  tiles: string;
  minzoom: number;
  maxzoom: number;
  attribution: string;
  paint: Record<string, number>;
  background: string;
}): StyleSpecification {
  return {
    version: 8,
    sources: {
      gsi: {
        type: "raster",
        tiles: [options.tiles],
        tileSize: 256,
        minzoom: options.minzoom,
        maxzoom: options.maxzoom,
        attribution: options.attribution,
      },
      [TERRAIN_SOURCE_ID]: terrainSource,
    },
    terrain: TERRAIN,
    sky: NIGHT_SKY,
    layers: [
      { id: "bg", type: "background", paint: { "background-color": options.background } },
      // 타일은 원본 그대로 받고 표시만 어둡게 누른다. 재배포가 아니다.
      { id: "gsi-raster", type: "raster", source: "gsi", paint: options.paint },
    ],
  };
}

// ---------------------------------------------------------------------------
// 야경 벡터 스타일. 国土地理院이 공개한 표준지도풍 스타일(gsi-optimal-std.json)의
// 색만 역할별로 바꾼다. 레이어 구조·필터·굵기는 원본 그대로다.
// ---------------------------------------------------------------------------

const NIGHT = {
  land: "#0f1218",
  water: "#0a1728",
  waterLow: "#1f3d66",
  waterEdge: "#2a5a9e",
  coastLow: "#2f6f9a",
  gray: "#4a505c",
  grayDim: "#2c313b",
  roadFill: "#414957",
  roadMinor: "#363c47",
  roadCasing: "rgba(9,11,16,0.9)",
  roadNational: "#b0645c",
  roadNationalCasing: "rgba(80,34,30,0.9)",
  roadPref: "#a08c3e",
  roadPrefCasing: "rgba(70,60,20,0.9)",
  motorway: "#3f9a5c",
  motorwayCasing: "rgba(25,70,40,0.9)",
  darkCasing: "#0a0c12",
  rail: "#8a90a0",
  railDash: "#151820",
  railStation: "#c8ccd6",
  railMinor: "#5a6070",
  subway: "#2f7f9a",
  building: "#1e222b",
  buildingAlt: "#222731",
  buildingHot: "#3a322c",
  buildingOutline: "#2c3039",
  structure: "#3a2f2a",
  structureLine: "#5a4a40",
  waterStructure: "#1f242c",
  // 등고선은 지형 질감만 남기고 물러선다. 도로·글자보다 앞에 서면 지도가 시끄럽다.
  contour: "rgba(140,115,70,0.22)",
  contourText: "rgba(190,160,100,0.75)",
  isobath: "rgba(50,100,170,0.35)",
  admin: "rgba(120,100,180,0.55)",
  adminNation: "#7a7a7a",
  redLine: "#7a2a3a",
  maroon: "#6a3030",
  text: "#e8ebf1",
  text2: "#d2d7df",
  text3: "#b9bfc9",
  textWhite: "#f2f4f6",
  textWater: "#8ab8ff",
  textBlue: "#9dbcff",
  textBrown: "#e2a878",
  textGreen: "#86d1b0",
  textIndigo: "#b3a9ff",
  textDarkBrown: "#dcb492",
  textPurple: "#cfa6ec",
  halo: "rgba(8,10,16,0.92)",
  wetland: "#122019",
  bareland: "#1a1e26",
  grassland: "#161b19",
  darkFill: "#2a2e38",
} as const;

type Rgba = { r: number; g: number; b: number; a: number };

const COLOR_RE = /^(?:#|rgb|hsl)/i;

function parseColor(value: string): Rgba | null {
  const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] == null ? 1 : Number(rgb[4]),
    };
  }
  const hex = value.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255,
      a: hex[2] ? parseInt(hex[2], 16) / 255 : 1,
    };
  }
  return null;
}

function key(c: Rgba): string {
  return `${c.r},${c.g},${c.b}`;
}

function half(c: Rgba): boolean {
  return c.a < 0.75;
}

type Ctx = { property: string; layerId: string };

/** 원본 색을 역할에 맞는 밤 색으로. 표에 없으면 명도만 뒤집는다. */
function nightColor(value: string, ctx: Ctx): string {
  const c = parseColor(value);
  if (!c) return value;
  if (c.a === 0) return value;
  const k = key(c);
  const rail = /鉄道|軌道/.test(ctx.layerId);
  const road = /道路/.test(ctx.layerId);

  if (ctx.property === "text-halo-color") return NIGHT.halo;

  if (ctx.property === "text-color") {
    switch (k) {
      case "0,0,0":
        return NIGHT.text;
      case "50,50,50":
        return NIGHT.text2;
      case "80,80,80":
        return NIGHT.text3;
      case "255,255,255":
        return NIGHT.textWhite;
      case "200,160,60":
        return NIGHT.contourText;
      case "20,90,255":
        return NIGHT.textWater;
      case "0,0,255":
        return NIGHT.textBlue;
      case "175,74,24":
        return NIGHT.textBrown;
      case "19,97,69":
        return NIGHT.textGreen;
      case "60,50,181":
        return NIGHT.textIndigo;
      case "81,29,10":
        return NIGHT.textDarkBrown;
      case "96,25,134":
        return NIGHT.textPurple;
    }
    return invertLightness(c, 0.7, 0.95);
  }

  if (ctx.property === "background-color" || ctx.property === "fill-color") {
    switch (k) {
      case "255,255,255":
        return NIGHT.land;
      case "190,210,255":
        return NIGHT.water;
      case "200,250,230":
        return NIGHT.wetland;
      case "217,217,217":
        return NIGHT.bareland;
      case "235,242,235":
        return NIGHT.grassland;
      case "200,200,200":
        return NIGHT.waterStructure;
      case "0,0,0":
        return NIGHT.darkFill;
      case "255,230,190":
        return NIGHT.building;
      case "255,187,153":
        return NIGHT.buildingAlt;
      case "255,119,51":
        return /構造物/.test(ctx.layerId) ? NIGHT.structure : NIGHT.buildingHot;
    }
    return invertLightness(c, 0.06, 0.3);
  }

  if (ctx.property === "fill-outline-color") return NIGHT.grayDim;

  // line-color
  switch (k) {
    case "0,176,236":
      return NIGHT.coastLow;
    case "100,100,100":
      if (half(c)) return NIGHT.roadCasing;
      return rail ? NIGHT.grayDim : NIGHT.gray;
    case "20,90,255":
      return /等深線/.test(ctx.layerId) ? NIGHT.isobath : NIGHT.waterEdge;
    case "190,210,255":
      return NIGHT.waterLow;
    case "231,39,65":
      return NIGHT.redLine;
    case "68,0,128":
      return NIGHT.admin;
    case "34,24,21":
      return NIGHT.adminNation;
    case "200,160,60":
      return rail ? NIGHT.subway : NIGHT.contour;
    case "100,195,115":
      return half(c) ? NIGHT.motorwayCasing : NIGHT.motorway;
    case "235,130,120":
      return half(c) ? NIGHT.roadNationalCasing : NIGHT.roadNational;
    case "255,255,0":
      return half(c) ? NIGHT.roadPrefCasing : NIGHT.roadPref;
    case "173,173,173":
      return NIGHT.roadMinor;
    case "255,255,255":
      if (rail) return /旗竿|ククリ白/.test(ctx.layerId) ? NIGHT.railDash : NIGHT.railStation;
      return road ? NIGHT.roadFill : NIGHT.gray;
    case "0,0,0":
      if (rail) return /ククリ/.test(ctx.layerId) ? NIGHT.darkCasing : NIGHT.rail;
      if (road) return NIGHT.darkCasing;
      return NIGHT.structureLine;
    case "200,200,200":
      if (road) return NIGHT.roadMinor;
      return rail ? NIGHT.railMinor : NIGHT.gray;
    case "0,155,191":
      return NIGHT.subway;
    case "255,135,75":
      return /構造物/.test(ctx.layerId) ? NIGHT.structureLine : NIGHT.buildingOutline;
    case "100,0,0":
      return NIGHT.maroon;
    case "150,150,150":
      return NIGHT.gray;
  }
  return invertLightness(c, 0.2, 0.6);
}

/** 표에 없는 색의 안전망. 색상은 두고 명도를 뒤집어 [lo, hi] 안에 넣는다. */
function invertLightness(c: Rgba, lo: number, hi: number): string {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  const l2 = lo + (1 - l) * (hi - lo);
  const s2 = s * 0.6;
  return `hsla(${Math.round(h)}, ${Math.round(s2 * 100)}%, ${Math.round(l2 * 100)}%, ${c.a})`;
}

function recolor(value: unknown, ctx: Ctx): unknown {
  if (typeof value === "string") return COLOR_RE.test(value) ? nightColor(value, ctx) : value;
  if (Array.isArray(value)) return value.map((item) => recolor(item, ctx));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, recolor(v, ctx)]),
    );
  }
  return value;
}

type VendoredStyle = {
  glyphs: string;
  sprite: string;
  layers: LayerSpecification[];
};

const VECTOR_SOURCE_ID = "v";

function nightLayers(): LayerSpecification[] {
  const vendored = gsiOptimalStd as unknown as VendoredStyle;
  return vendored.layers.map((layer) => {
    const paint = layer.paint
      ? Object.fromEntries(
          Object.entries(layer.paint).map(([property, value]) => [
            property,
            recolor(value, { property, layerId: layer.id }),
          ]),
        )
      : undefined;
    return { ...layer, ...(paint ? { paint } : {}) } as LayerSpecification;
  });
}

let nightCache: StyleSpecification | null = null;

function nightStyle(): StyleSpecification {
  if (nightCache) return nightCache;
  const vendored = gsiOptimalStd as unknown as VendoredStyle;
  nightCache = {
    version: 8,
    glyphs: vendored.glyphs,
    sprite: vendored.sprite,
    sources: {
      [VECTOR_SOURCE_ID]: {
        type: "vector",
        tiles: ["https://cyberjapandata.gsi.go.jp/xyz/optimal_bvmap-v1/{z}/{x}/{y}.pbf"],
        minzoom: 4,
        maxzoom: 16,
        attribution: `${GSI_VECTOR_LINK} · ${PICTOGRAM_CREDIT}`,
      },
      [TERRAIN_SOURCE_ID]: terrainSource,
    },
    terrain: TERRAIN,
    sky: NIGHT_SKY,
    layers: nightLayers(),
  };
  return nightCache;
}

/** 테스트와 디버깅용. 스타일에 남은 원본 밝은 색을 셀 수 있게 색 변환만 노출한다. */
export const __internal = { nightColor, parseColor };
