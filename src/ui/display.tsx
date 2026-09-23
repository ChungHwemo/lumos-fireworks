import { festivalStationPoint } from "../domain/station.ts";
import type { FestivalRecord, SpotRecord } from "../domain/types.ts";
import { festivalCopy, spotCopy } from "./content.ts";
import type { Lang } from "./i18n.ts";

/** 고른 언어의 이름 하나만. 다른 언어는 병기하지 않는다. 영어 이름이 없으면 일본어 원어를 쓴다. */
export function localName(names: { ko: string; ja: string; en?: string }, lang: Lang): string {
  if (lang === "ja") return names.ja;
  if (lang === "en") return names.en || names.ja;
  return names.ko;
}

export function LocalName({
  ko,
  ja,
  en,
  lang,
}: {
  ko: string;
  ja: string;
  en?: string;
  lang: Lang;
}) {
  return <>{localName({ ko, ja, en }, lang)}</>;
}

export function festivalTitle(festival: FestivalRecord, lang: Lang) {
  const copy = festivalCopy(festival.seriesId);
  const en = copy.nameEn || festival.nameJa;
  return {
    primary: lang === "ja" ? festival.nameJa : lang === "en" ? en : festival.nameKo,
    ko: festival.nameKo,
    ja: festival.nameJa,
    en,
  };
}

export function festivalVenue(festival: FestivalRecord, lang: Lang) {
  const copy = festivalCopy(festival.seriesId);
  const en = copy.venueEn || festival.venueJa;
  return {
    primary: lang === "ja" ? festival.venueJa : lang === "en" ? en : festival.venueKo,
    ko: festival.venueKo,
    ja: festival.venueJa,
    en,
  };
}

/** 고른 언어의 문장. 사본이 없으면 한국어만 시드로 채운다. */
export function localized(
  copy: { ko: string; ja: string; en: string } | undefined,
  lang: Lang,
  fallbackKo = "",
): string {
  if (!copy) return lang === "ko" ? fallbackKo : "";
  return localName(copy, lang);
}

export function festivalStationPair(festival: Pick<FestivalRecord, "seriesId" | "nearestStationKo">) {
  const copy = festivalCopy(festival.seriesId);
  const point = festivalStationPoint(festival);
  return {
    ko: point?.label.ko ?? festival.nearestStationKo,
    ja: point?.label.ja || copy.stationJa,
    en: point?.label.en || copy.stationEn || copy.stationJa || point?.label.ja || "",
  };
}

export function festivalStation(
  festival: Pick<FestivalRecord, "seriesId" | "nearestStationKo">,
  lang: Lang,
): string {
  return localName(festivalStationPair(festival), lang);
}

export function festivalRainNote(
  festival: Pick<FestivalRecord, "seriesId" | "rainNoteKo">,
  lang: Lang,
): string {
  const copy = festivalCopy(festival.seriesId);
  if (lang === "ja") return copy.rainJa;
  if (lang === "en") return copy.rainEn || copy.rainJa;
  return festival.rainNoteKo;
}

export function spotField(
  spot: Pick<SpotRecord, "id">,
  field: "description" | "viewing" | "crowd" | "restroom" | "food" | "transit" | "access" | "visibility",
  fallback: string | undefined,
  lang: Lang,
): string {
  const pack = spotCopy(spot.id);
  const row = pack?.[field];
  if (lang === "ko") return row?.ko ?? fallback ?? "";
  if (lang === "ja") return row?.ja ?? "";
  return row?.en || row?.ja || "";
}
