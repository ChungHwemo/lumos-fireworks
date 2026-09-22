import { expect, test } from "vitest";
import { assertCatalogIntegrity, catalogIssues } from "../../src/domain/integrity.ts";

const EMPTY = { spots: [], paidSeats: [], researchLinks: [], controls: [] };

test("같은 행사 id 가 두 번 나오면 실패한다", () => {
  expect(
    catalogIssues({ ...EMPTY, festivals: [{ id: "a" }, { id: "a" }] }),
  ).toEqual(["duplicate festivalId: a"]);
});

test("끝나는 날이 시작일보다 앞서면 실패한다", () => {
  expect(
    catalogIssues({
      ...EMPTY,
      festivals: [{ id: "a", date: "2026-10-31", dateEnd: "2026-04-28" }],
    }),
  ).toEqual(["dateEnd before date for a"]);
});

test("날짜·시각 형식이 어긋나면 실패한다", () => {
  const issues = catalogIssues({
    ...EMPTY,
    festivals: [{ id: "a", date: "2026-02-30", startTime: "25:00", endTime: "9:00" }],
  });
  expect(issues).toHaveLength(3);
  expect(issues.join("\n")).toMatch(/invalid date/);
  expect(issues.join("\n")).toMatch(/invalid startTime/);
  expect(issues.join("\n")).toMatch(/invalid endTime/);
});

test("좌표가 범위를 벗어나면 실패한다", () => {
  expect(
    catalogIssues({
      ...EMPTY,
      festivals: [{ id: "a", launch: { lng: 200, lat: 35 } }],
      spots: [{ id: "s", festivalId: "a", lng: 139, lat: 95 }],
    }),
  ).toEqual(["launch out of range for a", "coordinate out of range for s"]);
});

test("혼잡 레벨은 1..5 정수다", () => {
  expect(
    catalogIssues({
      ...EMPTY,
      festivals: [{ id: "a" }],
      spots: [{ id: "s", festivalId: "a", crowdLevel: 6 }],
    }),
  ).toEqual(["crowdLevel must be 1..5 for s"]);
});

test("발사 앵커가 없는 행사의 명당은 거리를 가질 수 없다", () => {
  expect(
    catalogIssues({
      ...EMPTY,
      festivals: [{ id: "a", launch: null }],
      spots: [{ id: "s", festivalId: "a", distanceMeters: 100 }],
    }),
  ).toEqual(["distanceMeters without launch anchor for s"]);
});

test("공식 URL 은 http(s) 여야 한다", () => {
  expect(
    catalogIssues({
      ...EMPTY,
      festivals: [{ id: "a", officialUrl: "javascript:alert(1)" }],
    }),
  ).toEqual(["officialUrl is not http(s) for a"]);
});

test("반경은 종류와 상관없이 양수다", () => {
  expect(
    catalogIssues({
      ...EMPTY,
      festivals: [{ id: "a" }],
      controls: [{ id: "c", festivalId: "a", kind: "vehicle", radiusMeters: 0, spotIds: "*" }],
    }),
  ).toEqual(["radiusMeters must be positive for c"]);
});

test("assert 는 문제를 한 번에 모두 보고한다", () => {
  expect(() =>
    assertCatalogIntegrity({
      ...EMPTY,
      festivals: [{ id: "a" }, { id: "a" }],
      spots: [{ id: "s", festivalId: "ghost" }],
    }),
  ).toThrow(/duplicate festivalId: a[\s\S]*unknown festivalId: ghost/);
});
