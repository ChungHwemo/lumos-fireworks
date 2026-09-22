import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "./Lang.tsx";

type State = { error: Error | null };

class Boundary extends Component<
  { children: ReactNode; fallback: (error: Error) => ReactNode },
  State
> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("render failed", error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

function Fallback({ error }: { error: Error }) {
  const { t } = useLang();
  return (
    <main className="page page-list" role="alert">
      <section className="panel">
        <h1>{t.errorTitle}</h1>
        <p className="lede">{t.errorBody}</p>
        <p className="meta">{error.message}</p>
        <p className="action-row">
          <button type="button" className="pill pill-primary" onClick={() => window.location.reload()}>
            {t.reload}
          </button>
          <Link className="pill" to="/">
            ← {t.back}
          </Link>
        </p>
      </section>
    </main>
  );
}

/** 경로가 바뀌면 경계가 다시 마운트되어 이전 화면의 에러가 다음 화면을 막지 않는다. */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <Boundary key={pathname} fallback={(error) => <Fallback error={error} />}>
      {children}
    </Boundary>
  );
}
