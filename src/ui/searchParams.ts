import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type ParamPatch = Record<string, string | null | undefined>;

/**
 * URLSearchParams 를 제자리에서 고치지 않고 새 객체로 갈아 끼운다.
 * null/undefined 는 키 삭제다. 히스토리는 replace 라 뒤로 가기가 필터 단계마다 멈추지 않는다.
 */
export function useUpdateParams(): (patch: ParamPatch) => void {
  const [, setParams] = useSearchParams();
  return useCallback(
    (patch: ParamPatch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value == null) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
}

export function flag(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const raw = params.get(key);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return fallback;
}
