import type { FestivalRecord, SpotRecord } from "../domain/types.ts";
import { festivalCopy, spotCopy } from "./content.ts";
import type { Lang } from "./i18n.ts";

export function NamePair({
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
  if (lang === "ja") {
    return (
      <>
        <span lang="ja">{ja}</span> <span lang="ko">{ko}</span>
      </>
    );
  }
  if (lang === "en") {
    return (
      <>
        {en ?? ja} <span lang="ja">{ja}</span>
      </>
    );
  }
  return (
    <>
      {ko} <span lang="ja">{ja}</span>
    </>
  );
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

export function festivalStation(festival: FestivalRecord, lang: Lang): string {
  const copy = festivalCopy(festival.seriesId);
  if (lang === "ja") return copy.stationJa || festival.nearestStationKo;
  if (lang === "en") return copy.stationEn || festival.nearestStationKo;
  return festival.nearestStationKo;
}

export function festivalRainNote(festival: FestivalRecord, lang: Lang): string {
  const copy = festivalCopy(festival.seriesId);
  if (lang === "ja") return copy.rainJa || festival.rainNoteKo;
  if (lang === "en") return copy.rainEn || festival.rainNoteKo;
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
  if (!row) return fallback ?? "";
  return row[lang];
}
