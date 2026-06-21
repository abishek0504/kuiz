import { describe, expect, test } from "vitest";
import { parsePack } from "./parsePack";

const basePack = {
  schema: "kuiz-pack@1",
  pack: {
    packId: "test.lesson.apple.v1",
    version: "1.0.0",
    title: "Apple Vocab",
    locale: "en-CA",
    createdAt: "2026-06-21",
    appMinVersion: "1.0.0",
    includes: ["vocab"],
  },
  sourceRefs: [{ sourceId: "test", label: "Test", inferred: false }],
  vocab: [
    {
      id: "vocab.apple",
      dedupeKey: "vocab:test:apple",
      kind: "vocab",
      ko: "사과",
      en: "apple",
      pos: "noun",
      tags: ["vocab", "food"],
      sourceRefIds: ["test"],
      examples: [{ ko: "사과를 먹어요.", en: "I eat an apple.", audioText: "사과를 먹어요." }],
    },
  ],
  particles: [],
  grammar: [],
  distractorGroups: [],
  exercises: [
    {
      id: "mcq.apple",
      dedupeKey: "exercise:test:apple",
      type: "mcq",
      tags: ["vocab", "food"],
      sourceRefIds: ["test"],
      prompt: { stem: "Choose the Korean for apple.", audioText: "사과" },
      explanation: "사과 means apple.",
      choiceKind: "phrase-meaning",
      choices: [
        { id: "a", text: "학교", isCorrect: false, why: "학교 means school." },
        { id: "b", text: "사과", isCorrect: true, why: "Correct." },
        { id: "c", text: "시간", isCorrect: false, why: "시간 means time." },
        { id: "d", text: "사람", isCorrect: false, why: "사람 means person." },
      ],
    },
  ],
};

describe("parsePack quality validation", () => {
  test("accepts Korean-audio vocab packs with non-revealing MCQ order", () => {
    expect(parsePack(JSON.stringify(basePack)).ok).toBe(true);
  });

  test("rejects romanized audio and correct-first multiple choice", () => {
    const weakPack: typeof basePack = structuredClone(basePack);
    weakPack.exercises[0].prompt.audioText = "sagwa";
    weakPack.exercises[0].choices = [
      { id: "a", text: "사과", isCorrect: true, why: "Correct." },
      { id: "b", text: "1", isCorrect: false, why: "Numeric filler." },
      { id: "c", text: "2", isCorrect: false, why: "Numeric filler." },
      { id: "d", text: "3", isCorrect: false, why: "Numeric filler." },
    ];

    const result = parsePack(JSON.stringify(weakPack));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join("\n")).toMatch(/Korean-only Hangul/);
      expect(result.errors.join("\n")).toMatch(/correct answer first/);
      expect(result.errors.join("\n")).toMatch(/bare numeric filler/);
    }
  });

  test("rejects grammar or particle packs that contain only recognition tasks", () => {
    const weakPack: any = structuredClone(basePack);
    weakPack.pack.includes = ["particles"];
    weakPack.particles = [
      {
        id: "particle.eseo",
        dedupeKey: "particle:test:eseo",
        kind: "particle",
        form: "에서",
        meaning: "at/in where an action happens",
        usage: "Attach to a place where the action takes place.",
        tags: ["particles", "place"],
        sourceRefIds: ["test"],
        examples: [{ ko: "도서관에서 공부해요.", en: "I study at the library.", audioText: "도서관에서 공부해요." }],
      },
    ];

    const result = parsePack(JSON.stringify(weakPack));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join("\n")).toMatch(/production or repair task/);
    }
  });
});
