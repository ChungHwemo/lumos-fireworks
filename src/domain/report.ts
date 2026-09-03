export type ReportKind =
  | "crowd"
  | "restroom"
  | "food"
  | "traffic"
  | "firework"
  | "other";

export type ReportDraft = {
  festivalId: string;
  spotId: string | null;
  kind: ReportKind;
  body: string;
  createdAt: string;
  lng: number;
  lat: number;
};

export type Report = ReportDraft & { id: string };

export function addReport(list: readonly Report[], draft: ReportDraft): Report[] {
  if (!draft.body.trim()) {
    throw new Error("body is required");
  }
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `r-${draft.createdAt}-${list.length}`;
  return [
    { ...draft, id, body: draft.body.trim() },
    ...list,
  ];
}

export function listReports(
  list: readonly Report[],
  query: { festivalId: string; kind?: ReportKind },
): Report[] {
  return list.filter((report) => {
    if (report.festivalId !== query.festivalId) return false;
    if (query.kind && report.kind !== query.kind) return false;
    return true;
  });
}

export function crowdHeat(
  spots: readonly {
    id: string;
    lng: number;
    lat: number;
    crowdLevel?: number;
  }[],
  reports: readonly Report[],
): { id: string; lng: number; lat: number; level: number }[] {
  return spots.map((spot) => {
    const extra = reports.filter(
      (report) => report.kind === "crowd" && report.spotId === spot.id,
    ).length;
    return {
      id: spot.id,
      lng: spot.lng,
      lat: spot.lat,
      level: Math.min(5, (spot.crowdLevel ?? 1) + extra),
    };
  });
}
