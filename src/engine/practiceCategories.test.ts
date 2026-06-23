import { describe, expect, test } from "vitest";
import {
  categoryMatchesSelectedTags,
  labelForTag,
  practiceCategories,
  tagsForPracticeCategory,
} from "./practiceCategories";

describe("practice categories", () => {
  test("exposes learner-facing focus lanes in English", () => {
    expect(practiceCategories.map((category) => category.id)).toEqual([
      "all",
      "vocab",
      "numbers",
      "grammar",
      "particles",
      "connectors",
      "mixed",
    ]);

    expect(practiceCategories.find((category) => category.id === "all")?.label).toBe("All");
    expect(practiceCategories.find((category) => category.id === "vocab")?.label).toBe("Vocab");
    expect(practiceCategories.find((category) => category.id === "numbers")?.label).toBe("Numbers · time");
    expect(practiceCategories.find((category) => category.id === "grammar")?.label).toBe("Grammar");
    expect(practiceCategories.find((category) => category.id === "particles")?.label).toBe("Particles");
    expect(practiceCategories.find((category) => category.id === "mixed")?.label).toBe("Mixed");

    for (const category of practiceCategories) {
      expect(category.label).not.toMatch(/^[a-z0-9-]+$/u);
    }
  });

  test("maps focus lanes to internal tags without displaying those tags", () => {
    expect(tagsForPracticeCategory("all")).toEqual([]);
    expect(tagsForPracticeCategory("numbers")).toEqual(
      expect.arrayContaining(["number", "numbers", "sino-numbers", "native-numbers"]),
    );
    expect(tagsForPracticeCategory("vocab")).toEqual(["vocab", "card"]);
    expect(tagsForPracticeCategory("particles")).toEqual(expect.arrayContaining(["particles", "buteo", "bakke"]));
    expect(tagsForPracticeCategory("mixed")).toEqual(expect.arrayContaining(["sentence-builder", "correction"]));
  });

  test("recognizes existing saved tag filters as their category", () => {
    const numbers = practiceCategories.find((category) => category.id === "numbers");
    const all = practiceCategories.find((category) => category.id === "all");
    const mixed = practiceCategories.find((category) => category.id === "mixed");

    expect(numbers).toBeDefined();
    expect(all).toBeDefined();
    expect(mixed).toBeDefined();
    expect(categoryMatchesSelectedTags(numbers!, ["sino-numbers"])).toBe(true);
    expect(categoryMatchesSelectedTags(numbers!, ["sino-numbers", "vocab"])).toBe(false);
    expect(categoryMatchesSelectedTags(all!, [])).toBe(true);
    expect(categoryMatchesSelectedTags(mixed!, [])).toBe(false);
    expect(categoryMatchesSelectedTags(mixed!, ["sentence-builder", "correction"])).toBe(true);
  });

  test("labels raw content tags in Korean", () => {
    expect(labelForTag("sino-numbers")).toBe("일·이·삼");
    expect(labelForTag("buteo")).toBe("부터");
    expect(labelForTag("progressive")).toBe("고 있어요");
    expect(labelForTag("unexpected-custom-tag")).toBe("학습 항목");
  });
});
