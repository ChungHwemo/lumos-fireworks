import type { Coord } from "../../domain/types.ts";

export function circlePolygon(center: Coord, radiusMeters: number, steps = 64) {
  const coords: [number, number][] = [];
  const latRad = (center.lat * Math.PI) / 180;
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos(latRad);
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    coords.push([
      center.lng + (radiusMeters * Math.cos(theta)) / mPerDegLng,
      center.lat + (radiusMeters * Math.sin(theta)) / mPerDegLat,
    ]);
  }
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [coords] },
  };
}
