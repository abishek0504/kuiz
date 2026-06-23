import { describe, expect, test } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import { createVariantExercise } from "./variants";

function sentenceBuilderExercise(): ExerciseRecord {
  return {
    id: "library-build",
    packId: "test",
    searchText: "library build",
    dedupeKey: "exercise:test:library-build",
    tags: ["mixed", "particles", "time", "places"],
    sourceRefIds: [],
    inferred: false,
    type: "sentenceBuilder",
    prompt: {
      stem: 'Build: "I read a book at the library at 3 o\'clock."',
      audioText: "저는 도서관에서 세 시에 책을 읽어요.",
    },
    targetMeaning: "I read a book at the library at 3 o'clock.",
    tokens: ["저는", "도서관에서", "세 시에", "책을", "읽어요"],
    acceptedAnswers: { strict: ["저는 도서관에서 세 시에 책을 읽어요."], relaxed: [], regex: [] },
    modelAnswer: "저는 도서관에서 세 시에 책을 읽어요.",
  };
}

function rangeBlankExercise(): ExerciseRecord {
  return {
    id: "range-blank",
    packId: "test",
    searchText: "range blank",
    dedupeKey: "exercise:test:range-blank",
    tags: ["particles", "time", "routine"],
    sourceRefIds: [],
    inferred: false,
    type: "fillBlank",
    prompt: {
      stem: "아침___ 저녁___ 일해요.",
      audioText: "아침부터 저녁까지 일해요.",
    },
    answerPresentation: "phrase",
    acceptedAnswers: { strict: ["부터 저녁까지"], relaxed: [], regex: [] },
    modelAnswer: "부터 저녁까지",
  };
}

function directionCorrectionExercise(): ExerciseRecord {
  return {
    id: "direction-fix",
    packId: "test",
    searchText: "direction fix",
    dedupeKey: "exercise:test:direction-fix",
    tags: ["direction", "places", "mixed"],
    sourceRefIds: [],
    inferred: false,
    type: "correction",
    prompt: {
      stem: "길찾기: fix the Korean sentence.",
      audioText: "지하철역까지 오른쪽으로 가세요.",
    },
    incorrect: "오른쪽에 가세요.",
    corrected: "지하철역까지 오른쪽으로 가세요.",
    acceptedAnswers: { strict: ["지하철역까지 오른쪽으로 가세요."], relaxed: [], regex: [] },
  };
}

describe("sentence variants", () => {
  test("generates a meaningfully different sentence-builder variant", () => {
    const variant = createVariantExercise(sentenceBuilderExercise());

    expect(variant).toBeDefined();
    expect(variant?.id).toMatch(/^variant:library-build:/);
    expect(variant?.variantOf).toBe("library-build");
    expect(variant?.type).toBe("sentenceBuilder");
    if (variant?.type === "sentenceBuilder") {
      expect(variant.modelAnswer).not.toBe("저는 도서관에서 세 시에 책을 읽어요.");
      expect(variant.modelAnswer).toMatch(/에서/);
      expect(variant.modelAnswer).toMatch(/에/);
      expect(variant.modelAnswer).toMatch(/요$/);
    }
    expect(variant?.prompt.stemEn).toBeTruthy();
  });

  test("turns time-range fill blanks into blank-only particle answers", () => {
    const variant = createVariantExercise(rangeBlankExercise());

    expect(variant).toBeDefined();
    expect(variant?.type).toBe("fillBlank");
    if (variant?.type === "fillBlank") {
      expect(variant.modelAnswer).toBe("부터 까지");
      expect(variant.acceptedAnswers.strict).toContain("부터 까지");
      expect(variant.acceptedAnswers.strict).toContain(variant.prompt.audioText);
    }
  });

  test("generates direction corrections with 으로 rather than 에", () => {
    const variant = createVariantExercise(directionCorrectionExercise());

    expect(variant).toBeDefined();
    expect(variant?.type).toBe("correction");
    if (variant?.type === "correction") {
      expect(variant.corrected).toMatch(/(으로|똑바로)/);
      expect(variant.incorrect).toBeTruthy();
      expect(variant.corrected).not.toBe("지하철역까지 오른쪽으로 가세요.");
    }
  });

  test("skips blocked variant ids", () => {
    const first = createVariantExercise(sentenceBuilderExercise());
    expect(first).toBeDefined();
    const second = createVariantExercise(sentenceBuilderExercise(), [first!.id]);
    expect(second?.id).not.toBe(first?.id);
  });

  test("returns undefined for mcq exercises", () => {
    const mcq = {
      ...sentenceBuilderExercise(),
      type: "mcq" as const,
      choiceKind: "particle" as const,
      choices: [],
    };
    expect(createVariantExercise(mcq as ExerciseRecord)).toBeUndefined();
  });
});
