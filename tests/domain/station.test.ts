import { expect, test } from "vitest";
import { festivals } from "../../src/data/catalog.ts";
import { festivalStationPoint } from "../../src/domain/station.ts";

test("카타카이는 JR 오지야역을 찍는다", () => {
  const festival = festivals.find((row) => row.id === "katakai-2026-09-11");
  const station = festivalStationPoint(festival!);
  expect(station?.label.ko).toBe("JR 오지야역");
  expect(station?.label.ja).toBe("JR小千谷駅");
  expect(station?.coord.lng).toBeGreaterThan(138.78);
  expect(station?.coord.lng).toBeLessThan(138.81);
  expect(station?.coord.lat).toBeGreaterThan(37.3);
  expect(station?.coord.lat).toBeLessThan(37.33);
});

test("공식 교통 안내만 있는 행사는 역 핀을 만들지 않는다", () => {
  const festival = festivals.find((row) => row.id === "banpaku-hanabi-2026");
  expect(festivalStationPoint(festival!)).toBeNull();
});
