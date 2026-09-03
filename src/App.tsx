import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LangProvider } from "./ui/Lang.tsx";
import { CatalogPage } from "./ui/pages/CatalogPage.tsx";
import { FestivalPage } from "./ui/pages/FestivalPage.tsx";
import { SpotPage } from "./ui/pages/SpotPage.tsx";

export function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/e/:festivalId" element={<FestivalPage />} />
          <Route path="/e/:festivalId/p/:spotId" element={<SpotPage />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  );
}
