import { expect, test } from "vitest";
import { __internal, MAP_STYLES, mapStyle, parseMapStyle } from "../../src/ui/map/gsi-style.ts";

type Layer = { id: string; type: string; paint?: Record<string, unknown> };

function colorsIn(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string" && /^(#|rgb|hsl)/i.test(value)) out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => colorsIn(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => colorsIn(v, out));
  return out;
}

test("모르는 값과 옛 std 는 야경으로, photo·pale 은 그대로", () => {
  expect(parseMapStyle(null)).toBe("night");
  expect(parseMapStyle("std")).toBe("night");
  expect(parseMapStyle("photo")).toBe("photo");
  expect(parseMapStyle("pale")).toBe("pale");
  expect(MAP_STYLES).toEqual(["night", "photo", "pale"]);
});

test("야경 스타일은 국토지리원 XYZ 벡터타일과 지형·하늘을 쓴다", () => {
  const style = mapStyle("night");
  const source = style.sources.v as { type: string; tiles: string[]; maxzoom: number };
  expect(source.type).toBe("vector");
  expect(source.tiles[0]).toBe("https://cyberjapandata.gsi.go.jp/xyz/optimal_bvmap-v1/{z}/{x}/{y}.pbf");
  expect(source.maxzoom).toBe(16);
  expect(style.terrain?.source).toBe("terrain");
  expect(style.sky).toBeTruthy();
  expect(style.glyphs).toMatch(/^https:\/\/gsi-cyberjapan\.github\.io\//);
});

test("야경 스타일에는 원본의 흰 땅·흰 헤일로·송전선이 남지 않는다", () => {
  const layers = mapStyle("night").layers as Layer[];
  expect(layers.length).toBeGreaterThan(100);
  expect(layers.some((layer) => /送電線/.test(layer.id))).toBe(false);
  for (const layer of layers) {
    for (const [property, value] of Object.entries(layer.paint ?? {})) {
      for (const color of colorsIn(value)) {
        const c = __internal.parseColor(color);
        if (!c || c.a === 0) continue;
        const lightness = (Math.max(c.r, c.g, c.b) + Math.min(c.r, c.g, c.b)) / 2 / 255;
        if (property === "text-color") {
          expect(lightness, `${layer.id} ${property} ${color}`).toBeGreaterThan(0.45);
        } else if (property !== "text-halo-color" && !/鉄道/.test(layer.id)) {
          // 도로·물·건물·땅은 전부 어둡다. 밝은 것은 글자, 그리고 검은 선을 뒤집은 철도뿐이다.
          expect(lightness, `${layer.id} ${property} ${color}`).toBeLessThan(0.62);
        }
      }
    }
  }
});

test("색은 역할을 따라 바뀐다", () => {
  const { nightColor } = __internal;
  expect(nightColor("rgba(255,255,255,1)", { property: "fill-color", layerId: "行政区画" })).toBe("#0f1218");
  expect(nightColor("rgba(255,255,255,1)", { property: "line-color", layerId: "道路中心線色0" })).toBe("#414957");
  expect(nightColor("rgb(255,255,255)", { property: "line-color", layerId: "鉄道中心線旗竿0" })).toBe("#151820");
  expect(nightColor("rgba(0,0,0,1)", { property: "text-color", layerId: "注記" })).toBe("#e8ebf1");
  expect(nightColor("rgba(255,255,255,1)", { property: "text-halo-color", layerId: "注記" })).toBe(
    "rgba(8,10,16,0.92)",
  );
  expect(nightColor("rgba(0,0,0,0)", { property: "fill-color", layerId: "x" })).toBe("rgba(0,0,0,0)");
  // 표에 없는 색은 명도만 뒤집힌다.
  expect(nightColor("rgb(240,10,10)", { property: "line-color", layerId: "x" })).toMatch(/^hsla\(0,/);
});

test("래스터 스타일은 지리원 타일을 그대로 받고 표시만 어둡게 누른다", () => {
  const photo = mapStyle("photo");
  const raster = photo.layers.find((layer) => layer.type === "raster") as
    | { paint: Record<string, number> }
    | undefined;
  expect((photo.sources.gsi as { tiles: string[] }).tiles[0]).toContain("/seamlessphoto/");
  expect(raster?.paint["raster-brightness-max"]).toBeLessThan(1);
  const pale = mapStyle("pale");
  expect((pale.sources.gsi as { tiles: string[] }).tiles[0]).toContain("/pale/");
});
