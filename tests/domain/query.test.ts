import { expect, test } from "vitest";
import { isFestivalDay, listFestivals } from "../../src/domain/festival.ts";
import { parseFromQuery } from "../../src/domain/query.ts";
import { filterSpotsByText } from "../../src/domain/spot.ts";

test("from 쿼리가 날짜가 아니면 기본값을 쓴다", () => {
  expect(parseFromQuery(null)).toBe("2026-09-04");
  expect(parseFromQuery("nope")).toBe("2026-09-04");
  expect(parseFromQuery("2026-10-01")).toBe("2026-10-01");
});

test("시즌 행사는 종료일이 from 이후면 남긴다", () => {
  const listed = listFestivals(
    [
      {
        id: "toya-2026",
        seriesId: "toya",
        date: "2026-04-28",
        dateEnd: "2026-10-31",
        prefecture: "北海道",
        city: "洞爺湖町",
        confirmation: "confirmed",
        paidSeats: false,
        rainPolicy: "hold",
        launch: null,
      },
    ],
    { from: "2026-09-04", confirmation: "confirmed" },
  );
  expect(listed.map((f) => f.id)).toEqual(["toya-2026"]);
});

test("시즌 행사일은 구간 안이면 당일이다", () => {
  const toya = {
    id: "toya-2026",
    seriesId: "toya",
    date: "2026-04-28",
    dateEnd: "2026-10-31",
    prefecture: "北海道",
    city: "洞爺湖町",
    confirmation: "confirmed" as const,
    paidSeats: false,
    rainPolicy: "hold" as const,
    launch: null,
  };
  expect(isFestivalDay(toya, new Date("2026-09-04T12:00:00+09:00"))).toBe(true);
  expect(isFestivalDay(toya, new Date("2026-11-01T12:00:00+09:00"))).toBe(false);
});

test("명당 이름과 별칭으로 건다", () => {
  const spots = [
    { id: "a", nameKo: "아타미 선비치", nameJa: "熱海サンビーチ", aliases: ["sun beach"] },
    { id: "b", nameKo: "스완파크", nameJa: "スワンパーク", aliases: [] },
  ];
  expect(filterSpotsByText(spots, "サン").map((s) => s.id)).toEqual(["a"]);
  expect(filterSpotsByText(spots, "SUN").map((s) => s.id)).toEqual(["a"]);
});
