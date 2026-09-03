import { expect, test } from "vitest";
import { assertCatalogIntegrity } from "../../src/domain/integrity.ts";

test("없는 행사 id 를 가리키면 실패한다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: [],
      spots: [{ id: "x", festivalId: "ghost", walkMeters: null }],
      paidSeats: [],
      researchLinks: [],
      controls: [],
    }),
  ).toThrow(/ghost/);
});

test("researchLink.spotIds 가 카탈로그 밖이면 실패한다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: [{ id: "a" }],
      spots: [{ id: "s", festivalId: "a", walkMeters: null }],
      paidSeats: [],
      researchLinks: [{ id: "r", spotIds: ["ghost-spot"], note: "x" }],
      controls: [],
    }),
  ).toThrow(/ghost-spot/);
});

test("note 없는 연구 링크는 데이터가 아니다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: [{ id: "a" }],
      spots: [{ id: "s", festivalId: "a", walkMeters: null }],
      paidSeats: [],
      researchLinks: [{ id: "r", spotIds: "*", note: "" }],
      controls: [],
    }),
  ).toThrow(/note/);
});

test("발사 반경에 미터가 없으면 실패한다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: [{ id: "a" }],
      spots: [],
      paidSeats: [],
      researchLinks: [],
      controls: [
        {
          id: "c",
          festivalId: "a",
          kind: "launch_perimeter",
          radiusMeters: null,
          spotIds: "*",
        },
      ],
    }),
  ).toThrow(/radiusMeters/);
});

test("도보 우회가 직선보다 짧으면 실패한다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: [{ id: "a", launch: { lng: 139.077, lat: 35.096 } }],
      spots: [
        {
          id: "s",
          festivalId: "a",
          lng: 139.0777,
          lat: 35.1032,
          distanceMeters: 803,
          walkMeters: 100,
        },
      ],
      paidSeats: [],
      researchLinks: [],
      controls: [],
    }),
  ).toThrow(/walkMeters/);
});

test("맞는 카탈로그는 통과한다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: [{ id: "a", launch: { lng: 139.077, lat: 35.096 } }],
      spots: [
        {
          id: "s",
          festivalId: "a",
          lng: 139.0777,
          lat: 35.1032,
          distanceMeters: 803,
          walkMeters: 1100,
        },
      ],
      paidSeats: [{ festivalId: "a" }],
      researchLinks: [{ id: "r", spotIds: "*", note: "공식 재확인" }],
      controls: [
        {
          id: "c",
          festivalId: "a",
          kind: "launch_perimeter",
          radiusMeters: 300,
          spotIds: "*",
        },
      ],
    }),
  ).not.toThrow();
});
