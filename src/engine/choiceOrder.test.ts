import { describe, expect, test } from "vitest";
import { orderChoices } from "./choiceOrder";

describe("choice ordering", () => {
  const choices = [
    { id: "a", text: "correct", isCorrect: true },
    { id: "b", text: "near miss", isCorrect: false },
    { id: "c", text: "same kind", isCorrect: false },
    { id: "d", text: "same granularity", isCorrect: false },
  ];

  test("is deterministic for a given exercise", () => {
    expect(orderChoices(choices, "exercise-one")).toEqual(orderChoices(choices, "exercise-one"));
  });

  test("does not keep the correct answer first when alternatives exist", () => {
    expect(orderChoices(choices, "legacy-mcq-num-native-16")[0]?.isCorrect).toBe(false);
  });

  test("keeps every choice exactly once", () => {
    const orderedIds = orderChoices(choices, "exercise-two").map((choice) => choice.id);
    expect(orderedIds.sort()).toEqual(["a", "b", "c", "d"]);
  });
});
