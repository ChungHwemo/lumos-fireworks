import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { messages, type Lang } from "./i18n.ts";

const KEY = "hanabi-lang";

type Dict = Record<keyof (typeof messages)["ko"], string>;

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
};

const LangContext = createContext<Ctx | null>(null);

function readLang(): Lang {
  const stored = localStorage.getItem(KEY);
  if (stored === "en" || stored === "ja" || stored === "ko") return stored;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("en")) return "en";
  return "ko";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const setLang = (next: Lang) => {
    localStorage.setItem(KEY, next);
    setLangState(next);
  };
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(
    () => ({ lang, setLang, t: messages[lang] }),
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("LangProvider missing");
  return ctx;
}
