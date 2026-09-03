import { expect, test } from "vitest";
import { decoratedSpots } from "../../src/data/catalog.ts";

test("열해 10월 날짜도 선비치 803m를 공유한다", () => {
  const spots = decoratedSpots("atami-kaijo-2026-10-12");
  const sunbeach = spots.find((spot) => spot.id === "atami-sunbeach");
  expect(sunbeach?.distanceMeters).toBe(803);
  expect(sunbeach?.reachable).toBe(true);
});

test("발사 지점 인근은 통제로 맨 아래 가까이에 있다", () => {
  const spots = decoratedSpots("atami-kaijo-2026-09-13");
  const pad = spots.find((spot) => spot.id === "atami-pad");
  expect(pad?.reachable).toBe(false);
  expect(pad?.badge).toBe("blocked");
  expect(spots.at(-1)?.id).toBe("atami-pad");
});

test("사카타 유료석은 표가 필요하고 걸어갈 수 있다", () => {
  const paid = decoratedSpots("sakata-hanabi-2026").find((spot) => spot.id === "sakata-paid");
  expect(paid?.badge).toBe("paid");
  expect(paid?.reachable).toBe(true);
  expect(paid?.access.vehicleRestricted).toBe(true);
});
