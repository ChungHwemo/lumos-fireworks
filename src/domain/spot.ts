import type { Coord, SortableSpot } from "./types.ts";

const EARTH_RADIUS_M = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceMetersToLaunch(
  spot: Coord,
  launch: Coord | null,
): number | null {
  if (!launch) return null;
  const phi1 = toRadians(spot.lat);
  const phi2 = toRadians(launch.lat);
  const dPhi = toRadians(launch.lat - spot.lat);
  const dLambda = toRadians(launch.lng - spot.lng);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return Math.round(
    2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
  );
}

export function sortSpots<T extends SortableSpot>(spots: readonly T[]): T[] {
  return spots.slice().sort((a, b) => {
    const rank = (spot: SortableSpot) => {
      if (spot.reachable && spot.distanceMeters != null) return 0;
      if (!spot.reachable && spot.distanceMeters != null) return 1;
      return 2;
    };
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return (a.distanceMeters ?? Number.POSITIVE_INFINITY) -
      (b.distanceMeters ?? Number.POSITIVE_INFINITY);
  });
}
