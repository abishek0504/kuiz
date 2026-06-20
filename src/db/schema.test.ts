import { describe, expect, test } from "vitest";
import { defaultSettings } from "./schema";

describe("default user settings", () => {
  test("full particle coverage is enabled by default", () => {
    expect(defaultSettings.particleCoverage).toBe("all");
    expect(defaultSettings.particleStrictness).toBe("strict");
  });
});
