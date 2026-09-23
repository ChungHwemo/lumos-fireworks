/**
 * 선 아이콘. 24×24 격자에 직접 그린 자체 제작 픽토그램이라 라이선스 표기가 필요 없다.
 * 지도 핀의 Material Symbols 와는 별개다. 장식용이므로 항상 aria-hidden 이다.
 */
export type IconName =
  | "calendar"
  | "clock"
  | "pin"
  | "train"
  | "umbrella"
  | "share"
  | "external"
  | "navigate"
  | "eye"
  | "people"
  | "restroom"
  | "food"
  | "bus"
  | "gate"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "cube"
  | "yen"
  | "spark"
  | "filter"
  | "layers"
  | "ticket"
  | "check"
  | "close"
  | "plus"
  | "minus"
  | "rotate-ccw"
  | "rotate-cw"
  | "play"
  | "pause"
  | "locate"
  | "sun"
  | "moon";

const PATHS: Record<IconName, string> = {
  calendar: "M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
  pin: "M12 21s-6-5.4-6-11a6 6 0 1 1 12 0c0 5.6-6 11-6 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  train: "M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM4 11h16M8.5 14.5h.01M15.5 14.5h.01M8 18l-2 3M16 18l2 3",
  umbrella: "M3 13a9 9 0 0 1 18 0H3ZM12 4v-1M12 13v6a2 2 0 0 0 4 0",
  share: "M17 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9.7 10.7l4.6-2.7M9.7 13.3l4.6 2.7",
  external: "M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5",
  navigate: "M4 11.5 20 4l-7.5 16-2-7-6.5-1.5Z",
  eye: "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  people: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 20a6.5 6.5 0 0 1 13 0M15 14.5a5 5 0 0 1 6.5 5",
  restroom: "M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM12 5v14M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM6.5 17v-4a1.5 1.5 0 0 1 3 0v4M16 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM14.5 17l.7-4h1.6l.7 4",
  food: "M6 3v7a2 2 0 0 0 4 0V3M8 3v18M15 3c-1.7 0-3 2.7-3 6 0 2 1 3 2 3v9M17 3v18",
  bus: "M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM3 10h18M7.5 14.5h.01M16.5 14.5h.01M7 18v2M17 18v2",
  gate: "M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15M4 21h16M9 21v-8h6v8M12 9h.01",
  "chevron-left": "M15 5l-7 7 7 7",
  "chevron-right": "M9 5l7 7-7 7",
  "chevron-down": "M5 9l7 7 7-7",
  cube: "M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5ZM3.5 7 12 11.5 20.5 7M12 11.5v10",
  yen: "M6 3l6 8 6-8M12 11v10M7 14h10M7 18h10",
  spark: "M12 2.5c.6 4.6 3.4 8.4 9.5 9.5-6.1 1.1-8.9 4.9-9.5 9.5-.6-4.6-3.4-8.4-9.5-9.5 6.1-1.1 8.9-4.9 9.5-9.5Z",
  filter: "M4 6h16M7 12h10M10 18h4",
  layers: "M12 3.5 21 8l-9 4.5L3 8l9-4.5ZM3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5",
  ticket: "M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7ZM10 7v10",
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  // 위에서 출발해 3/4 바퀴 도는 호. 화살촉은 도착점에서 진행 방향(위)을 가리킨다.
  "rotate-ccw": "M12 4a8 8 0 1 0 8 8M23 15l-3-3-3 3",
  "rotate-cw": "M12 4a8 8 0 1 1-8 8M1 15l3-3 3 3",
  play: "M8 5v14l11-7Z",
  pause: "M8 5v14M16 5v14",
  locate: "M12 2v3M12 19v3M2 12h3M19 12h3M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  sun: "M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  moon: "M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z",
};

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
