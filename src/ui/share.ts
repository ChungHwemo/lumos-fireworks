export function parseShareCoord(
  search: URLSearchParams,
): { lng: number; lat: number } | null {
  const lngRaw = search.get("lng");
  const latRaw = search.get("lat");
  if (lngRaw == null || latRaw == null || lngRaw === "" || latRaw === "") return null;
  const lng = Number(lngRaw);
  const lat = Number(latRaw);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
  return { lng, lat };
}

export async function shareUrl(title: string, text: string, url: string): Promise<"shared" | "copied"> {
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return "shared";
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

export function googleDir(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function appleDir(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}`;
}
