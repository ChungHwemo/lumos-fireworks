import type { Festival, FestivalQuery } from "./types.ts";

export function listFestivals(
  catalog: readonly Festival[],
  query: FestivalQuery,
): Festival[] {
  return catalog
    .filter((festival) => {
      const end = festival.dateEnd ?? festival.date;
      if (end < query.from) return false;
      if (festival.confirmation !== query.confirmation) return false;
      if (query.rainPolicy && festival.rainPolicy !== query.rainPolicy) {
        return false;
      }
      if (query.paidSeats !== undefined && festival.paidSeats !== query.paidSeats) {
        return false;
      }
      return true;
    })
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.city.localeCompare(b.city));
}

export function listFestivalDates(
  catalog: readonly Festival[],
  seriesId: string,
): Festival[] {
  return catalog
    .filter((festival) => festival.seriesId === seriesId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function isFestivalDay(festival: Festival, now: Date): boolean {
  const tokyoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const end = festival.dateEnd ?? festival.date;
  return tokyoDate >= festival.date && tokyoDate <= end;
}
