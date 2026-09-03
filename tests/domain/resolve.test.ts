import { expect, test } from "vitest";
import { accessBadge } from "../../src/domain/badge.ts";
import {
  controlsForFestival,
  spotsForFestival,
} from "../../src/domain/resolve.ts";

const FESTIVALS = [
  {
    id: "atami-kaijo-2026-09-13",
    seriesId: "atami-kaijo",
    date: "2026-09-13",
    prefecture: "静岡県",
    city: "熱海市",
    confirmation: "confirmed" as const,
    paidSeats: true,
    rainPolicy: "hold" as const,
    launch: { lng: 139.077, lat: 35.096 },
  },
  {
    id: "atami-kaijo-2026-10-12",
    seriesId: "atami-kaijo",
    date: "2026-10-12",
    prefecture: "静岡県",
    city: "熱海市",
    confirmation: "confirmed" as const,
    paidSeats: true,
    rainPolicy: "hold" as const,
    launch: { lng: 139.077, lat: 35.096 },
  },
  {
    id: "sakata-hanabi-2026",
    seriesId: "sakata-hanabi",
    date: "2026-09-12",
    prefecture: "山形県",
    city: "酒田市",
    confirmation: "confirmed" as const,
    paidSeats: true,
    rainPolicy: "hold" as const,
    launch: { lng: 139.843, lat: 38.914 },
  },
];

test("열해 다른 날짜도 09-13에 붙인 명당을 쓴다", () => {
  const spots = [
    { id: "atami-sunbeach", festivalId: "atami-kaijo-2026-09-13" },
    { id: "sakata-swan", festivalId: "sakata-hanabi-2026" },
  ];
  expect(
    spotsForFestival(spots, FESTIVALS, "atami-kaijo-2026-10-12").map((s) => s.id),
  ).toEqual(["atami-sunbeach"]);
});

test("열해 다른 날짜 통제는 현재 행사 id로 바꿔 평가할 수 있다", () => {
  const controls = [
    {
      id: "atami-launch-perimeter",
      festivalId: "atami-kaijo-2026-09-13",
      kind: "launch_perimeter" as const,
      radiusMeters: 300,
      center: null,
      spotIds: "*" as const,
    },
  ];
  const resolved = controlsForFestival(
    controls,
    FESTIVALS,
    "atami-kaijo-2026-10-12",
  );
  expect(resolved).toEqual([
    { ...controls[0], festivalId: "atami-kaijo-2026-10-12" },
  ]);
});

test("유료보다 통제 뱃지가 앞선다", () => {
  expect(
    accessBadge({
      crowFlyMeters: 21,
      walkMeters: null,
      insidePerimeter: true,
      vehicleRestricted: false,
      pedestrianBlocked: false,
      ticketRequired: true,
      stationControlled: false,
      reachable: false,
      controlIds: ["pad"],
    }),
  ).toBe("blocked");
});

test("설 수 있는 유료석은 유료 뱃지다", () => {
  expect(
    accessBadge({
      crowFlyMeters: 400,
      walkMeters: null,
      insidePerimeter: false,
      vehicleRestricted: true,
      pedestrianBlocked: false,
      ticketRequired: true,
      stationControlled: false,
      reachable: true,
      controlIds: ["gate", "car"],
    }),
  ).toBe("paid");
});

test("차량 규제만이면 차량규제 뱃지다", () => {
  expect(
    accessBadge({
      crowFlyMeters: 900,
      walkMeters: null,
      insidePerimeter: false,
      vehicleRestricted: true,
      pedestrianBlocked: false,
      ticketRequired: false,
      stationControlled: false,
      reachable: true,
      controlIds: ["car"],
    }),
  ).toBe("vehicle");
});
