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
