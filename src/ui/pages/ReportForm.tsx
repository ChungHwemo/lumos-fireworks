import { useId, useState } from "react";
import { persistReport, ReportStorageError } from "../../data/reports.ts";
import { REPORT_KINDS, type Report, type ReportKind } from "../../domain/report.ts";
import { reportKindLabel } from "../labels.ts";
import { useLang } from "../Lang.tsx";

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
  const errorId = useId();

  return (
    <form
      className="report-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim()) {
          setError(t.reportBodyRequired);
          return;
        }
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
        } catch (cause) {
          setError(cause instanceof ReportStorageError ? t.reportSaveFailed : t.reportBodyRequired);
        }
      }}
    >
      <label>
        {t.tabReports}
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as ReportKind)}
        >
          {REPORT_KINDS.map((row) => (
            <option key={row} value={row}>
              {reportKindLabel(row, t)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.reportBody}
        <textarea
          value={body}
          rows={3}
          maxLength={500}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setBody(event.target.value);
            if (error) setError("");
          }}
        />
      </label>
      <button type="submit" className="primary">
        {t.reportSubmit}
      </button>
      <p className="note">{t.reportLocal}</p>
      {error && (
        <p id={errorId} role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
