import type { StyleSpecification } from "maplibre-gl";

export type GsiLayer = "pale" | "std";

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
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html" rel="noreferrer">地理院タイル</a>',
      },
    },
    layers: [
      {
        id: "bg",
        type: "background",
        paint: { "background-color": "#d6d2c8" },
      },
      { id: "gsi-raster", type: "raster", source: "gsi" },
    ],
  };
}
