import { expect, test } from "vitest";
import { distanceMetersToLaunch } from "../../src/domain/spot.ts";

test("열해 선착장 후보에서 발사 앵커까지 803m", () => {
  const meters = distanceMetersToLaunch(
    { lng: 139.0777, lat: 35.1032 },
    { lng: 139.077, lat: 35.096 },
  );
  expect(meters).toBe(803);
});

test("발사 앵커가 없으면 거리를 만들지 않는다", () => {
  expect(
    distanceMetersToLaunch({ lng: 139.0777, lat: 35.1032 }, null),
  ).toBeNull();
});
