import { describe, expect, test } from "vitest";
import {
  festivalRainNote,
  festivalStation,
  localName,
  spotField,
} from "../../src/ui/display.tsx";

const HANGUL = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;

const orphan = {
  id: "ghost-2026",
  seriesId: "ghost-series",
  nameKo: "유령 불꽃",
  nameJa: "幽霊花火",
  venueKo: "유령 강변",
  venueJa: "幽霊河畔",
  nearestStationKo: "유령역",
  rainNoteKo: "비 와도 진행.",
};

describe("고른 언어 밖으로 한글 시드를 꺼내지 않는다", () => {
  test("이름은 고른 언어 하나만", () => {
    expect(localName({ ko: "사카타", ja: "酒田", en: "Sakata" }, "ja")).toBe("酒田");
    expect(localName({ ko: "사카타", ja: "酒田" }, "en")).toBe("酒田");
    expect(localName({ ko: "사카타", ja: "酒田" }, "ko")).toBe("사카타");
  });

  test("일본어 역·우천 사본이 없으면 한글 시드를 쓰지 않는다", () => {
    expect(festivalStation(orphan, "ja")).toBe("");
    expect(festivalStation(orphan, "en")).toBe("");
    expect(festivalStation(orphan, "ko")).toBe("유령역");
    expect(festivalRainNote(orphan, "ja")).toBe("");
    expect(festivalRainNote(orphan, "en")).toBe("");
    expect(festivalRainNote(orphan, "ko")).toBe("비 와도 진행.");
    expect(festivalStation(orphan, "ja")).not.toMatch(HANGUL);
    expect(festivalRainNote(orphan, "ja")).not.toMatch(HANGUL);
  });

  test("명당 본문 사본이 없으면 일본어·영어는 빈 칸이다", () => {
    const spot = { id: "ghost-spot" };
    expect(spotField(spot, "description", "한글 설명", "ja")).toBe("");
    expect(spotField(spot, "description", "한글 설명", "en")).toBe("");
    expect(spotField(spot, "description", "한글 설명", "ko")).toBe("한글 설명");
  });
});
