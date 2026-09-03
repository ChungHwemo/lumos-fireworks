import { distanceMetersToLaunch } from "./spot.ts";
import type { Coord } from "./types.ts";

const BURST_HEIGHT_M = 300;

export type LaunchView = {
  bearingDeg: number;
  pitchDeg: number;
  distanceMeters: number;
};

export function lookAtLaunch(
  from: Coord,
  launch: Coord | null,
): LaunchView | null {
  if (!launch) return null;
  const distanceMeters = distanceMetersToLaunch(from, launch);
  if (distanceMeters == null) return null;
  return {
    bearingDeg: round1(bearingDeg(from, launch)),
    pitchDeg: round1((Math.atan2(BURST_HEIGHT_M, distanceMeters) * 180) / Math.PI),
    distanceMeters,
  };
}

function bearingDeg(from: Coord, to: Coord): number {
  const p1 = toRadians(from.lat);
  const p2 = toRadians(to.lat);
  const dLng = toRadians(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(p2);
  const x =
    Math.cos(p1) * Math.sin(p2) -
    Math.sin(p1) * Math.cos(p2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
