import { useLang } from "./Lang.tsx";
import type { Lang } from "./i18n.ts";

const ORDER: Lang[] = ["ko", "ja", "en"];

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  const label: Record<Lang, string> = {
    ko: t.langKo,
    ja: t.langJa,
    en: t.langEn,
  };
  const short: Record<Lang, string> = { ko: "한", ja: "日", en: "EN" };
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
