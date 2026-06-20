import { describe, expect, test } from "vitest";
import { makeMcqChoices, optionsAreHomogeneous } from "./distractors";

describe("distractor generation", () => {
  test("particle options stay homogeneous", () => {
    const choices = makeMcqChoices({
      correct: "에서",
      distractorGroup: ["에", "에서", "으로", "까지"],
      choiceKind: "particle",
    });
    expect(choices).toHaveLength(4);
    expect(choices.filter((choice) => choice.isCorrect)).toHaveLength(1);
    expect(optionsAreHomogeneous(choices.map((choice) => choice.text), "particle")).toBe(true);
  });

  test("rejects mixed particle and sentence distractors", () => {
    expect(() =>
      makeMcqChoices({
        correct: "에서",
        distractorGroup: ["에", "I study at the library."],
        choiceKind: "particle",
      }),
    ).toThrow(/homogeneous/);
  });
});
