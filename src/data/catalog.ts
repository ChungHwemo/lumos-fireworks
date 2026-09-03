import controlsJson from "../../docs/data/controls.seed.json";
import festivalsJson from "../../docs/data/festivals.seed.json";
import paidSeatsJson from "../../docs/data/paid-seats.seed.json";
import researchJson from "../../docs/data/research-links.seed.json";
import spotsJson from "../../docs/data/spots.seed.json";
import { accessBadge, type AccessBadge } from "../domain/badge.ts";
import { assessSpotAccess } from "../domain/control.ts";
import { listFestivalDates, listFestivals } from "../domain/festival.ts";
import { assertCatalogIntegrity } from "../domain/integrity.ts";
import { FROM_DEFAULT } from "../domain/query.ts";
import {
  controlsForFestival,
  spotsForFestival,
} from "../domain/resolve.ts";
import { sortSpots } from "../domain/spot.ts";
import type {
  ControlRecord,
  FestivalQuery,
  FestivalRecord,
  PaidSeat,
  ResearchLink,
  SpotAccess,
  SpotRecord,
} from "../domain/types.ts";

export { FROM_DEFAULT };

export const festivals = festivalsJson.festivals as FestivalRecord[];
export const spots = spotsJson.spots as SpotRecord[];
export const controls = controlsJson.controls as ControlRecord[];
export const paidSeats = paidSeatsJson.paidSeats as PaidSeat[];
export const researchLinks = researchJson.researchLinks as ResearchLink[];

assertCatalogIntegrity({
  festivals,
  spots,
  paidSeats,
  researchLinks,
  controls,
});

export type DecoratedSpot = SpotRecord & {
  access: SpotAccess;
  reachable: boolean;
  badge: AccessBadge;
};

export function catalogFestivals(query: Partial<FestivalQuery> = {}) {
  return listFestivals(festivals, {
    from: query.from ?? FROM_DEFAULT,
    confirmation: query.confirmation ?? "confirmed",
    rainPolicy: query.rainPolicy,
    paidSeats: query.paidSeats,
  }) as FestivalRecord[];
}

export function festivalById(id: string): FestivalRecord | undefined {
  return festivals.find((festival) => festival.id === id);
}

export function seriesDates(seriesId: string): FestivalRecord[] {
  return listFestivalDates(festivals, seriesId) as FestivalRecord[];
}

export function seatsFor(festivalId: string): PaidSeat[] {
  return spotsForFestival(paidSeats, festivals, festivalId);
}

export function linksFor(spotId: string): ResearchLink[] {
  return researchLinks.filter(
    (link) => link.spotIds === "*" || link.spotIds.includes(spotId),
  );
}

export function decoratedSpots(festivalId: string): DecoratedSpot[] {
  const festival = festivalById(festivalId);
  if (!festival) return [];
  const resolvedControls = controlsForFestival(controls, festivals, festivalId);
  const festivalSpots = spotsForFestival(spots, festivals, festivalId).filter(
    (spot) => spot.isViewpoint,
  );
  return sortSpots(
    festivalSpots.map((spot) => {
      const access = assessSpotAccess(spot, festival, resolvedControls);
      return {
        ...spot,
        distanceMeters: access.crowFlyMeters,
        access,
        reachable: access.reachable,
        badge: accessBadge(access),
      };
    }),
  );
}

export function controlsFor(festivalId: string): ControlRecord[] {
  return controlsForFestival(controls, festivals, festivalId);
}
