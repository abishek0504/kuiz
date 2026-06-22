import { describe, expect, test } from "vitest";
import { sentenceBreakdown } from "./sentenceBreakdown";

describe("sentence breakdown", () => {
  test("explains place, time, object, topic, and predicate roles", () => {
    const parts = sentenceBreakdown("저는 도서관에서 세 시에 한국어를 공부해요.");

    expect(parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: "저는", role: "topic" }),
        expect.objectContaining({ text: "도서관에서", role: "action place" }),
        expect.objectContaining({ text: "세 시에", role: "time" }),
        expect.objectContaining({ text: "한국어를", role: "object" }),
        expect.objectContaining({ text: "공부해요", role: "predicate" }),
      ]),
    );
  });

  test("distinguishes source, recipient, and time range particles", () => {
    const parts = sentenceBreakdown("친구한테서 선물을 받고 아침부터 저녁까지 일해요.");

    expect(parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: "친구한테서", role: "source" }),
        expect.objectContaining({ text: "선물을", role: "object" }),
        expect.objectContaining({ text: "받고", role: "connector" }),
        expect.objectContaining({ text: "아침부터", role: "starting point" }),
        expect.objectContaining({ text: "저녁까지", role: "endpoint" }),
      ]),
    );
  });

  test("ignores English-only answers", () => {
    expect(sentenceBreakdown("I study at the library.")).toEqual([]);
  });
});
