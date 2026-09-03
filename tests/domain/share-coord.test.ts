import { expect, test } from "vitest";
import { parseShareCoord } from "../../src/ui/share.ts";

test("lng·lat 쿼리가 있으면 좌표를 읽는다", () => {
  expect(parseShareCoord(new URLSearchParams("lng=139.077&lat=35.096"))).toEqual({
    lng: 139.077,
    lat: 35.096,
  });
});

test("빠진 좌표는 만들지 않는다", () => {
  expect(parseShareCoord(new URLSearchParams("lng=139.077"))).toBeNull();
});

test("범위 밖 좌표는 만들지 않는다", () => {
  expect(parseShareCoord(new URLSearchParams("lng=200&lat=35"))).toBeNull();
});
