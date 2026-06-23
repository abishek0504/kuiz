import type { EntryRecord, ExerciseRecord } from "../db/schema";
import type { VocabEntry } from "../schemas/contentPack";
import { simpleHash } from "./normalize";

type VocabEntryRecord = EntryRecord & VocabEntry;

const excludedVocabTags = new Set(["mixed", "scenario", "grammar", "particles", "progressive", "connectors", "necessity"]);

const grammarShapeTags = new Set([
  "grammar",
  "particles",
  "progressive",
  "connectors",
  "necessity",
  "conjugation",
  "mixed",
  "scenario",
]);

const wordTranslationPromptPattern = /choose the (?:korean|english) for/i;
const grammarMeaningPromptPattern = /^what does .+ mean\?$/i;

export type RuntimeVocabExerciseRecord = ExerciseRecord & {
  runtimeVocabOf: string;
  variantTranslation?: string;
};

export function hasExcludedVocabTag(exercise: Pick<ExerciseRecord, "tags">): boolean {
  return exercise.tags.some((tag) => excludedVocabTags.has(tag));
}

export function hasGrammarShapeTag(exercise: Pick<ExerciseRecord, "tags">): boolean {
  return exercise.tags.some((tag) => grammarShapeTags.has(tag));
}

export function isGrammarMeaningPrompt(stem: string): boolean {
  return grammarMeaningPromptPattern.test(stem.trim());
}

export function isWordTranslationPrompt(stem: string): boolean {
  return wordTranslationPromptPattern.test(stem.trim());
}

export function isVocabPracticeExercise(exercise: ExerciseRecord): boolean {
  if (exercise.dedupeKey.startsWith("exercise:vocab:")) return true;
  if (exercise.type !== "mcq") {
    return exercise.tags.includes("vocab") && !hasExcludedVocabTag(exercise);
  }
  if (exercise.choiceKind === "vocab") return true;
  if (exercise.choiceKind === "phrase-meaning") {
    if (hasGrammarShapeTag(exercise)) return false;
    if (isGrammarMeaningPrompt(exercise.prompt.stem)) return false;
    if (isWordTranslationPrompt(exercise.prompt.stem)) return true;
    return exercise.tags.includes("vocab") && !hasExcludedVocabTag(exercise);
  }
  return false;
}

export function countVocabPracticeExercises(exercises: ExerciseRecord[]): number {
  return exercises.filter(isVocabPracticeExercise).length;
}

function vocabEntries(entries: EntryRecord[]): VocabEntryRecord[] {
  return entries.filter((entry): entry is VocabEntryRecord => entry.kind === "vocab");
}

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let hash = simpleHash(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    hash = simpleHash(`${hash}:${index}`);
    const swapIndex = Number.parseInt(hash.slice(0, 8), 16) % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function pickDistractors(target: VocabEntryRecord, pool: VocabEntryRecord[], count: number): string[] {
  const sameTag = pool.filter(
    (entry) =>
      entry.id !== target.id &&
      entry.ko !== target.ko &&
      entry.tags.some((tag) => target.tags.includes(tag)),
  );
  const fallback = pool.filter((entry) => entry.id !== target.id && entry.ko !== target.ko);
  const candidates = shuffleWithSeed(sameTag.length >= count ? sameTag : fallback, target.id);
  return candidates.slice(0, count).map((entry) => entry.ko);
}

export function buildRuntimeVocabExercise(
  entry: VocabEntryRecord,
  pool: VocabEntryRecord[],
  direction: "ko-from-en" | "en-from-ko",
): RuntimeVocabExerciseRecord {
  const distractorKo = pickDistractors(entry, pool, 3);
  const correctKo = entry.ko;
  const choicesKo = shuffleWithSeed([correctKo, ...distractorKo], `${entry.id}:${direction}`).map((text, index) => ({
    id: String.fromCharCode(97 + index),
    text,
    isCorrect: text === correctKo,
    why: text === correctKo ? "Correct." : `${text} is not the target word.`,
  }));

  const stem =
    direction === "ko-from-en"
      ? `Choose the Korean for "${entry.en}".`
      : `What does "${entry.ko}" mean?`;
  const choiceTexts =
    direction === "ko-from-en"
      ? choicesKo
      : shuffleWithSeed(
          [
            { text: entry.en, isCorrect: true },
            ...pickDistractors(entry, pool, 3).map((ko) => {
              const match = pool.find((candidate) => candidate.ko === ko);
              return { text: match?.en ?? ko, isCorrect: false };
            }),
          ],
          `${entry.id}:${direction}:en`,
        ).map((choice, index) => ({
          id: String.fromCharCode(97 + index),
          text: choice.text,
          isCorrect: choice.isCorrect,
          why: choice.isCorrect ? "Correct." : "This is a different word.",
        }));

  const id = `runtime-vocab:${entry.id}:${simpleHash({ entryId: entry.id, direction })}`;

  return {
    id,
    dedupeKey: `exercise:vocab:${entry.ko}`,
    type: "mcq",
    choiceKind: "vocab",
    tags: ["mcq", "vocab", "card", ...entry.tags.slice(0, 2)],
    sourceRefIds: entry.sourceRefIds,
    inferred: true,
    packId: entry.packId,
    searchText: `${entry.ko} ${entry.en}`,
    skill: "reception",
    level: "A1",
    prompt: {
      stem,
      audioText: entry.ko,
      stemEn: entry.en,
    },
    choices: choiceTexts,
    explanation: `${entry.ko} — ${entry.en}`,
    runtimeVocabOf: entry.id,
    variantTranslation: entry.en,
  };
}

export function buildRuntimeVocabExercises(
  entries: EntryRecord[],
  existingExerciseIds: Set<string>,
  limit = 120,
): RuntimeVocabExerciseRecord[] {
  const pool = vocabEntries(entries);
  if (pool.length < 4) return [];

  const generated: RuntimeVocabExerciseRecord[] = [];
  for (const entry of pool) {
    if (generated.length >= limit) break;
    for (const direction of ["ko-from-en", "en-from-ko"] as const) {
      const exercise = buildRuntimeVocabExercise(entry, pool, direction);
      if (existingExerciseIds.has(exercise.dedupeKey)) continue;
      generated.push(exercise);
      if (generated.length >= limit) break;
    }
  }
  return generated;
}

export function shouldAugmentVocabPool(
  questionType: string,
  focusIsVocab: boolean,
  vocabExerciseCount: number,
): boolean {
  return questionType === "vocab" || (focusIsVocab && vocabExerciseCount < 20);
}
