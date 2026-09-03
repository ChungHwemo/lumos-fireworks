import { useState } from "react";
import { persistReport } from "../../data/reports.ts";
import type { Report, ReportKind } from "../../domain/report.ts";
import { useLang } from "../Lang.tsx";

const KINDS: ReportKind[] = [
  "crowd",
  "restroom",
  "food",
  "traffic",
  "firework",
  "other",
];

export function ReportForm({
  festivalId,
  spotId,
  lng,
  lat,
  onSaved,
}: {
  festivalId: string;
  spotId: string | null;
  lng: number;
  lat: number;
  onSaved: (list: Report[]) => void;
}) {
  const { t } = useLang();
  const [kind, setKind] = useState<ReportKind>("crowd");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const kindLabel: Record<ReportKind, string> = {
    crowd: t.reportKindCrowd,
    restroom: t.reportKindRestroom,
    food: t.reportKindFood,
    traffic: t.reportKindTraffic,
    firework: t.reportKindFirework,
    other: t.reportKindOther,
  };

  return (
    <form
      className="report-form"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          const list = persistReport({
            festivalId,
            spotId,
            kind,
            body,
            createdAt: new Date().toISOString(),
            lng,
            lat,
          });
          setBody("");
          setError("");
          onSaved(list);
        } catch {
          setError(t.reportBody);
        }
      }}
    >
      <label>
        {t.tabReports}
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as ReportKind)}
        >
          {KINDS.map((row) => (
            <option key={row} value={row}>
              {kindLabel[row]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.reportBody}
        <textarea
          value={body}
          rows={3}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <button type="submit" className="primary">
        {t.reportSubmit}
      </button>
      <p className="note">{t.reportLocal}</p>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

export function reportKindLabel(
  kind: ReportKind,
  t: ReturnType<typeof useLang>["t"],
): string {
  return {
    crowd: t.reportKindCrowd,
    restroom: t.reportKindRestroom,
    food: t.reportKindFood,
    traffic: t.reportKindTraffic,
    firework: t.reportKindFirework,
    other: t.reportKindOther,
  }[kind];
}
