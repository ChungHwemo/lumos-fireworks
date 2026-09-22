// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from "vitest";
import { loadReports, persistReport, ReportStorageError } from "../../src/data/reports.ts";
import { readJson, readStorage, writeStorage } from "../../src/data/storage.ts";

const KEY = "hanabi-reports-v1";

const DRAFT = {
  festivalId: "atami-kaijo-2026-09-13",
  spotId: "atami-sunbeach",
  kind: "crowd" as const,
  body: "모래사장이 거의 찼어요",
  createdAt: "2026-09-13T10:00:00+09:00",
  lng: 139.0777,
  lat: 35.1032,
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

test("깨진 JSON 은 빈 목록으로 읽힌다", () => {
  localStorage.setItem(KEY, "{not json");
  expect(loadReports()).toEqual([]);
});

test("모양이 다른 행만 버리고 나머지는 남긴다", () => {
  const good = { ...DRAFT, id: "r1" };
  localStorage.setItem(
    KEY,
    JSON.stringify([good, { id: "r2" }, null, { ...DRAFT, id: "r3", kind: "hacked" }]),
  );
  expect(loadReports()).toEqual([good]);
});

test("저장이 막히면 ReportStorageError 를 던진다", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("quota", "QuotaExceededError");
  });
  expect(() => persistReport(DRAFT)).toThrow(ReportStorageError);
});

test("정상 저장은 새 목록을 돌려주고 다시 읽힌다", () => {
  const list = persistReport(DRAFT);
  expect(list).toHaveLength(1);
  expect(loadReports()).toEqual(list);
});

test("storage 래퍼는 던지지 않는다", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(readStorage("x")).toBeNull();
  expect(writeStorage("x", "1")).toBe(false);
  expect(readJson("x", (v): v is number => typeof v === "number")).toBeNull();
});
