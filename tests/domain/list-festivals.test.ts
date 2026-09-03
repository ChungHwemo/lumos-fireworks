import { expect, test } from "vitest";
import { isFestivalDay, listFestivalDates, listFestivals } from "../../src/domain/festival.ts";

const FIXTURE = [
  {
    id: "sakata-hanabi-2026",
    seriesId: "sakata-hanabi",
    date: "2026-09-12",
    prefecture: "山形県",
    city: "酒田市",
    confirmation: "confirmed" as const,
    paidSeats: true,
    rainPolicy: "hold" as const,
    launch: { lng: 139.843, lat: 38.914 },
  },
  {
    id: "atami-kaijo-2026-09-13",
    seriesId: "atami-kaijo",
    date: "2026-09-13",
    prefecture: "静岡県",
    city: "熱海市",
    confirmation: "confirmed" as const,
    paidSeats: true,
    rainPolicy: "hold" as const,
    launch: { lng: 139.077, lat: 35.096 },
  },
  {
    id: "atami-kaijo-2026-10-12",
    seriesId: "atami-kaijo",
    date: "2026-10-12",
    prefecture: "静岡県",
    city: "熱海市",
    confirmation: "confirmed" as const,
    paidSeats: true,
    rainPolicy: "hold" as const,
    launch: { lng: 139.077, lat: 35.096 },
  },
  {
    id: "sumida-2026",
    seriesId: "sumida",
    date: "2026-07-25",
    prefecture: "東京都",
    city: "墨田区",
    confirmation: "confirmed" as const,
    paidSeats: true,
    rainPolicy: "postpone" as const,
    launch: { lng: 139.81, lat: 35.7 },
  },
];

test("2026-09-04 이후 확정 행사만 날짜순으로 돌려준다", () => {
  const result = listFestivals(FIXTURE, {
    from: "2026-09-04",
    confirmation: "confirmed",
  });
  expect(result.map((f) => f.id)).toEqual([
    "sakata-hanabi-2026",
    "atami-kaijo-2026-09-13",
    "atami-kaijo-2026-10-12",
  ]);
});

test("from 당일 행사는 남긴다", () => {
  const result = listFestivals(FIXTURE, {
    from: "2026-09-12",
    confirmation: "confirmed",
  });
  expect(result.map((f) => f.id)).toEqual([
    "sakata-hanabi-2026",
    "atami-kaijo-2026-09-13",
    "atami-kaijo-2026-10-12",
  ]);
});

test("우천 hold 이고 유료석 있는 행사만 남긴다", () => {
  const result = listFestivals(FIXTURE, {
    from: "2026-01-01",
    confirmation: "confirmed",
    rainPolicy: "hold",
    paidSeats: true,
  });
  expect(result.map((f) => f.id)).toEqual([
    "sakata-hanabi-2026",
    "atami-kaijo-2026-09-13",
    "atami-kaijo-2026-10-12",
  ]);
});

test("열해 시리즈는 날짜순 회차를 돌려준다", () => {
  const result = listFestivalDates(FIXTURE, "atami-kaijo");
  expect(result.map((f) => f.date)).toEqual(["2026-09-13", "2026-10-12"]);
});

test("도쿄 달력으로 행사일인지 본다", () => {
  const festival = FIXTURE[0];
  expect(
    isFestivalDay(festival, new Date("2026-09-12T00:30:00+09:00")),
  ).toBe(true);
  expect(
    isFestivalDay(festival, new Date("2026-09-11T23:30:00+09:00")),
  ).toBe(false);
});

test("UTC 입력이어도 도쿄 날짜로 자른다", () => {
  const festival = FIXTURE[0];
  expect(isFestivalDay(festival, new Date("2026-09-11T15:30:00Z"))).toBe(true);
  expect(isFestivalDay(festival, new Date("2026-09-11T14:30:00Z"))).toBe(false);
});
