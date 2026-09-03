import { expect, test } from "vitest";
import { lookAtLaunch } from "../../src/domain/look-at.ts";

test("선비치에서 열해 발사 앵커를 보면 남쪽 184.5도, 고각 20.5도", () => {
  const view = lookAtLaunch(
    { lng: 139.0777, lat: 35.1032 },
    { lng: 139.077, lat: 35.096 },
  );
  expect(view).toEqual({
    distanceMeters: 803,
    bearingDeg: 184.5,
    pitchDeg: 20.5,
  });
});

test("발사 앵커가 없으면 시선을 만들지 않는다", () => {
  expect(lookAtLaunch({ lng: 139.0777, lat: 35.1032 }, null)).toBeNull();
});
