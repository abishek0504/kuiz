import { describe, expect, test } from "vitest";
import { isActiveMainTab, isActiveQuizMode } from "./tabs";

describe("tab highlighting", () => {
  test("main tab active state derives from current tab", () => {
    expect(isActiveMainTab("quiz", "quiz")).toBe(true);
    expect(isActiveMainTab("quiz", "library")).toBe(false);
  });

  test("quiz chip active state derives from selected mode", () => {
    expect(isActiveQuizMode("balanced", "balanced")).toBe(true);
    expect(isActiveQuizMode("fillBlank", "fillBlank")).toBe(true);
    expect(isActiveQuizMode("fillBlank", "mcq")).toBe(false);
  });
});
