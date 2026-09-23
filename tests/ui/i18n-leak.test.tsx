// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AppRoutes } from "../../src/App.tsx";
import { festivals, spots } from "../../src/data/catalog.ts";
import type { Lang } from "../../src/ui/i18n.ts";
import { LangProvider } from "../../src/ui/Lang.tsx";

vi.mock("../../src/ui/map/FestivalMap.tsx", () => ({
  FestivalMap: () => <div data-testid="map" />,
}));
vi.mock("../../src/ui/look/LookViewer.tsx", () => ({
  LookViewer: () => <div data-testid="look" />,
}));

const HANGUL = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
const KANA = /[\u3040-\u30FF]/;
const KANJI = /[\u4E00-\u9FFF]/;

/** 고른 언어에서 나오면 안 되는 글자. 언어 전환 버튼도 화면 언어로 쓴다. */
const FORBIDDEN: Record<Lang, RegExp[]> = {
  ja: [HANGUL],
  ko: [KANA, KANJI],
  en: [HANGUL, KANA, KANJI],
};

function visibleText(): string {
  return document.body.textContent ?? "";
}

async function mountAndRead(path: string, lang: Lang): Promise<string> {
  render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </LangProvider>,
  );
  // 지도 화면은 지연 로드다. 지도(또는 시선) 목이 붙을 때까지 기다린다.
  if (path.startsWith("/e/")) {
    await screen.findByTestId(path.endsWith("/3d") ? "look" : "map");
  }
  return visibleText();
}

function leaks(text: string, lang: Lang): string[] {
  return FORBIDDEN[lang].flatMap((re) => {
    const hits = text.match(new RegExp(`.{0,12}${re.source}.{0,12}`, "g"));
    return hits ? hits.slice(0, 3) : [];
  });
}

afterEach(cleanup);

const LANGS: Lang[] = ["ja", "ko", "en"];
const festivalPaths = festivals.flatMap((festival) => [
  `/e/${festival.id}`,
  `/e/${festival.id}?tab=spots`,
  `/e/${festival.id}?tab=settings`,
]);
const spotPaths = spots.flatMap((spot) => [
  `/e/${spot.festivalId}/p/${spot.id}`,
  `/e/${spot.festivalId}/p/${spot.id}/3d`,
]);

describe.each(LANGS)("%s 화면에는 다른 언어 글자가 없다", (lang) => {
  test("목록", async () => {
    const text = await mountAndRead("/", lang);
    expect(leaks(text, lang)).toEqual([]);
  });

  test("404", async () => {
    const text = await mountAndRead("/nope", lang);
    expect(leaks(text, lang)).toEqual([]);
  });

  test.each(festivalPaths)("행사 %s", async (path) => {
    const text = await mountAndRead(path, lang);
    expect(leaks(text, lang)).toEqual([]);
  });

  test.each(spotPaths)("명당 %s", async (path) => {
    const text = await mountAndRead(path, lang);
    expect(leaks(text, lang)).toEqual([]);
  });
});
