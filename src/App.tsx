import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LangProvider } from "./ui/Lang.tsx";
import { CatalogPage } from "./ui/pages/CatalogPage.tsx";
import { FestivalPage } from "./ui/pages/FestivalPage.tsx";
import { LookPage } from "./ui/pages/LookPage.tsx";
import { SpotPage } from "./ui/pages/SpotPage.tsx";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export function App() {
  return (
    <LangProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/e/:festivalId" element={<FestivalPage />} />
          <Route path="/e/:festivalId/p/:spotId" element={<SpotPage />} />
          <Route path="/e/:festivalId/p/:spotId/3d" element={<LookPage />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  );
}
