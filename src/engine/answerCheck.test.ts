import { describe, expect, test } from "vitest";
import { checkAnswer, stripOptionalParticles } from "./answerCheck";

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
});
