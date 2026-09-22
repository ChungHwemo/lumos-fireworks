import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RouteErrorBoundary } from "./ui/ErrorBoundary.tsx";
import { LangProvider } from "./ui/Lang.tsx";
import { Loading } from "./ui/Loading.tsx";
import { CatalogPage } from "./ui/pages/CatalogPage.tsx";
import { NotFoundPage } from "./ui/pages/NotFoundPage.tsx";

// 목록은 첫 화면이라 바로 싣는다. 지도·three 는 행사 화면부터만 내려받는다.
const FestivalPage = lazy(() =>
  import("./ui/pages/FestivalPage.tsx").then((m) => ({ default: m.FestivalPage })),
);
const SpotPage = lazy(() =>
  import("./ui/pages/SpotPage.tsx").then((m) => ({ default: m.SpotPage })),
);
const LookPage = lazy(() =>
  import("./ui/pages/LookPage.tsx").then((m) => ({ default: m.LookPage })),
);

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/e/:festivalId" element={<FestivalPage />} />
          <Route path="/e/:festivalId/p/:spotId" element={<SpotPage />} />
          <Route path="/e/:festivalId/p/:spotId/3d" element={<LookPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

export function App() {
  return (
    <LangProvider>
      <BrowserRouter basename={basename}>
        <AppRoutes />
      </BrowserRouter>
    </LangProvider>
  );
}
