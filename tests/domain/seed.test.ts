import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { listFestivals } from "../../src/domain/festival.ts";
import { assertCatalogIntegrity } from "../../src/domain/integrity.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadJson<T>(relative: string): T {
  return JSON.parse(readFileSync(join(root, relative), "utf8")) as T;
}

test("시드 카탈로그는 2026-09-04 이전 행사를 보여 주지 않는다", () => {
  const seed = loadJson<{ festivals: Array<{
    id: string;
    seriesId: string;
    date: string;
    dateEnd?: string;
    prefecture: string;
    city: string;
    confirmation: "confirmed" | "unconfirmed";
    paidSeats: boolean;
    rainPolicy: "hold" | "cancel" | "postpone" | "unknown";
    launch: { lng: number; lat: number } | null;
  }> }>("docs/data/festivals.seed.json");

  const listed = listFestivals(seed.festivals, {
    from: "2026-09-04",
    confirmation: "confirmed",
  });

  expect(
    listed.every((festival) => (festival.dateEnd ?? festival.date) >= "2026-09-04"),
  ).toBe(true);
  expect(listed.some((festival) => festival.id === "sakata-hanabi-2026")).toBe(
    true,
  );
  expect(listed.some((festival) => festival.id === "atami-kaijo-2026-09-13")).toBe(
    true,
  );
  expect(listed.some((festival) => festival.id === "toya-longrun-2026")).toBe(true);
  expect(listed.some((festival) => festival.id === "hokkaido-geijutsu-2026")).toBe(
    true,
  );
});

test("시드 전체는 참조와 거리가 맞는다", () => {
  const festivals = loadJson<{ festivals: Array<{ id: string; launch?: { lng: number; lat: number } | null }> }>(
    "docs/data/festivals.seed.json",
  ).festivals;
  const spots = loadJson<{
    spots: Array<{
      id: string;
      festivalId: string;
      lng: number;
      lat: number;
      distanceMeters: number | null;
      walkMeters: number | null;
    }>;
  }>("docs/data/spots.seed.json").spots;
  const paidSeats = loadJson<{ paidSeats: Array<{ festivalId: string }> }>(
    "docs/data/paid-seats.seed.json",
  ).paidSeats;
  const researchLinks = loadJson<{
    researchLinks: Array<{ id: string; spotIds: string[] | "*"; note: string }>;
  }>("docs/data/research-links.seed.json").researchLinks;
  const controls = loadJson<{
    controls: Array<{
      id: string;
      festivalId: string;
      kind: "launch_perimeter" | "vehicle" | "pedestrian" | "station" | "paid_gate";
      radiusMeters: number | null;
      spotIds: string[] | "*";
    }>;
  }>("docs/data/controls.seed.json").controls;

  expect(() =>
    assertCatalogIntegrity({
      festivals,
      spots,
      paidSeats,
      researchLinks,
      controls,
    }),
  ).not.toThrow();
  expect(spots.some((spot) => spot.id === "atami-sunbeach")).toBe(true);
  expect(spots.some((spot) => spot.id === "sakata-swan")).toBe(true);
});
