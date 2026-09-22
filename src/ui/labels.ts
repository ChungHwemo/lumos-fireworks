import type { AccessBadge } from "../domain/badge.ts";
import type { ReportKind } from "../domain/report.ts";
import type { RainPolicy } from "../domain/types.ts";
import { spotNameEn } from "./content.ts";
import type { Dict, Lang } from "./i18n.ts";

const RAIN_KEY = {
  hold: "rainHold",
  cancel: "rainCancel",
  postpone: "rainPostpone",
  unknown: "rainUnknown",
} as const satisfies Record<RainPolicy, keyof Dict>;

export function rainLabel(policy: RainPolicy, t: Dict): string {
  return t[RAIN_KEY[policy]];
}

const REPORT_KEY = {
  crowd: "reportKindCrowd",
  restroom: "reportKindRestroom",
  food: "reportKindFood",
  traffic: "reportKindTraffic",
  firework: "reportKindFirework",
  other: "reportKindOther",
} as const satisfies Record<ReportKind, keyof Dict>;

export function reportKindLabel(kind: ReportKind, t: Dict): string {
  return t[REPORT_KEY[kind]];
}

export function badgeLabel(badge: AccessBadge, t: Dict): string | null {
  switch (badge) {
    case "blocked":
      return t.badgeBlocked;
    case "paid":
      return t.badgePaid;
    case "vehicle":
      return t.badgeVehicle;
    case null:
      return null;
  }
}

export function spotName(
  spot: { id: string; nameKo: string; nameJa: string },
  lang: Lang,
): string {
  if (lang === "ja") return spot.nameJa;
  if (lang === "en") return spotNameEn(spot.id, spot.nameJa);
  return spot.nameKo;
}

export function dateRange(
  festival: { date: string; dateEnd?: string },
  weekdayOf: (date: string) => string,
): string {
  return festival.dateEnd
    ? `${festival.date}–${festival.dateEnd}`
    : `${festival.date} (${weekdayOf(festival.date)})`;
}

/** 「불꽃까지 약 803m」. 영어만 어순이 뒤집힌다. */
export function distanceLine(meters: number, t: Dict): string {
  const value = `${meters.toLocaleString()}${t.meters}`;
  return [t.toLaunchPrefix, value, t.toLaunchSuffix].filter(Boolean).join(" ");
}

const LOCALE: Record<Lang, string> = { ko: "ko-KR", ja: "ja-JP", en: "en-US" };

/** 「2026년 9월」「September 2026」「2026年9月」. 목록의 달 머리말. */
export function monthLabel(date: string, lang: Lang): string {
  const [year, month] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** 「10월」「Oct」「10月」. 날짜 블록의 작은 글씨. */
export function shortMonth(date: string, lang: Lang): string {
  const [year, month] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}
