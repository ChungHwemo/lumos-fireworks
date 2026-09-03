import { expect, test } from "vitest";
import { addReport, crowdHeat, listReports } from "../../src/domain/report.ts";

const BASE = {
  festivalId: "atami-kaijo-2026-09-13",
  spotId: "atami-sunbeach",
  kind: "crowd" as const,
  body: "모래사장이 거의 찼어요",
  createdAt: "2026-09-13T10:00:00+09:00",
  lng: 139.0777,
  lat: 35.1032,
};

test("제보를 앞에 쌓고 행사로 걸러낸다", () => {
  const one = addReport([], BASE);
  const two = addReport(one, { ...BASE, kind: "food", body: "노점 줄 김" });
  expect(two).toHaveLength(2);
  expect(listReports(two, { festivalId: "atami-kaijo-2026-09-13", kind: "crowd" })).toHaveLength(1);
  expect(listReports(two, { festivalId: "sakata-hanabi-2026" })).toHaveLength(0);
});

test("빈 본문은 제보가 아니다", () => {
  expect(() => addReport([], { ...BASE, body: "  " })).toThrow(/body/);
});

test("혼잡 제보와 시드 레벨을 더해 열을 만든다", () => {
  const heat = crowdHeat(
    [{ id: "atami-sunbeach", lng: 139.0777, lat: 35.1032, crowdLevel: 3 }],
    addReport([], BASE),
  );
  expect(heat).toEqual([
    { id: "atami-sunbeach", lng: 139.0777, lat: 35.1032, level: 4 },
  ]);
});
