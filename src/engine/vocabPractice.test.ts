import { describe, expect, it } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import type { VocabEntry } from "../schemas/contentPack";
import {
  buildRuntimeVocabExercise,
  isGrammarMeaningPrompt,
  isVocabPracticeExercise,
  isWordTranslationPrompt,
} from "./vocabPractice";

function mcqExercise(partial: Partial<ExerciseRecord> & Pick<ExerciseRecord, "id" | "prompt">): ExerciseRecord {
  return {
    dedupeKey: `exercise:test:${partial.id}`,
    type: "mcq",
    choiceKind: "phrase-meaning",
    tags: ["mcq"],
    sourceRefIds: [],
    inferred: false,
    packId: "starter",
    searchText: "",
    choices: [],
    ...partial,
  } as ExerciseRecord;
}

describe("isVocabPracticeExercise", () => {
  it("accepts exercise:vocab dedupe keys", () => {
    const exercise = mcqExercise({
      id: "v1",
      dedupeKey: "exercise:vocab:학교",
      prompt: { stem: 'Choose the Korean for "school".' },
      choices: [],
      tags: ["vocab"],
    });
    expect(isVocabPracticeExercise(exercise)).toBe(true);
  });

  it("rejects grammar phrase-meaning prompts", () => {
    const exercise = mcqExercise({
      id: "g1",
      prompt: { stem: "What does 공부할 수밖에 없어요 mean?" },
      choices: [],
      tags: ["grammar", "necessity"],
    });
    expect(isVocabPracticeExercise(exercise)).toBe(false);
  });

  it("rejects progressive card grammar items", () => {
    const exercise = mcqExercise({
      id: "p1",
      prompt: { stem: "What does 공부하고 있어요 mean?" },
      choices: [],
      tags: ["progressive", "card"],
    });
    expect(isVocabPracticeExercise(exercise)).toBe(false);
  });

  it("accepts word translation phrase-meaning prompts", () => {
    const exercise = mcqExercise({
      id: "w1",
      prompt: { stem: 'Choose the Korean for "teacher".' },
      choices: [],
      tags: ["vocab"],
    });
    expect(isVocabPracticeExercise(exercise)).toBe(true);
  });
});

describe("prompt helpers", () => {
  it("detects grammar meaning prompts", () => {
    expect(isGrammarMeaningPrompt("What does 공부하고 있어요 mean?")).toBe(true);
    expect(isWordTranslationPrompt('Choose the Korean for "school".')).toBe(true);
  });
});

describe("buildRuntimeVocabExercise", () => {
  const pool: Array<VocabEntry & { packId: string; searchText: string }> = [
    {
      id: "vocab-친구",
      dedupeKey: "vocab:친구",
      kind: "vocab",
      ko: "친구",
      en: "friend",
      pos: "noun",
      tags: ["people"],
      sourceRefIds: [],
      inferred: false,
      packId: "starter",
      searchText: "",
      examples: [],
    },
    {
      id: "vocab-선생님",
      dedupeKey: "vocab:선생님",
      kind: "vocab" as const,
      ko: "선생님",
      en: "teacher",
      pos: "noun",
      tags: ["people"],
      sourceRefIds: [],
      inferred: false,
      packId: "starter",
      searchText: "",
      examples: [],
    },
    {
      id: "vocab-학교",
      dedupeKey: "vocab:학교",
      kind: "vocab" as const,
      ko: "학교",
      en: "school",
      pos: "noun",
      tags: ["places"],
      sourceRefIds: [],
      inferred: false,
      packId: "starter",
      searchText: "",
      examples: [],
    },
    {
      id: "vocab-책",
      dedupeKey: "vocab:책",
      kind: "vocab" as const,
      ko: "책",
      en: "book",
      pos: "noun",
      tags: ["objects"],
      sourceRefIds: [],
      inferred: false,
      packId: "starter",
      searchText: "",
      examples: [],
    },
  ];

  it("builds a four-choice Korean recognition card", () => {
    const exercise = buildRuntimeVocabExercise(pool[0], pool, "ko-from-en");
    expect(exercise.type).toBe("mcq");
    if (exercise.type !== "mcq") return;
    expect(exercise.choiceKind).toBe("vocab");
    expect(exercise.choices).toHaveLength(4);
    expect(exercise.choices.some((choice) => choice.isCorrect)).toBe(true);
    expect(exercise.prompt.stem).toContain("friend");
  });
});
