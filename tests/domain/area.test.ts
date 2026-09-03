import { expect, test } from "vitest";
import { festivals } from "../../src/data/catalog.ts";
import { festivalArea, festivalPlace } from "../../src/domain/area.ts";

test("발사 앵커가 있으면 그 좌표를 쓴다", () => {
  const area = festivalArea({
    launch: { lng: 139.077, lat: 35.096 },
    prefecture: "静岡県",
    city: "熱海市",
  });
  expect(area.precision).toBe("launch");
  expect(area.coord).toEqual({ lng: 139.077, lat: 35.096 });
  expect(area.zoom).toBeGreaterThanOrEqual(13);
});

test("만박처럼 정확한 좌표가 없으면 오사카시로 연다", () => {
  const area = festivalArea({
    launch: null,
    prefecture: "大阪府",
    city: "大阪市",
  });
  expect(area.precision).toBe("city");
  expect(area.label.ko).toBe("오사카시");
  expect(area.label.ja).toBe("大阪市");
  expect(area.label.en).toBe("Osaka");
  expect(area.coord.lng).toBeGreaterThan(135);
  expect(area.coord.lng).toBeLessThan(136);
  expect(area.coord.lat).toBeGreaterThan(34);
  expect(area.coord.lat).toBeLessThan(35);
  expect(area.zoom).toBeGreaterThanOrEqual(10);
  expect(area.zoom).toBeLessThan(13);
});

test("시 좌표가 없으면 현 대략으로 연다", () => {
  const area = festivalArea({
    launch: null,
    prefecture: "大阪府",
    city: "未知市",
  });
  expect(area.precision).toBe("prefecture");
  expect(area.label.ko).toBe("오사카부");
  expect(area.coord.lng).toBeGreaterThan(135);
  expect(area.coord.lng).toBeLessThan(136);
});

test("목록에는 만박을 오사카로 쓴다", () => {
  expect(
    festivalPlace({ prefecture: "大阪府", city: "大阪市" }, "ko"),
  ).toBe("오사카부 오사카시");
  expect(
    festivalPlace({ prefecture: "大阪府", city: "大阪市" }, "en"),
  ).toBe("Osaka");
});

test("카타카이는 오지야시 전체가 아니라 片貝 지구로 연다", () => {
  const area = festivalArea({
    launch: null,
    prefecture: "新潟県",
    city: "小千谷市",
    venueJa: "小千谷市片貝",
    venueKo: "오지하시 카타카이",
  });
  expect(area.precision).toBe("district");
  expect(area.label.ko).toBe("오지야시 카타카이");
  expect(area.label.ja).toBe("小千谷市片貝");
  expect(area.coord.lng).toBeGreaterThan(138.83);
  expect(area.zoom).toBeGreaterThanOrEqual(12);
});

test("시드 카타카이 행사도 片貝로 연다", () => {
  const festival = festivals.find((row) => row.id === "katakai-2026-09-11");
  expect(festival).toBeTruthy();
  const area = festivalArea(festival!);
  expect(area.precision).toBe("district");
  expect(area.label.ko).toContain("카타카이");
});

test("시드 행사는 전부 대략 위치를 갖는다", () => {
  for (const festival of festivals) {
    const area = festivalArea(festival);
    expect(["launch", "district", "city"].includes(area.precision)).toBe(true);
    expect(area.coord.lng).not.toBe(139.7);
    expect(area.coord.lat).not.toBe(36.2);
  }
});

test("지구 라벨을 써도 현·시가 사라지지 않는다", () => {
  const yodogawa = {
    prefecture: "大阪府",
    city: "大阪市",
    venueJa: "淀川河川公園",
    venueKo: "요도가와 하천공원",
  };
  expect(festivalPlace(yodogawa, "en")).toBe("Yodo River park, Osaka");
  expect(festivalPlace(yodogawa, "ko")).toBe("오사카부 오사카시 요도가와 하천공원");
  expect(festivalPlace(yodogawa, "ja")).toBe("大阪府 大阪市 淀川河川公園");

  const katakai = {
    prefecture: "新潟県",
    city: "小千谷市",
    venueJa: "小千谷市片貝",
    venueKo: "오지야시 카타카이",
  };
  expect(festivalPlace(katakai, "en")).toBe("Katakai, Ojiya, Niigata");
});
