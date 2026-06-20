import { describe, expect, test } from "vitest";
import starter from "../../content-packs/starter.core.v1.json";
import { ContentPackSchema } from "./contentPack";

describe("content pack schema", () => {
  const parsed = ContentPackSchema.parse(starter);

  test("starter pack parses", () => {
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

  test("starter pack covers the lesson pdf scope", () => {
    expect(parsed.sourceRefs.map((source) => source.sourceId)).toContain("experience-time-pdf");
    expect(parsed.sourceRefs.map((source) => source.sourceId)).toContain("lessons-pdf-particles-vocab");
    expect(parsed.particles.length).toBeGreaterThanOrEqual(40);
    expect(parsed.vocab.length).toBeGreaterThanOrEqual(250);
    expect(parsed.exercises.length).toBeGreaterThanOrEqual(250);
    expect(parsed.pack.includes).toEqual(expect.arrayContaining(["numbers", "time", "routine", "particles", "vocab"]));
  });

  test("dedupe keys are unique across starter content", () => {
    const allItems = [...parsed.vocab, ...parsed.particles, ...parsed.grammar, ...parsed.exercises];
    const keys = allItems.map((item) => item.dedupeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("starter mcq choices keep same-granularity distractors", () => {
    const sentenceLike = (text: string) =>
      /[.!?]$/.test(text.trim()) ||
      /[가-힣].*(요|다|까|죠|네|어|아)[.!?]?$/u.test(text.trim()) ||
      /\s/u.test(text.trim());

    for (const exercise of parsed.exercises) {
      if (exercise.type !== "mcq") continue;
      const choices = exercise.choices.map((choice) => choice.text);

      if (exercise.choiceKind === "particle") {
        expect(choices.every((choice) => !/\s/u.test(choice) && choice.length <= 8), exercise.id).toBe(true);
      }

      if (exercise.choiceKind === "full-sentence-meaning") {
        expect(choices.every(sentenceLike), exercise.id).toBe(true);
      }

      if (/sentence/i.test(exercise.prompt.stem)) {
        const sentenceChoiceCount = choices.filter(sentenceLike).length;
        expect([0, choices.length], exercise.id).toContain(sentenceChoiceCount);
      }
    }
  });

  test("audio text fields are Korean-only", () => {
    const hasHangul = /[가-힣]/u;
    const hasEnglish = /[A-Za-z]/u;
    const audioTexts = [
      ...parsed.exercises.map((exercise) => exercise.prompt.audioText),
      ...[...parsed.vocab, ...parsed.particles, ...parsed.grammar].flatMap((entry) =>
        entry.examples.map((example) => example.audioText),
      ),
    ].filter((text): text is string => Boolean(text));

    expect(audioTexts.length).toBeGreaterThan(50);
    for (const audioText of audioTexts) {
      expect(hasHangul.test(audioText), audioText).toBe(true);
      expect(hasEnglish.test(audioText), audioText).toBe(false);
    }
  });
});
