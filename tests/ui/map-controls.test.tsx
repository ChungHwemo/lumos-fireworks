// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { Lang } from "../../src/ui/i18n.ts";
import { LangProvider, useLang } from "../../src/ui/Lang.tsx";
import { MapControls, type ControlsMap } from "../../src/ui/map/MapControls.tsx";

/** 테스트에서 언어를 바꾸는 손잡이. 실제 앱의 setLang 경로를 그대로 탄다. */
function LangButton({ to }: { to: Lang }) {
  const { setLang } = useLang();
  return (
    <button type="button" onClick={() => setLang(to)}>
      lang-{to}
    </button>
  );
}

type Listener = () => void;

/** 카메라 상태만 흉내 내는 지도. 이벤트는 rotate/pitch 만 낸다. */
function fakeMap(initial: { bearing?: number; pitch?: number; zoom?: number } = {}) {
  let bearing = initial.bearing ?? 0;
  let pitch = initial.pitch ?? 78;
  const zoom = initial.zoom ?? 15;
  const listeners = new Map<string, Set<Listener>>();
  const emit = (type: string) => listeners.get(type)?.forEach((fn) => fn());
  const calls: Record<string, unknown[][]> = { easeTo: [], resetNorth: [], zoomIn: [], zoomOut: [] };
  const map = {
    getBearing: () => bearing,
    getPitch: () => pitch,
    getZoom: () => zoom,
    setBearing: (next: number) => {
      bearing = next;
      emit("rotate");
    },
    setPitch: (next: number) => {
      pitch = next;
      emit("pitch");
    },
    easeTo: (options: { bearing?: number; pitch?: number }) => {
      calls.easeTo.push([options]);
      if (options.bearing != null) map.setBearing(options.bearing);
      if (options.pitch != null) map.setPitch(options.pitch);
    },
    resetNorth: (...args: unknown[]) => {
      calls.resetNorth.push(args);
      map.setBearing(0);
    },
    zoomIn: (...args: unknown[]) => calls.zoomIn.push(args),
    zoomOut: (...args: unknown[]) => calls.zoomOut.push(args),
    on: (type: string, fn: Listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    off: (type: string, fn: Listener) => listeners.get(type)?.delete(fn),
  };
  return { map: map as unknown as ControlsMap, calls, listeners };
}

function mount(overrides: Partial<Parameters<typeof MapControls>[0]> = {}, lang: "ko" | "en" = "ko") {
  const fake = fakeMap();
  const props = {
    map: fake.map,
    orbiting: true,
    onOrbitToggle: vi.fn(),
    onInteract: vi.fn(),
    placeHere: vi.fn(() => vi.fn()),
    ...overrides,
  };
  const view = render(
    <LangProvider initial={lang}>
      <MapControls {...props} />
      <LangButton to="en" />
    </LangProvider>,
  );
  return { ...fake, props, view };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("모든 버튼이 화면 언어의 이름을 가진다", () => {
  mount({}, "en");
  const group = screen.getByRole("group", { name: "Map controls" });
  const names = Array.from(group.querySelectorAll("button")).map((b) => b.getAttribute("aria-label"));
  expect(names).toEqual([
    "Reset north · Drag to rotate and tilt · Heading 0°",
    "Rotate left 45°",
    "Rotate right 45°",
    "Flatten to 2D",
    "Auto-rotate",
    "You are here",
    "Zoom in",
    "Zoom out",
  ]);
});

test("회전 버튼은 45° 씩 돌리고 자동 회전을 멈춘다", () => {
  const { calls, props } = mount();
  fireEvent.click(screen.getByRole("button", { name: "오른쪽으로 45° 회전" }));
  expect(calls.easeTo.at(-1)?.[0]).toMatchObject({ bearing: -45 });
  fireEvent.click(screen.getByRole("button", { name: "왼쪽으로 45° 회전" }));
  expect(calls.easeTo.at(-1)?.[0]).toMatchObject({ bearing: 0 });
  expect(props.onInteract).toHaveBeenCalledTimes(2);
});

test("컴패스는 지도 방위를 따라가고, 누르면 북쪽으로 돌아간다", () => {
  const { map, calls } = mount();
  act(() => map.setBearing(123.4));
  const compass = screen.getByRole("button", { name: /방위 123°/ });
  expect(compass.querySelector("svg")?.getAttribute("style")).toContain("rotateZ(-123.4deg)");
  fireEvent.click(compass);
  expect(calls.resetNorth).toHaveLength(1);
  expect(screen.getByRole("button", { name: /방위 0°/ })).toBeTruthy();
});

test("컴패스를 끌면 회전·기울기가 바뀌고 그 뒤의 click 은 북쪽 맞추기로 이어지지 않는다", () => {
  const { map, calls } = mount();
  const compass = screen.getByRole("button", { name: /방위 0°/ });
  const opts = { pointerId: 1, button: 0, buttons: 1 };
  fireEvent.pointerDown(compass, { ...opts, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(compass, { ...opts, clientX: 50, clientY: 120 });
  fireEvent.pointerUp(compass, { ...opts, buttons: 0, clientX: 50, clientY: 120 });
  fireEvent.click(compass);
  // 왼쪽 50px → +40°, 아래 20px → 기울기 −10°
  expect(map.getBearing()).toBeCloseTo(40, 5);
  expect(map.getPitch()).toBeCloseTo(68, 5);
  expect(calls.resetNorth).toHaveLength(0);
  // 다음 순수 click 은 다시 동작한다.
  fireEvent.click(compass);
  expect(calls.resetNorth).toHaveLength(1);
});

test("3px 안의 흔들림은 끌기가 아니라 탭이다", () => {
  const { map, calls } = mount();
  const compass = screen.getByRole("button", { name: /방위 0°/ });
  const opts = { pointerId: 1, button: 0, buttons: 1 };
  fireEvent.pointerDown(compass, { ...opts, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(compass, { ...opts, clientX: 101, clientY: 101 });
  fireEvent.pointerUp(compass, { ...opts, buttons: 0, clientX: 101, clientY: 101 });
  fireEvent.click(compass);
  expect(map.getBearing()).toBe(0);
  expect(calls.resetNorth).toHaveLength(1);
});

test("기울기는 상한에서 멈춘다", () => {
  const { map } = mount();
  const compass = screen.getByRole("button", { name: /방위/ });
  const opts = { pointerId: 1, button: 0, buttons: 1 };
  fireEvent.pointerDown(compass, { ...opts, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(compass, { ...opts, clientX: 100, clientY: -900 });
  fireEvent.pointerUp(compass, { ...opts, buttons: 0, clientX: 100, clientY: -900 });
  expect(map.getPitch()).toBe(80);
});

test("2D/3D 는 기울기 상태를 읽고 반대로 보낸다", () => {
  const { map, calls } = mount();
  const tilt = screen.getByRole("button", { name: "2D로 펴기" });
  expect(tilt.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(tilt);
  expect(calls.easeTo.at(-1)?.[0]).toMatchObject({ pitch: 0 });
  expect(map.getPitch()).toBe(0);
  const back = screen.getByRole("button", { name: "3D로 기울이기" });
  expect(back.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(back);
  expect(calls.easeTo.at(-1)?.[0]).toMatchObject({ pitch: 78 });
});

test("자동 회전 버튼은 눌린 상태를 보여 주고 토글만 부른다", () => {
  const { props, view } = mount({ orbiting: true });
  const orbit = screen.getByRole("button", { name: "자동 회전" });
  expect(orbit.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(orbit);
  expect(props.onOrbitToggle).toHaveBeenCalledTimes(1);
  expect(props.onInteract).not.toHaveBeenCalled();
  view.rerender(
    <LangProvider initial="ko">
      <MapControls {...props} orbiting={false} />
      <LangButton to="en" />
    </LangProvider>,
  );
  expect(screen.getByRole("button", { name: "자동 회전" }).getAttribute("aria-pressed")).toBe("false");
});

test("확대·축소는 지도에 그대로 넘기고 자동 회전을 멈춘다", () => {
  const { calls, props } = mount();
  fireEvent.click(screen.getByRole("button", { name: "확대" }));
  fireEvent.click(screen.getByRole("button", { name: "축소" }));
  expect(calls.zoomIn).toHaveLength(1);
  expect(calls.zoomOut).toHaveLength(1);
  expect(props.onInteract).toHaveBeenCalledTimes(2);
});

test("현위치는 핀을 놓고 카메라를 옮기며, 언어가 바뀌면 핀 라벨도 바뀐다", () => {
  const remove = vi.fn();
  const placeHere = vi.fn(() => remove);
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: (ok: (p: GeolocationPosition) => void) =>
        ok({ coords: { latitude: 35.1, longitude: 139.07 } } as GeolocationPosition),
    },
  });
  const { calls } = mount({ placeHere });
  fireEvent.click(screen.getByRole("button", { name: "현위치" }));
  expect(placeHere).toHaveBeenCalledWith({ lng: 139.07, lat: 35.1 }, "현위치");
  expect(calls.easeTo.at(-1)?.[0]).toMatchObject({ center: [139.07, 35.1], zoom: 15 });

  fireEvent.click(screen.getByText("lang-en"));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(placeHere).toHaveBeenLastCalledWith({ lng: 139.07, lat: 35.1 }, "You are here");
  expect(screen.getByRole("button", { name: "You are here" })).toBeTruthy();
});

test("위치를 못 가져오면 알림을 띄우고 버튼을 다시 연다", () => {
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: (_ok: unknown, fail: (e: GeolocationPositionError) => void) =>
        fail({ code: 1, message: "denied" } as GeolocationPositionError),
    },
  });
  mount();
  fireEvent.click(screen.getByRole("button", { name: "현위치" }));
  expect(screen.getByRole("alert").textContent).toMatch(/위치 권한/);
  expect((screen.getByRole("button", { name: "현위치" }) as HTMLButtonElement).disabled).toBe(false);
});

test("지도 이벤트 구독은 언마운트에 풀린다", () => {
  const { listeners, view } = mount();
  expect(listeners.get("rotate")?.size).toBe(1);
  view.unmount();
  expect(listeners.get("rotate")?.size).toBe(0);
  expect(listeners.get("pitch")?.size).toBe(0);
});
