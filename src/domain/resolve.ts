export function spotsForFestival<
  TSpot extends { festivalId: string },
  TFestival extends { id: string; seriesId: string },
>(
  spots: readonly TSpot[],
  festivals: readonly TFestival[],
  festivalId: string,
): TSpot[] {
  const ids = relatedFestivalIds(festivals, festivalId);
  return spots.filter((spot) => ids.has(spot.festivalId));
}

export function controlsForFestival<
  TControl extends { festivalId: string },
  TFestival extends { id: string; seriesId: string },
>(
  controls: readonly TControl[],
  festivals: readonly TFestival[],
  festivalId: string,
): TControl[] {
  const ids = relatedFestivalIds(festivals, festivalId);
  return controls
    .filter((control) => ids.has(control.festivalId))
    .map((control) => ({ ...control, festivalId }));
}

function relatedFestivalIds<TFestival extends { id: string; seriesId: string }>(
  festivals: readonly TFestival[],
  festivalId: string,
): Set<string> {
  const current = festivals.find((festival) => festival.id === festivalId);
  if (!current) return new Set();
  return new Set(
    festivals
      .filter((festival) => festival.seriesId === current.seriesId)
      .map((festival) => festival.id),
  );
}
