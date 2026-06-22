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

  test("starter pack includes mixed scenario production and repair", () => {
    const scenarios = parsed.exercises.filter((exercise) => exercise.tags.includes("scenario"));
    expect(scenarios.length).toBeGreaterThanOrEqual(6);
    expect(scenarios.every((exercise) => exercise.tags.includes("mixed"))).toBe(true);
    expect(scenarios.some((exercise) => exercise.type === "sentenceBuilder")).toBe(true);
    expect(scenarios.some((exercise) => exercise.type === "correction")).toBe(true);
    expect(parsed.pack.includes).toEqual(expect.arrayContaining(["mixed", "scenario"]));
  });

  test("starter number mcqs avoid low-number filler distractors", () => {
    for (const exercise of parsed.exercises) {
      if (exercise.type !== "mcq") continue;
      if (!exercise.tags.some((tag) => ["number", "numbers", "sino-numbers", "native-numbers"].includes(tag))) {
        continue;
      }

      const correct = exercise.choices.find((choice) => choice.isCorrect);
      const correctValue = Number(correct?.text.match(/^\d+/u)?.[0]);
      const lowFillers = exercise.choices.filter((choice) => /^(0|1|2|3) \(/u.test(choice.text)).length;
      const systemLabels = new Set(exercise.choices.map((choice) => choice.text.match(/\(([^)]+)\)$/u)?.[1]));

      expect(systemLabels.size, exercise.id).toBe(1);
      if (Number.isFinite(correctValue) && correctValue > 5) {
        expect(lowFillers, exercise.id).toBeLessThan(2);
      }
    }
  });

  test("grammar references use readable Korean examples instead of bracket templates", () => {
    for (const entry of parsed.grammar) {
      expect(`${entry.title} ${entry.pattern}`, entry.id).not.toMatch(/\[[^\]]+\]/u);
    }
  });

  test("starter pack does not expose replacement-marker question marks", () => {
    const flagged: string[] = [];

    function visit(value: unknown, path: string) {
      if (typeof value === "string") {
        const questionCount = value.match(/\?/gu)?.length ?? 0;
        const replacementLikeQuestion = value.includes("??") || (questionCount > 0 && !(questionCount === 1 && value.endsWith("?")));
        if (replacementLikeQuestion) flagged.push(`${path}: ${value}`);
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => visit(item, `${path}.${index}`));
        return;
      }

      if (value && typeof value === "object") {
        Object.entries(value).forEach(([key, item]) => visit(item, `${path}.${key}`));
      }
    }

    visit(parsed, "pack");

    expect(flagged).toEqual([]);
  });

  test("starter mcq choices keep same-granularity distractors", () => {
    const sentenceLike = (text: string) =>
      /[.!?]$/.test(text.trim()) ||
      /[가-힣].*(요|다|까|죠|네|어|아)[.!?]?$/u.test(text.trim()) ||
      /\s/u.test(text.trim());
    const hangulSentencePrompt = (text: string) =>
      /[가-힣]/u.test(text) && /(요|다|까|죠|네)[.!?]?\s*mean\?/u.test(text);

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

      if (hangulSentencePrompt(exercise.prompt.stem)) {
        expect(choices.every(sentenceLike), exercise.id).toBe(true);
      }
    }
  });

  test("starter mcq source order does not reveal the answer", () => {
    const mcqs = parsed.exercises.filter((exercise) => exercise.type === "mcq");

    expect(mcqs.length).toBeGreaterThan(100);
    expect(mcqs.filter((exercise) => exercise.choices[0]?.isCorrect)).toEqual([]);
  });

  test("full-sentence mcqs do not reuse generic fallback distractors", () => {
    const distractorCounts = new Map<string, number>();

    for (const exercise of parsed.exercises) {
      if (exercise.type !== "mcq" || exercise.choiceKind !== "full-sentence-meaning") continue;
      for (const choice of exercise.choices) {
        if (!choice.isCorrect) {
          distractorCounts.set(choice.text, (distractorCounts.get(choice.text) ?? 0) + 1);
        }
      }
    }

    const repeated = [...distractorCounts.entries()].filter(([, count]) => count > 2);
    expect(repeated).toEqual([]);
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
