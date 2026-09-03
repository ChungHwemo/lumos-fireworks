import { useLang } from "./Lang.tsx";
import type { Lang } from "./i18n.ts";

const ORDER: Lang[] = ["ko", "ja", "en"];

export function LangSwitch() {
  const { lang, setLang, t } = useLang();
  const label: Record<Lang, string> = {
    ko: t.langKo,
    ja: t.langJa,
    en: t.langEn,
  };
  return (
    <p className="lang-switch">
      <strong>{t.lang}</strong>
      <span>
        {ORDER.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
          >
            {label[code]}
          </button>
        ))}
      </span>
    </p>
  );
}
