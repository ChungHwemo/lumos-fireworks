import { Link } from "react-router-dom";
import { Icon } from "../Icon.tsx";
import { useLang } from "../Lang.tsx";
import { useDocumentTitle } from "../useDocumentTitle.ts";

export function NotFoundPage() {
  const { t } = useLang();
  useDocumentTitle(t.notFoundTitle);
  return (
    <main className="page page-list">
      <section className="panel">
        <p className="kicker">404</p>
        <h1>{t.notFoundTitle}</h1>
        <p className="lede">{t.notFoundBody}</p>
        <p className="action-row">
          <Link className="pill pill-primary" to="/">
            <Icon name="chevron-left" size={15} /> {t.back}
          </Link>
        </p>
      </section>
    </main>
  );
}
