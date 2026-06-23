import { describe, expect, it } from "vitest";
import { normalizeKorean } from "./normalize";
import {
  composeSentence,
  generateDirectionVariants,
  generatePlaceTimeObjectVariants,
  generateRoutineConnectorVariants,
  generateTimeRangeVariants,
  predicateIsFinal,
} from "./variantSlots";

describe("variantSlots", () => {
  it("generates at least 20 unique place-time-object variants", () => {
    const variants = generatePlaceTimeObjectVariants(20);
    const unique = new Set(variants.map((variant) => normalizeKorean(variant.korean)));
    expect(unique.size).toBeGreaterThanOrEqual(20);
    for (const variant of variants) {
      expect(predicateIsFinal(variant.korean)).toBe(true);
      expect(variant.korean).toMatch(/에서/);
      expect(variant.korean).toMatch(/에/);
    }
  });

  it("generates time-range variants with blank answers", () => {
    const variants = generateTimeRangeVariants(12);
    expect(variants.length).toBeGreaterThanOrEqual(12);
    for (const variant of variants) {
      expect(variant.blankAnswer).toBe("부터 까지");
      expect(variant.korean).toMatch(/부터.*까지/);
    }
  });

  it("generates direction variants with 으로 or 똑바로", () => {
    const variants = generateDirectionVariants(8);
    expect(variants.length).toBeGreaterThanOrEqual(8);
    for (const variant of variants) {
      expect(variant.korean).toMatch(/(으로|똑바로)/);
      expect(variant.korean).toMatch(/가세요/);
    }
  });

  it("generates routine connector variants only when 마다 is present", () => {
    const variants = generateRoutineConnectorVariants(6);
    expect(variants.length).toBeGreaterThanOrEqual(6);
    for (const variant of variants) {
      expect(variant.korean).toMatch(/마다/);
      expect(variant.chunks[0]).toMatch(/마다/);
    }
  });

  it("keeps predicate sentence-final when composing slots", () => {
    const korean = composeSentence([
      { role: "subject", korean: "저는", english: "I" },
      { role: "time", korean: "세 시에", english: "3 o'clock" },
      { role: "place", korean: "도서관에서", english: "the library" },
      { role: "object", korean: "책을", english: "a book" },
      { role: "predicate", korean: "읽어요", english: "read" },
    ]);
    expect(korean.endsWith("읽어요")).toBe(true);
    expect(predicateIsFinal(korean)).toBe(true);
  });
});
