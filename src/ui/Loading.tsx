import { useLang } from "./Lang.tsx";

export function Loading() {
  const { t } = useLang();
  return (
    <main className="page page-list" aria-busy="true">
      <p className="loading" role="status">
        {t.loading}
      </p>
    </main>
  );
}
