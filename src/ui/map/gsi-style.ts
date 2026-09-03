import type { StyleSpecification } from "maplibre-gl";

export type GsiLayer = "pale" | "std";

const TERRAIN_SOURCE_ID = "terrain";

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
