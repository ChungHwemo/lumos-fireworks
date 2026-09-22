import type { FestivalRecord } from "../domain/types.ts";

const JST_OFFSET_MIN = 9 * 60;

/** `YYYY-MM-DD` + `HH:MM`(Asia/Tokyo) → iCalendar UTC 스탬프 `YYYYMMDDTHHMMSSZ`. */
export function jstToUtcStamp(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute) - JST_OFFSET_MIN * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${utc.getUTCFullYear()}${pad(utc.getUTCMonth() + 1)}${pad(utc.getUTCDate())}` +
    `T${pad(utc.getUTCHours())}${pad(utc.getUTCMinutes())}00Z`
  );
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

const LINE_OCTETS = 75;
const encoder = new TextEncoder();

/** 75옥텟 줄 접기. RFC 5545 3.1. 한글은 3바이트라 글자 수가 아니라 바이트로 센다. */
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let octets = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    // 이어지는 줄은 앞에 공백 한 칸이 붙으므로 한 바이트 적게 담는다.
    const limit = out.length === 0 ? LINE_OCTETS : LINE_OCTETS - 1;
    if (octets + size > limit) {
      out.push(current);
      current = ch;
      octets = size;
    } else {
      current += ch;
      octets += size;
    }
  }
  out.push(current);
  return out.map((part, i) => (i === 0 ? part : ` ${part}`)).join("\r\n");
}

export type CalendarInput = Pick<
  FestivalRecord,
  "id" | "date" | "startTime" | "endTime" | "officialUrl" | "venueJa"
> & {
  title: string;
  description: string;
  location: string;
  launch?: { lng: number; lat: number } | null;
};

/**
 * 행사 하나를 VEVENT 로. 종료가 시작보다 이르면 자정을 넘긴 것으로 본다.
 * 시즌 행사(dateEnd)는 첫날 하나만 만든다. 날마다 시각이 같다는 보장이 없다.
 */
export function festivalIcs(input: CalendarInput, stampedAt = new Date()): string {
  const start = jstToUtcStamp(input.date, input.startTime);
  let end = jstToUtcStamp(input.date, input.endTime);
  if (end <= start) {
    const next = new Date(Date.UTC(...splitDate(input.date)) + 86_400_000);
    end = jstToUtcStamp(next.toISOString().slice(0, 10), input.endTime);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${stampedAt.getUTCFullYear()}${pad(stampedAt.getUTCMonth() + 1)}${pad(stampedAt.getUTCDate())}` +
    `T${pad(stampedAt.getUTCHours())}${pad(stampedAt.getUTCMinutes())}${pad(stampedAt.getUTCSeconds())}Z`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//hanabi//ko",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${input.id}@hanabi`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(input.title)}`,
    `LOCATION:${escapeText(input.location)}`,
    `DESCRIPTION:${escapeText(`${input.description}\n${input.officialUrl}`)}`,
    `URL:${input.officialUrl}`,
    ...(input.launch ? [`GEO:${input.launch.lat};${input.launch.lng}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

export function icsDataUrl(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function splitDate(date: string): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y, m - 1, d];
}
