import type { ExerciseRecord } from "../db/schema";
import { extractParticleSequence } from "./answerCheck";
import type { RuntimeVocabExerciseRecord } from "./vocabPractice";
import type { VariantExerciseRecord } from "./variants";

export type RuntimeExerciseRecord = ExerciseRecord | VariantExerciseRecord | RuntimeVocabExerciseRecord;

function isChoiceExercise(
  exercise: RuntimeExerciseRecord,
): exercise is Extract<RuntimeExerciseRecord, { type: "mcq" | "minimalPair" }> {
  return exercise.type === "mcq" || exercise.type === "minimalPair";
}

export function getModelAnswer(exercise: RuntimeExerciseRecord): string {
  if (isChoiceExercise(exercise)) return exercise.choices.find((choice) => choice.isCorrect)?.text ?? "";
  if (exercise.type === "correction") return exercise.corrected;
  return exercise.modelAnswer;
}

function quotedEnglishFromPrompt(stem: string): string | undefined {
  const match = stem.match(/"([^"]+)"/);
  return match?.[1];
}

export function getTranslation(exercise: RuntimeExerciseRecord): string | undefined {
  if ("variantTranslation" in exercise && exercise.variantTranslation) return exercise.variantTranslation;
  if (exercise.prompt.stemEn) return exercise.prompt.stemEn;
  if (exercise.type === "sentenceBuilder") return exercise.targetMeaning;
  if (exercise.type === "reading") return exercise.passage.en;
  if (exercise.type === "dialogue") {
    const translatedTurns = exercise.turns
      .map((turn) => turn.en)
      .filter((line): line is string => Boolean(line));
    return translatedTurns.length > 0 ? translatedTurns.join(" / ") : undefined;
  }
  if (isChoiceExercise(exercise)) {
    const correct = exercise.choices.find((choice) => choice.isCorrect)?.text;
    if (exercise.choiceKind === "vocab" || exercise.choiceKind === "phrase-meaning") {
      const quoted = quotedEnglishFromPrompt(exercise.prompt.stem);
      if (quoted && /choose the korean/i.test(exercise.prompt.stem)) return quoted;
      if (isGrammarMeaningStem(exercise.prompt.stem) && correct) return correct;
      if (quoted) return quoted;
      if (correct && !/[가-힣]/u.test(correct)) return correct;
    }
    if (exercise.choiceKind === "full-sentence-meaning") return getModelAnswer(exercise);
  }
  return undefined;
}

function isGrammarMeaningStem(stem: string): boolean {
  return /^what does .+ mean\?$/i.test(stem.trim());
}

export function feedbackModelAnswer(exercise: RuntimeExerciseRecord): string {
  const modelAnswer = getModelAnswer(exercise);
  if (exercise.type !== "fillBlank" || exercise.answerPresentation === "sentence") return modelAnswer;
  const particleSequence = extractParticleSequence(modelAnswer);
  if (!particleSequence || particleSequence === modelAnswer) return modelAnswer;
  return particleSequence;
}
