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
    .sort(
      (a, b) =>
        upcomingDate(a, query.from).localeCompare(upcomingDate(b, query.from)) ||
        a.city.localeCompare(b.city),
    );
}

/** 시즌 행사는 시작일이 이미 지났어도 남는다. 정렬은 아직 남은 날짜로 한다. */
function upcomingDate(festival: Festival, from: string): string {
  return festival.date > from ? festival.date : from;
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
