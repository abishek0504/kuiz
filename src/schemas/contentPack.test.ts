import { describe, expect, test } from "vitest";
import starter from "../../content-packs/starter.core.v1.json";
import { ContentPackSchema } from "./contentPack";

describe("content pack schema", () => {
  test("starter pack parses", () => {
    const parsed = ContentPackSchema.parse(starter);
    expect(parsed.pack.packId).toBe("starter.core.v1");
    expect(parsed.exercises.length).toBeGreaterThan(5);
  });

  test("malformed pack fails with useful errors", () => {
    const result = ContentPackSchema.safeParse({ schema: "wrong" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path.join(".")).toBe("schema");
    }
  });
});
