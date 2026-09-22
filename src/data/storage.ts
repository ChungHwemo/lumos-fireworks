/**
 * localStorage 는 사생활 보호 모드·용량 초과·iframe 정책에서 던진다.
 * 여기서 전부 삼키고 호출자는 값 없음(null) 또는 실패(false)만 본다.
 */

export function readStorage(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    globalThis.localStorage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readJson<T>(key: string, guard: (value: unknown) => value is T): T | null {
  const raw = readStorage(key);
  if (raw == null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
