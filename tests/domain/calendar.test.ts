import { expect, test } from "vitest";
import { festivalIcs, icsDataUrl, jstToUtcStamp } from "../../src/ui/calendar.ts";

test("도쿄 시각은 9시간 빼서 UTC 스탬프가 된다", () => {
  expect(jstToUtcStamp("2026-09-13", "20:20")).toBe("20260913T112000Z");
  // 자정 근처는 날짜가 하루 앞으로 넘어간다.
  expect(jstToUtcStamp("2026-09-13", "08:00")).toBe("20260912T230000Z");
});

const BASE = {
  id: "atami-kaijo-2026-09-13",
  date: "2026-09-13",
  startTime: "20:20",
  endTime: "20:40",
  officialUrl: "https://www.ataminews.gr.jp/event/8/",
  venueJa: "熱海湾",
  title: "아타미 해상 불꽃놀이",
  description: "비 와도 진행; 유료석, 좌표는 추정",
  location: "熱海湾, 熱海市",
  launch: { lng: 139.077, lat: 35.096 },
};

test("VEVENT 에 시작·끝·제목·좌표가 들어가고 특수문자는 이스케이프된다", () => {
  const ics = festivalIcs(BASE, new Date("2026-09-04T00:00:00Z"));
  // 긴 줄은 접혀 있으므로 풀어서 본다.
  const unfolded = ics.replace(/\r\n /g, "");
  expect(ics).toContain("BEGIN:VCALENDAR\r\n");
  expect(unfolded).toContain("DTSTART:20260913T112000Z");
  expect(unfolded).toContain("DTEND:20260913T114000Z");
  expect(unfolded).toContain("DTSTAMP:20260904T000000Z");
  expect(unfolded).toContain("SUMMARY:아타미 해상 불꽃놀이");
  expect(unfolded).toContain(
    "DESCRIPTION:비 와도 진행\\; 유료석\\, 좌표는 추정\\nhttps://www.ataminews.gr.jp/event/8/",
  );
  expect(unfolded).toContain("GEO:35.096;139.077");
  expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
});

test("끝 시각이 시작보다 이르면 다음 날로 넘긴다", () => {
  const ics = festivalIcs({ ...BASE, startTime: "23:30", endTime: "00:20" });
  expect(ics).toContain("DTSTART:20260913T143000Z");
  expect(ics).toContain("DTEND:20260913T152000Z");
});

test("긴 줄은 75옥텟 안에서 접히고 이어지는 줄은 공백으로 시작한다", () => {
  const ics = festivalIcs({ ...BASE, description: "가".repeat(200) });
  const lines = ics.split("\r\n");
  const encoder = new TextEncoder();
  for (const line of lines) {
    expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
  }
  const description = lines.findIndex((line) => line.startsWith("DESCRIPTION:"));
  expect(lines[description + 1].startsWith(" ")).toBe(true);
  // 접힌 줄을 풀면 원문이 그대로 나온다.
  const unfolded = ics.replace(/\r\n /g, "");
  expect(unfolded).toContain(`DESCRIPTION:${"가".repeat(200)}`);
});

test("data URL 은 text/calendar 다", () => {
  expect(icsDataUrl("BEGIN:VCALENDAR")).toBe("data:text/calendar;charset=utf-8,BEGIN%3AVCALENDAR");
});
