import { describe, expect, test } from "vitest";
import { isActiveMainTab, isActiveQuizMode } from "./tabs";

describe("tab highlighting", () => {
  test("main tab active state derives from current tab", () => {
    expect(isActiveMainTab("quiz", "quiz")).toBe(true);
    expect(isActiveMainTab("quiz", "library")).toBe(false);
  });

  test("quiz chip active state derives from selected mode", () => {
    expect(isActiveQuizMode("recommended", "recommended")).toBe(true);
    expect(isActiveQuizMode("sentence", "sentence")).toBe(true);
    expect(isActiveQuizMode("sentence", "listening")).toBe(false);
  });
});
