// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { AppRoutes } from "../../src/App.tsx";
import { RouteErrorBoundary } from "../../src/ui/ErrorBoundary.tsx";
import type { Lang } from "../../src/ui/i18n.ts";
import { LangProvider } from "../../src/ui/Lang.tsx";

// WebGL 이 없는 jsdom 에서 지도·three 는 그리지 않는다. 화면 구조만 본다.
vi.mock("../../src/ui/map/FestivalMap.tsx", () => ({
  FestivalMap: (props: { spots: { id: string }[]; selectedId?: string | null }) => (
    <div
      data-testid="map"
      data-spots={props.spots.map((spot) => spot.id).join(",")}
      data-selected={props.selectedId ?? ""}
    />
  ),
}));
vi.mock("../../src/ui/look/LookViewer.tsx", () => ({
  LookViewer: () => <div data-testid="look" />,
}));

function mount(path: string, lang: Lang = "ko") {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </LangProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

test("목록은 기준일 이후 행사만 날짜순으로 보여 준다", () => {
  mount("/");
  const cards = screen.getAllByRole("listitem");
  expect(cards.length).toBeGreaterThan(10);
  const dates = cards.map((card) => within(card).getByRole("time").getAttribute("datetime"));
  const sorted = dates.map((d, i) => (i === 0 ? d : d! >= dates[i - 1]! ? d : "BAD"));
  // 시즌 행사(도야코)는 시작일이 지났어도 맨 위에 남고, 그 뒤는 오름차순이다.
  expect(sorted.slice(1)).not.toContain("BAD");
  expect(screen.getByText(/酒田の花火/)).toBeTruthy();
  expect(screen.queryByText(/2026-09-03/)).toBeNull();
});

test("필터는 URL 에서 읽고, 결과가 없으면 초기화 버튼을 보여 준다", () => {
  mount("/?from=2027-01-01");
  expect(screen.getByRole("status").textContent).toMatch(/행사가 없습니다/);
  fireEvent.click(screen.getByRole("button", { name: /필터 초기화/ }));
  expect(screen.getAllByRole("listitem").length).toBeGreaterThan(10);
  expect(screen.getByRole("status").textContent).toMatch(/개 행사/);
});

test("목록은 달 단위로 묶이고 시즌 행사는 남은 첫 달에 놓인다", () => {
  mount("/");
  const months = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(months[0]).toBe("2026년 9월");
  expect(months).toContain("2026년 12월");
  // 4월에 시작한 도야코 롱런은 9월 묶음 안에 있다.
  const september = screen.getAllByRole("heading", { level: 3 })[0].parentElement!;
  expect(within(september).getByText(/洞爺湖ロングラン/)).toBeTruthy();
});

test("행사 화면의 캘린더 링크는 ICS 데이터 URL 이다", async () => {
  mount("/e/atami-kaijo-2026-09-13");
  await screen.findByTestId("map");
  const link = screen.getByRole("link", { name: /캘린더 추가/ });
  expect(link.getAttribute("download")).toBe("atami-kaijo-2026-09-13.ics");
  const ics = decodeURIComponent(link.getAttribute("href")!.replace("data:text/calendar;charset=utf-8,", ""));
  expect(ics).toContain("DTSTART:20260913T112000Z");
  expect(ics).toContain("GEO:35.096;139.077");
});

test("지도 칩은 URL 의 레이어 상태를 그대로 보여 준다", async () => {
  mount("/e/atami-kaijo-2026-09-13?ctl=0&fw=0");
  await screen.findByTestId("map");
  const group = screen.getByRole("group", { name: "지도 레이어" });
  expect(within(group).getByRole("button", { name: "통제 지역" }).getAttribute("aria-pressed")).toBe("false");
  expect(within(group).getByRole("button", { name: "예상 혼잡" }).getAttribute("aria-pressed")).toBe("true");
  expect(within(group).getByRole("button", { name: "불꽃" }).getAttribute("aria-pressed")).toBe("false");
});

test("현 필터는 그 현만 남긴다", () => {
  mount("/?pref=沖縄県");
  const cards = screen.getAllByRole("listitem");
  expect(cards).toHaveLength(1);
  expect(cards[0].textContent).toMatch(/오키나와현/);
});

test("언어를 바꾸면 제목과 html lang 이 따라간다", () => {
  mount("/");
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Japan fireworks map");
  expect(document.documentElement.lang).toBe("en");
  expect(localStorage.getItem("hanabi-lang")).toBe("en");
});

test("모르는 경로는 404 화면이다", () => {
  mount("/no/such/page");
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("페이지가 없습니다");
  expect(screen.getByRole("link", { name: /목록/ }).getAttribute("href")).toBe("/");
});

test("없는 행사는 목록으로 돌려보낸다", async () => {
  mount("/e/ghost-festival");
  // 행사 화면은 지연 로드라 Navigate 가 한 틱 뒤에 돈다.
  const heading = await screen.findByRole("heading", { level: 1 });
  expect(heading.textContent).toBe("일본 불꽃놀이 지도");
});

test("행사 화면은 지도와 시트를 그리고 탭 상태를 URL 에서 읽는다", async () => {
  mount("/e/atami-kaijo-2026-09-13?tab=spots");
  const map = await screen.findByTestId("map");
  expect(map.getAttribute("data-spots")).toContain("atami-sunbeach");
  expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/아타미 해상 불꽃놀이/);
  const active = screen.getAllByRole("button", { current: "page" });
  expect(active).toHaveLength(1);
  expect(active[0].textContent).toBe("관람 Spot");
  expect(document.title).toBe("아타미 해상 불꽃놀이 · 일본 불꽃놀이 지도");
});

test("명당 화면은 선택된 명당을 지도에 넘기고 통제 뱃지를 붙인다", async () => {
  mount("/e/atami-kaijo-2026-09-13/p/atami-pad", "en");
  const map = await screen.findByTestId("map");
  expect(map.getAttribute("data-selected")).toBe("atami-pad");
  // 거리 줄의 뱃지. 「다른 명당」목록에도 같은 뱃지가 붙을 수 있어 하나 이상이면 된다.
  expect(screen.getAllByText("Closed").length).toBeGreaterThanOrEqual(1);
  expect(screen.getByRole("link", { name: /Sightline sketch/ }).getAttribute("href")).toBe(
    "/e/atami-kaijo-2026-09-13/p/atami-pad/3d",
  );
  // 발사 반경 안이라 거리 대신 뱃지가 먼저 읽힌다.
  expect(screen.getByText(/About 21m to the fireworks/)).toBeTruthy();
});

test("제보는 본문이 비면 저장하지 않고 안내를 띄운다", async () => {
  mount("/e/atami-kaijo-2026-09-13/p/atami-sunbeach");
  await screen.findByTestId("map");
  fireEvent.click(screen.getByRole("button", { name: "이 기기에 남기기" }));
  expect(screen.getByRole("alert").textContent).toBe("내용을 적어 주세요.");
  expect(localStorage.getItem("hanabi-reports-v1")).toBeNull();

  fireEvent.change(screen.getByRole("textbox", { name: "지금 보이는 것" }), {
    target: { value: "모래사장 절반 찼어요" },
  });
  fireEvent.click(screen.getByRole("button", { name: "이 기기에 남기기" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText("모래사장 절반 찼어요")).toBeTruthy();
  expect(JSON.parse(localStorage.getItem("hanabi-reports-v1") ?? "[]")).toHaveLength(1);
});

test("렌더 에러는 경계가 받아 목록 링크를 남긴다", () => {
  const Boom = () => {
    throw new Error("boom");
  };
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <LangProvider initial="ko">
      <MemoryRouter>
        <RouteErrorBoundary>
          <Boom />
        </RouteErrorBoundary>
      </MemoryRouter>
    </LangProvider>,
  );
  expect(screen.getByRole("alert").textContent).toMatch(/화면을 그리지 못했습니다/);
  expect(screen.getByText("boom")).toBeTruthy();
  expect(screen.getByRole("link", { name: /목록/ })).toBeTruthy();
  spy.mockRestore();
});
