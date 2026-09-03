import type { SpotAccess } from "./types.ts";

export type AccessBadge = "blocked" | "paid" | "vehicle" | null;

export function accessBadge(access: SpotAccess): AccessBadge {
  if (!access.reachable) return "blocked";
  if (access.ticketRequired) return "paid";
  if (access.vehicleRestricted) return "vehicle";
  return null;
}
