import {
  addReport,
  REPORT_KINDS,
  type Report,
  type ReportDraft,
} from "../domain/report.ts";
import { readJson, writeStorage } from "./storage.ts";

const KEY = "hanabi-reports-v1";

export function isReport(value: unknown): value is Report {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.festivalId === "string" &&
    (row.spotId === null || typeof row.spotId === "string") &&
    typeof row.kind === "string" &&
    (REPORT_KINDS as readonly string[]).includes(row.kind) &&
    typeof row.body === "string" &&
    typeof row.createdAt === "string" &&
    typeof row.lng === "number" &&
    typeof row.lat === "number"
  );
}

/** 깨진 행은 그 행만 버린다. 저장소 전체를 잃지 않는다. */
export function loadReports(): Report[] {
  const list = readJson(KEY, (value): value is unknown[] => Array.isArray(value));
  return list ? list.filter(isReport) : [];
}

export class ReportStorageError extends Error {
  constructor() {
    super("could not persist report");
    this.name = "ReportStorageError";
  }
}

export function persistReport(draft: ReportDraft): Report[] {
  const next = addReport(loadReports(), draft);
  if (!writeStorage(KEY, JSON.stringify(next))) {
    throw new ReportStorageError();
  }
  return next;
}
