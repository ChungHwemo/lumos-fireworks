import { distanceMetersToLaunch } from "./spot.ts";
import type {
  ControlZone,
  Coord,
  SpotAccess,
} from "./types.ts";

type AccessFestival = {
  id: string;
  launch: Coord | null;
};

type AccessSpot = Coord & {
  id: string;
  walkMeters?: number | null;
};

function targetsSpot(control: ControlZone, spotId: string): boolean {
  return control.spotIds === "*" || control.spotIds.includes(spotId);
}

function controlCenter(
  control: ControlZone,
  festival: AccessFestival,
): Coord | null {
  return control.center ?? festival.launch;
}

function insideRadius(
  spot: Coord,
  control: ControlZone,
  festival: AccessFestival,
): boolean {
  if (control.radiusMeters == null) return false;
  const center = controlCenter(control, festival);
  const meters = distanceMetersToLaunch(spot, center);
  return meters != null && meters <= control.radiusMeters;
}

export function assessSpotAccess(
  spot: AccessSpot,
  festival: AccessFestival,
  controls: readonly ControlZone[],
): SpotAccess {
  const crowFlyMeters = distanceMetersToLaunch(spot, festival.launch);
  const applicable = controls.filter(
    (control) =>
      control.festivalId === festival.id && targetsSpot(control, spot.id),
  );

  const hitting = applicable.filter((control) => {
    if (
      control.kind === "paid_gate" ||
      control.kind === "station"
    ) {
      return true;
    }
    return insideRadius(spot, control, festival);
  });

  const insidePerimeter = hitting.some((c) => c.kind === "launch_perimeter");
  const vehicleRestricted = hitting.some((c) => c.kind === "vehicle");
  const pedestrianBlocked = hitting.some((c) => c.kind === "pedestrian");
  const ticketRequired = hitting.some((c) => c.kind === "paid_gate");
  const stationControlled = hitting.some((c) => c.kind === "station");

  return {
    crowFlyMeters,
    walkMeters: spot.walkMeters ?? null,
    insidePerimeter,
    vehicleRestricted,
    pedestrianBlocked,
    ticketRequired,
    stationControlled,
    reachable: !insidePerimeter && !pedestrianBlocked && !stationControlled,
    controlIds: hitting.map((control) => control.id),
  };
}
