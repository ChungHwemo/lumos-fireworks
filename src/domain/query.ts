export const FROM_DEFAULT = "2026-09-04";

export function parseFromQuery(
  raw: string | null,
  fallback = FROM_DEFAULT,
): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fallback;
  return raw;
}
