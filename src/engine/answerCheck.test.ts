import { describe, expect, test } from "vitest";
import {
  checkAnswer,
  extractParticleSequence,
  hasFlexibleKoreanWordOrder,
  normalizeAnswerKorean,
  stripOptionalParticles,
} from "./answerCheck";

describe("particle strictness", () => {
  test("strict mode requires particles when the model includes them", () => {
    const result = checkAnswer({
      model: "저는 도서관에서 책을 읽어요.",
      input: "저는 도서관에서 책 읽어요.",
      strictness: "strict",
    });
    expect(result.correct).toBe(false);
  });

  test("relaxed mode can accept dropped object particle", () => {
    const result = checkAnswer({
      model: "저는 도서관에서 책을 읽어요.",
      input: "저는 도서관에서 책 읽어요.",
      strictness: "relaxed",
    });
    expect(result.correct).toBe(true);
  });

  test("normalizes particle-drop variants predictably", () => {
    expect(stripOptionalParticles("책을 읽어요")).toBe("책 읽어요");
  });

  test("accepts Korean particle spacing variants", () => {
    expect(normalizeAnswerKorean("아침 부터 저녁 까지 일해요.")).toBe("아침부터 저녁까지 일해요");
  });

  test("accepts flexible time and place order when particles and final verb match", () => {
    const result = checkAnswer({
      model: "저는 도서관에서 세 시에 책을 읽어요.",
      input: "저는 세 시에 도서관에서 책을 읽어요.",
      strictness: "strict",
    });

    expect(result.correct).toBe(true);
    expect(result.note).toMatch(/particle-marked words/);
  });

  test("does not accept flexible order when the final verb changes", () => {
    expect(
      hasFlexibleKoreanWordOrder("저는 도서관에서 세 시에 책을 읽어요.", "저는 세 시에 도서관에서 책을 공부해요."),
    ).toBe(false);
  });

  test("can accept a full sentence that contains the expected blank phrase", () => {
    const result = checkAnswer({
      model: "부터 저녁까지",
      input: "아침부터 저녁까지 일해요.",
      strictness: "strict",
      allowModelFragment: true,
    });

    expect(result.correct).toBe(true);
  });

  test("accepts blank-only particle sequence for multi-blank particle items", () => {
    const result = checkAnswer({
      model: "부터 저녁까지",
      input: "부터 까지",
      strictness: "strict",
    });

    expect(extractParticleSequence("부터 저녁까지")).toBe("부터 까지");
    expect(result.correct).toBe(true);
    expect(result.note).toMatch(/particle sequence/);
  });
});
