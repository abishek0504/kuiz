import { describe, expect, test } from "vitest";
import { fallbackFingerprint } from "./normalize";
import { dedupeIdentity } from "../importExport/mergePack";

describe("dedupe identity", () => {
  test("dedupeKey takes precedence", () => {
    expect(dedupeIdentity({ dedupeKey: "vocab:친구" })).toBe("vocab:친구");
  });

  test("fallback fingerprint works for legacy entries", () => {
    const first = fallbackFingerprint({ kind: "vocab", ko: "친구", en: "Friend" });
    const second = fallbackFingerprint({ kind: "vocab", ko: "친구.", en: "friend." });
    expect(first).toBe(second);
  });
});
