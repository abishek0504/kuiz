import { describe, expect, test } from "vitest";
import { koreanOnly } from "./speech";

describe("speech helper", () => {
  test("strips English prompt text from mixed audio", () => {
    expect(koreanOnly("Choose: 저는 한국어를 공부하고 있어요.")).toBe("저는 한국어를 공부하고 있어요.");
  });
});
