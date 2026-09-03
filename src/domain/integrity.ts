import { distanceMetersToLaunch } from "./spot.ts";
import type { ControlKind, Coord } from "./types.ts";

type IntegrityFestival = {
  id: string;
  launch?: Coord | null;
};

type IntegritySpot = {
  id: string;
  festivalId: string;
  lng?: number;
  lat?: number;
  distanceMeters?: number | null;
  walkMeters?: number | null;
};

type IntegrityPaidSeat = {
  festivalId: string;
};

type IntegrityLink = {
  id: string;
  spotIds: string[] | "*";
  note: string;
};

type IntegrityControl = {
  id: string;
  festivalId: string;
  kind: ControlKind;
  radiusMeters: number | null;
  spotIds: string[] | "*";
};

export type Catalog = {
  festivals: readonly IntegrityFestival[];
  spots: readonly IntegritySpot[];
  paidSeats: readonly IntegrityPaidSeat[];
  researchLinks: readonly IntegrityLink[];
  controls: readonly IntegrityControl[];
};

export function assertCatalogIntegrity(data: Catalog): void {
  const festivalIds = new Set(data.festivals.map((festival) => festival.id));
  const spotIds = new Set(data.spots.map((spot) => spot.id));
  const festivalsById = new Map(
    data.festivals.map((festival) => [festival.id, festival]),
  );

  for (const spot of data.spots) {
    if (!festivalIds.has(spot.festivalId)) {
      throw new Error(`unknown festivalId: ${spot.festivalId}`);
    }
    const festival = festivalsById.get(spot.festivalId);
    if (
      spot.lng != null &&
      spot.lat != null &&
      festival?.launch &&
      spot.distanceMeters != null
    ) {
      const computed = distanceMetersToLaunch(
        { lng: spot.lng, lat: spot.lat },
        festival.launch,
      );
      if (computed !== spot.distanceMeters) {
        throw new Error(
          `distanceMeters mismatch for ${spot.id}: ${spot.distanceMeters} != ${computed}`,
        );
      }
    }
    if (
      spot.walkMeters != null &&
      spot.distanceMeters != null &&
      spot.walkMeters < spot.distanceMeters
    ) {
      throw new Error(`walkMeters shorter than crow-fly for ${spot.id}`);
    }
  }

  for (const seat of data.paidSeats) {
    if (!festivalIds.has(seat.festivalId)) {
      throw new Error(`unknown festivalId: ${seat.festivalId}`);
    }
  }

  for (const link of data.researchLinks) {
    if (!link.note.trim()) {
      throw new Error("research link note is required");
    }
    if (link.spotIds !== "*") {
      for (const spotId of link.spotIds) {
        if (!spotIds.has(spotId)) {
          throw new Error(`unknown research spotId: ${spotId}`);
        }
      }
    }
  }

  for (const control of data.controls) {
    if (!festivalIds.has(control.festivalId)) {
      throw new Error(`unknown festivalId: ${control.festivalId}`);
    }
    if (
      control.kind === "launch_perimeter" &&
      (control.radiusMeters == null || control.radiusMeters <= 0)
    ) {
      throw new Error(`radiusMeters required for ${control.id}`);
    }
    if (control.spotIds !== "*") {
      for (const spotId of control.spotIds) {
        if (!spotIds.has(spotId)) {
          throw new Error(`unknown control spotId: ${spotId}`);
        }
      }
    }
  }
}
