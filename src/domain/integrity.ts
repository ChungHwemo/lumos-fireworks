import { distanceMetersToLaunch } from "./spot.ts";
import type { ControlKind, Coord } from "./types.ts";

type IntegrityFestival = {
  id: string;
  seriesId?: string;
  date?: string;
  dateEnd?: string;
  startTime?: string;
  endTime?: string;
  launch?: Coord | null;
  officialUrl?: string;
};

type IntegritySpot = {
  id: string;
  festivalId: string;
  lng?: number;
  lat?: number;
  crowdLevel?: number;
  distanceMeters?: number | null;
  walkMeters?: number | null;
};

type IntegrityPaidSeat = {
  festivalId: string;
  priceJpy?: number | null;
  ticketUrl?: string | null;
};

type IntegrityLink = {
  id: string;
  url?: string;
  spotIds: string[] | "*";
  note: string;
};

type IntegrityControl = {
  id: string;
  festivalId: string;
  kind: ControlKind;
  center?: Coord | null;
  radiusMeters: number | null;
  spotIds: string[] | "*";
  officialUrl?: string | null;
};

export type Catalog = {
  festivals: readonly IntegrityFestival[];
  spots: readonly IntegritySpot[];
  paidSeats: readonly IntegrityPaidSeat[];
  researchLinks: readonly IntegrityLink[];
  controls: readonly IntegrityControl[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

function validDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

function validTime(value: string): boolean {
  if (!TIME.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour < 24 && minute >= 0 && minute < 60;
}

function validCoord(coord: Coord): boolean {
  return (
    Number.isFinite(coord.lng) &&
    Number.isFinite(coord.lat) &&
    coord.lng >= -180 &&
    coord.lng <= 180 &&
    coord.lat >= -90 &&
    coord.lat <= 90
  );
}

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) out.add(id);
    seen.add(id);
  }
  return [...out];
}

/**
 * 카탈로그의 참조·값 문제를 전부 모아 돌려준다. 빈 배열이면 깨끗하다.
 * 필드가 없는 항목은 그 검사를 건너뛴다. 시드 일부만 넘기는 테스트를 막지 않기 위해서다.
 */
export function catalogIssues(data: Catalog): string[] {
  const issues: string[] = [];
  const festivalIds = new Set(data.festivals.map((festival) => festival.id));
  const spotIds = new Set(data.spots.map((spot) => spot.id));
  const festivalsById = new Map(
    data.festivals.map((festival) => [festival.id, festival]),
  );

  for (const id of duplicates(data.festivals.map((row) => row.id))) {
    issues.push(`duplicate festivalId: ${id}`);
  }
  for (const id of duplicates(data.spots.map((row) => row.id))) {
    issues.push(`duplicate spotId: ${id}`);
  }
  for (const id of duplicates(data.controls.map((row) => row.id))) {
    issues.push(`duplicate controlId: ${id}`);
  }
  for (const id of duplicates(data.researchLinks.map((row) => row.id))) {
    issues.push(`duplicate researchLinkId: ${id}`);
  }

  for (const festival of data.festivals) {
    if (festival.date != null && !validDate(festival.date)) {
      issues.push(`invalid date for ${festival.id}: ${festival.date}`);
    }
    if (festival.dateEnd != null) {
      if (!validDate(festival.dateEnd)) {
        issues.push(`invalid dateEnd for ${festival.id}: ${festival.dateEnd}`);
      } else if (festival.date != null && festival.dateEnd < festival.date) {
        issues.push(`dateEnd before date for ${festival.id}`);
      }
    }
    if (festival.startTime != null && !validTime(festival.startTime)) {
      issues.push(`invalid startTime for ${festival.id}: ${festival.startTime}`);
    }
    if (festival.endTime != null && !validTime(festival.endTime)) {
      issues.push(`invalid endTime for ${festival.id}: ${festival.endTime}`);
    }
    if (festival.launch && !validCoord(festival.launch)) {
      issues.push(`launch out of range for ${festival.id}`);
    }
    if (festival.officialUrl != null && !validHttpUrl(festival.officialUrl)) {
      issues.push(`officialUrl is not http(s) for ${festival.id}`);
    }
  }

  for (const spot of data.spots) {
    if (!festivalIds.has(spot.festivalId)) {
      issues.push(`unknown festivalId: ${spot.festivalId}`);
    }
    const hasCoord = spot.lng != null && spot.lat != null;
    if (hasCoord && !validCoord({ lng: spot.lng as number, lat: spot.lat as number })) {
      issues.push(`coordinate out of range for ${spot.id}`);
    }
    if (
      spot.crowdLevel != null &&
      (!Number.isInteger(spot.crowdLevel) || spot.crowdLevel < 1 || spot.crowdLevel > 5)
    ) {
      issues.push(`crowdLevel must be 1..5 for ${spot.id}`);
    }
    const festival = festivalsById.get(spot.festivalId);
    if (hasCoord && festival?.launch && spot.distanceMeters != null) {
      const computed = distanceMetersToLaunch(
        { lng: spot.lng as number, lat: spot.lat as number },
        festival.launch,
      );
      if (computed !== spot.distanceMeters) {
        issues.push(
          `distanceMeters mismatch for ${spot.id}: ${spot.distanceMeters} != ${computed}`,
        );
      }
    }
    if (festival && !festival.launch && spot.distanceMeters != null) {
      issues.push(`distanceMeters without launch anchor for ${spot.id}`);
    }
    if (
      spot.walkMeters != null &&
      spot.distanceMeters != null &&
      spot.walkMeters < spot.distanceMeters
    ) {
      issues.push(`walkMeters shorter than crow-fly for ${spot.id}`);
    }
  }

  for (const seat of data.paidSeats) {
    if (!festivalIds.has(seat.festivalId)) {
      issues.push(`unknown festivalId: ${seat.festivalId}`);
    }
    if (seat.priceJpy != null && (!Number.isFinite(seat.priceJpy) || seat.priceJpy < 0)) {
      issues.push(`negative priceJpy for ${seat.festivalId}`);
    }
    if (seat.ticketUrl != null && !validHttpUrl(seat.ticketUrl)) {
      issues.push(`ticketUrl is not http(s) for ${seat.festivalId}`);
    }
  }

  for (const link of data.researchLinks) {
    if (!link.note.trim()) {
      issues.push(`research link note is required: ${link.id}`);
    }
    if (link.url != null && !validHttpUrl(link.url)) {
      issues.push(`research link url is not http(s): ${link.id}`);
    }
    if (link.spotIds !== "*") {
      for (const spotId of link.spotIds) {
        if (!spotIds.has(spotId)) {
          issues.push(`unknown research spotId: ${spotId}`);
        }
      }
    }
  }

  for (const control of data.controls) {
    if (!festivalIds.has(control.festivalId)) {
      issues.push(`unknown festivalId: ${control.festivalId}`);
    }
    if (control.kind === "launch_perimeter" && control.radiusMeters == null) {
      issues.push(`radiusMeters required for ${control.id}`);
    }
    if (control.radiusMeters != null && control.radiusMeters <= 0) {
      issues.push(`radiusMeters must be positive for ${control.id}`);
    }
    if (control.center && !validCoord(control.center)) {
      issues.push(`control center out of range for ${control.id}`);
    }
    if (control.officialUrl != null && !validHttpUrl(control.officialUrl)) {
      issues.push(`officialUrl is not http(s) for ${control.id}`);
    }
    if (control.spotIds !== "*") {
      for (const spotId of control.spotIds) {
        if (!spotIds.has(spotId)) {
          issues.push(`unknown control spotId: ${spotId}`);
        }
      }
    }
  }

  return issues;
}

export function assertCatalogIntegrity(data: Catalog): void {
  const issues = catalogIssues(data);
  if (issues.length > 0) {
    throw new Error(`catalog integrity failed:\n${issues.join("\n")}`);
  }
}
