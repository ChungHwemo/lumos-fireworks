import { useLang } from "./Lang.tsx";
import type { Lang } from "./i18n.ts";

/** 기본 언어가 앞. 日本語 → 한국어 → English. */
const ORDER: Lang[] = ["ja", "ko", "en"];

/** 짧은 표기도 화면 언어로. 일본어 화면에 한글 「한」을 남기지 않는다. */
const SHORT: Record<Lang, Record<Lang, string>> = {
  ja: { ja: "日", ko: "韓", en: "EN" },
  ko: { ja: "일", ko: "한", en: "EN" },
  en: { ja: "JA", ko: "KO", en: "EN" },
};

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  const label: Record<Lang, string> = {
    ko: t.langKo,
    ja: t.langJa,
    en: t.langEn,
  };
  const short = SHORT[lang];
  return (
    <div className={`lang-switch${compact ? " is-compact" : ""}`} role="group" aria-label={t.lang}>
      {!compact && <strong>{t.lang}</strong>}
      <span className="segmented">
        {ORDER.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
            aria-label={compact ? label[code] : undefined}
            title={compact ? label[code] : undefined}
          >
            {compact ? short[code] : label[code]}
          </button>
        ))}
      </span>
    </div>
  );
}
