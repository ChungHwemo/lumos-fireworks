import { addReport, type Report, type ReportDraft } from "../domain/report.ts";

const KEY = "hanabi-reports-v1";

export function loadReports(): Report[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Report[]) : [];
  } catch {
    return [];
  }
}

export function persistReport(draft: ReportDraft): Report[] {
  const next = addReport(loadReports(), draft);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
