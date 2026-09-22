import { useEffect } from "react";
import { useLang } from "./Lang.tsx";

/** 탭 제목. 앱 이름은 항상 뒤에 붙는다. 화면이 사라지면 앱 이름만 남긴다. */
export function useDocumentTitle(title: string | null | undefined): void {
  const { t } = useLang();
  useEffect(() => {
    document.title = title ? `${title} · ${t.appTitle}` : t.appTitle;
    return () => {
      document.title = t.appTitle;
    };
  }, [title, t.appTitle]);
}
