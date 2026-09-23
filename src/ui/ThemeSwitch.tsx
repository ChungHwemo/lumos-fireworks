import { Icon } from "./Icon.tsx";
import { useLang } from "./Lang.tsx";
import { useTheme, type ThemePref } from "./theme.ts";

const ORDER: ThemePref[] = ["system", "light", "dark"];

/** 설정 화면용 세 갈래. 기기 설정 · 밝게 · 어둡게. */
export function ThemeSwitch() {
  const { t } = useLang();
  const { pref, setPref } = useTheme();
  const label: Record<ThemePref, string> = {
    system: t.themeSystem,
    light: t.themeLight,
    dark: t.themeDark,
  };
  return (
    <div className="lang-switch" role="group" aria-label={t.theme}>
      <strong>{t.theme}</strong>
      <span className="segmented">
        {ORDER.map((value) => (
          <button key={value} type="button" aria-pressed={pref === value} onClick={() => setPref(value)}>
            {label[value]}
          </button>
        ))}
      </span>
    </div>
  );
}

/** 목록 상단의 한 알. 지금 색의 반대로 고정한다. 기기 설정으로 되돌리는 것은 설정 화면에서. */
export function ThemeToggle() {
  const { t } = useLang();
  const { theme, setPref } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const nextLabel = next === "light" ? t.themeLight : t.themeDark;
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={`${t.theme}: ${nextLabel}`}
      title={`${t.theme}: ${nextLabel}`}
      onClick={() => setPref(next)}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}
