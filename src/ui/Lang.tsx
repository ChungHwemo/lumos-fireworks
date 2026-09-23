import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readStorage, writeStorage } from "../data/storage.ts";
import { isLang, messages, type Dict, type Lang } from "./i18n.ts";

const KEY = "hanabi-lang";

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
};

const LangContext = createContext<Ctx | null>(null);

/** 기본은 日本語. 사용자가 고른 언어만 이긴다. 브라우저 언어는 보지 않는다. */
export const DEFAULT_LANG: Lang = "ja";

function readLang(): Lang {
  const stored = readStorage(KEY);
  return isLang(stored) ? stored : DEFAULT_LANG;
}

export function LangProvider({
  children,
  initial,
}: {
  children: ReactNode;
  /** 테스트나 SSR 에서 브라우저 설정을 건너뛸 때만 준다. */
  initial?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? readLang());
  const setLang = useCallback((next: Lang) => {
    writeStorage(KEY, next);
    setLangState(next);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(
    () => ({ lang, setLang, t: messages[lang] }),
    [lang, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("LangProvider missing");
  return ctx;
}
