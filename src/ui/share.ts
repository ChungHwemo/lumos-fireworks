export function parseShareCoord(
  search: URLSearchParams,
): { lng: number; lat: number } | null {
  return parseCoordPair(search.get("lng"), search.get("lat"));
}

export function parseCoordPair(
  lngRaw: string | null,
  latRaw: string | null,
): { lng: number; lat: number } | null {
  if (lngRaw == null || latRaw == null || lngRaw === "" || latRaw === "") return null;
  const lng = Number(lngRaw);
  const lat = Number(latRaw);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
  return { lng, lat };
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/**
 * Web Share 가 있으면 시트를 띄우고, 없으면 클립보드에 복사한다.
 * 사용자가 시트를 닫으면 cancelled, 둘 다 막혀 있으면 failed. 던지지 않는다.
 */
export async function shareUrl(title: string, text: string, url: string): Promise<ShareResult> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // 공유 시트가 거부되면 클립보드로 내려간다.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

export function googleDir(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function appleDir(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}`;
}
