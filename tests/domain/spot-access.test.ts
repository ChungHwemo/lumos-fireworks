import { expect, test } from "vitest";
import { assessSpotAccess } from "../../src/domain/control.ts";
import { sortSpots } from "../../src/domain/spot.ts";

const ATAMI = {
  id: "atami-kaijo-2026-09-13",
  launch: { lng: 139.077, lat: 35.096 },
};

const PERIMETER = {
  id: "atami-pad",
  festivalId: "atami-kaijo-2026-09-13",
  kind: "launch_perimeter" as const,
  radiusMeters: 300,
  center: null,
  spotIds: "*" as const,
};

test("발사 반경 안의 가까운 자리는 설 수 없다", () => {
  const access = assessSpotAccess(
    { id: "pad", lng: 139.0772, lat: 35.0961 },
    ATAMI,
    [PERIMETER],
  );
  expect(access.crowFlyMeters).toBe(21);
  expect(access.insidePerimeter).toBe(true);
  expect(access.reachable).toBe(false);
  expect(access.controlIds).toEqual(["atami-pad"]);
});

test("반경 밖 803m 선착장은 설 수 있다", () => {
  const access = assessSpotAccess(
    { id: "sunbeach", lng: 139.0777, lat: 35.1032 },
    ATAMI,
    [PERIMETER],
  );
  expect(access.crowFlyMeters).toBe(803);
  expect(access.insidePerimeter).toBe(false);
  expect(access.reachable).toBe(true);
});

test("차량 규제만 걸린 자리는 걸어가서 설 수 있다", () => {
  const access = assessSpotAccess(
    { id: "swan", lng: 139.84, lat: 38.91 },
    { id: "sakata-hanabi-2026", launch: { lng: 139.843, lat: 38.914 } },
    [
      {
        id: "sakata-vehicle",
        festivalId: "sakata-hanabi-2026",
        kind: "vehicle",
        radiusMeters: 2000,
        center: { lng: 139.843, lat: 38.914 },
        spotIds: "*",
      },
    ],
  );
  expect(access.vehicleRestricted).toBe(true);
  expect(access.reachable).toBe(true);
});

test("보행 통제에 걸린 자리는 설 수 없다", () => {
  const access = assessSpotAccess(
    { id: "bridge", lng: 139.84, lat: 38.91 },
    { id: "sakata-hanabi-2026", launch: { lng: 139.843, lat: 38.914 } },
    [
      {
        id: "sakata-ped",
        festivalId: "sakata-hanabi-2026",
        kind: "pedestrian",
        radiusMeters: 2000,
        center: { lng: 139.843, lat: 38.914 },
        spotIds: "*",
      },
    ],
  );
  expect(access.pedestrianBlocked).toBe(true);
  expect(access.reachable).toBe(false);
});

test("다른 행사 통제는 이 명당에 적용하지 않는다", () => {
  const access = assessSpotAccess(
    { id: "sunbeach", lng: 139.0777, lat: 35.1032 },
    ATAMI,
    [
      {
        id: "sakata-ped",
        festivalId: "sakata-hanabi-2026",
        kind: "pedestrian",
        radiusMeters: 2000,
        center: { lng: 139.843, lat: 38.914 },
        spotIds: "*",
      },
    ],
  );
  expect(access.pedestrianBlocked).toBe(false);
  expect(access.reachable).toBe(true);
  expect(access.controlIds).toEqual([]);
});

test("유료 게이트는 설 수 있지만 표가 필요하다", () => {
  const access = assessSpotAccess(
    { id: "paid", lng: 139.0777, lat: 35.1032 },
    ATAMI,
    [
      {
        id: "hotel-deck",
        festivalId: "atami-kaijo-2026-09-13",
        kind: "paid_gate",
        radiusMeters: null,
        center: null,
        spotIds: ["paid"],
      },
    ],
  );
  expect(access.ticketRequired).toBe(true);
  expect(access.reachable).toBe(true);
});

test("도보 우회가 있으면 직선과 함께 돌려준다", () => {
  const access = assessSpotAccess(
    { id: "detour", lng: 139.0777, lat: 35.1032, walkMeters: 1100 },
    ATAMI,
    [],
  );
  expect(access.crowFlyMeters).toBe(803);
  expect(access.walkMeters).toBe(1100);
});

test("설 수 있는 자리를 가까운 순으로, 앵커 없는 자리는 맨 아래", () => {
  const sorted = sortSpots([
    { id: "far", distanceMeters: 1200, reachable: true },
    { id: "none", distanceMeters: null, reachable: true },
    { id: "near", distanceMeters: 400, reachable: true },
  ]);
  expect(sorted.map((s) => s.id)).toEqual(["near", "far", "none"]);
});

test("통제로 못 서는 가까운 자리는 설 수 있는 먼 자리보다 아래", () => {
  const sorted = sortSpots([
    { id: "blocked-near", distanceMeters: 80, reachable: false },
    { id: "open-far", distanceMeters: 1200, reachable: true },
  ]);
  expect(sorted.map((s) => s.id)).toEqual(["open-far", "blocked-near"]);
});
