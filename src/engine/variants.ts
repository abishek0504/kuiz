import type { ExerciseRecord } from "../db/schema";
import { normalizeKorean, simpleHash } from "./normalize";
import { generatedVariantsForFamily, predicateIsFinal, type GeneratedVariant } from "./variantSlots";

export type VariantExerciseRecord = ExerciseRecord & {
  variantOf: string;
  variantTranslation?: string;
};

type VariantCandidate = GeneratedVariant;

function modelAnswerFor(exercise: ExerciseRecord): string {
  if (exercise.type === "mcq" || exercise.type === "minimalPair") {
    return exercise.choices.find((choice) => choice.isCorrect)?.text ?? "";
  }
  if (exercise.type === "correction") return exercise.corrected;
  return exercise.modelAnswer;
}

function sourceText(exercise: ExerciseRecord): string {
  const dialogue = exercise.type === "dialogue" ? exercise.turns.map((turn) => turn.ko).join(" ") : "";
  const passage = exercise.type === "reading" ? exercise.passage.ko : "";
  return normalizeKorean(
    [
      exercise.prompt.stem,
      exercise.prompt.stemKo,
      exercise.prompt.audioText,
      modelAnswerFor(exercise),
      dialogue,
      passage,
      exercise.tags.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

const sentenceFamilies: Array<{
  id: string;
  matches: (text: string, exercise: ExerciseRecord) => boolean;
}> = [
  {
    id: "time-range",
    matches: (text) => text.includes("부터") && text.includes("까지"),
  },
  {
    id: "place-time-object",
    matches: (text) =>
      text.includes("에서") &&
      (text.includes("시에") || text.includes("아침에") || text.includes("오후에")) &&
      /(읽어요|만나요|마셔요|해요)/u.test(text),
  },
  {
    id: "directions",
    matches: (text) =>
      (text.includes("오른쪽") || text.includes("왼쪽") || text.includes("똑바로")) && text.includes("가세요"),
  },
  {
    id: "routine-connector",
    matches: (text) => text.includes("마다") && (text.includes("고") || text.includes("하고")),
  },
];

function familyCandidates(exercise: ExerciseRecord): VariantCandidate[] {
  const text = sourceText(exercise);
  const family = sentenceFamilies.find((item) => item.matches(text, exercise));
  if (!family) return [];
  const baseAnswer = normalizeKorean(modelAnswerFor(exercise));
  return generatedVariantsForFamily(family.id, 24).filter(
    (variant) => normalizeKorean(variant.korean) !== baseAnswer && predicateIsFinal(variant.korean),
  );
}

function variantId(baseId: string, variant: VariantCandidate): string {
  return `variant:${baseId}:${simpleHash({ baseId, korean: variant.korean })}`;
}

function acceptedFor(variant: VariantCandidate, extra: string[] = []) {
  return {
    strict: [variant.korean, ...extra],
    relaxed: [variant.korean, ...extra],
    regex: [],
  };
}

function commonPatch(base: ExerciseRecord, variant: VariantCandidate): Partial<ExerciseRecord> {
  return {
    id: variantId(base.id, variant),
    dedupeKey: `variant:${base.dedupeKey}:${simpleHash(variant.korean)}`,
    tags: Array.from(new Set([...base.tags, ...variant.tags, "variant"])),
    inferred: true,
    prompt: {
      ...base.prompt,
      audioText: variant.korean,
      stemEn: variant.english,
    },
    explanation: variant.explanation,
    searchText: `${variant.korean} ${variant.english} ${variant.tags.join(" ")}`,
  };
}

function adaptVariant(base: ExerciseRecord, variant: VariantCandidate): VariantExerciseRecord | undefined {
  const patch = commonPatch(base, variant);
  const variantOf = "variantOf" in base && typeof base.variantOf === "string" ? base.variantOf : base.id;

  if (base.type === "fillBlank" && variant.blankStem && variant.blankAnswer) {
    return {
      ...base,
      ...patch,
      variantOf,
      variantTranslation: variant.english,
      prompt: {
        ...base.prompt,
        stem: variant.blankStem,
        audioText: variant.korean,
        stemEn: variant.english,
      },
      acceptedAnswers: {
        strict: [variant.blankAnswer, variant.blankAnswer.replace(/\s+/g, ""), variant.korean],
        relaxed: [variant.blankAnswer, variant.korean],
        regex: [],
      },
      modelAnswer: variant.blankAnswer,
    } as VariantExerciseRecord;
  }

  if (base.type === "sentenceBuilder") {
    return {
      ...base,
      ...patch,
      variantOf,
      variantTranslation: variant.english,
      prompt: {
        ...base.prompt,
        stem: `Build: "${variant.english}"`,
        audioText: variant.korean,
        stemEn: variant.english,
      },
      targetMeaning: variant.english,
      tokens: variant.chunks,
      acceptedAnswers: acceptedFor(variant),
      modelAnswer: variant.korean,
    } as VariantExerciseRecord;
  }

  if (base.type === "ordering") {
    return {
      ...base,
      ...patch,
      variantOf,
      variantTranslation: variant.english,
      prompt: {
        ...base.prompt,
        stem: `Put the Korean chunks in order: "${variant.english}"`,
        audioText: variant.korean,
        stemEn: variant.english,
      },
      chunks: [...variant.chunks].sort((left, right) => left.localeCompare(right, "ko")),
      acceptedAnswers: acceptedFor(variant),
      modelAnswer: variant.korean,
    } as VariantExerciseRecord;
  }

  if (base.type === "correction" && variant.incorrect) {
    return {
      ...base,
      ...patch,
      variantOf,
      variantTranslation: variant.english,
      prompt: {
        ...base.prompt,
        stem: `${base.scenario ?? "문장"}: fix the Korean sentence.`,
        audioText: variant.korean,
        stemEn: variant.english,
      },
      incorrect: variant.incorrect,
      corrected: variant.korean,
      acceptedAnswers: acceptedFor(variant),
    } as VariantExerciseRecord;
  }

  if (base.type === "dictation" || base.type === "listening" || base.type === "roleplay") {
    return {
      ...base,
      ...patch,
      variantOf,
      variantTranslation: variant.english,
      prompt: {
        ...base.prompt,
        stem: base.type === "roleplay" ? `Say this naturally: "${variant.english}"` : base.prompt.stem,
        audioText: variant.korean,
        stemEn: variant.english,
        context: base.type === "roleplay" ? variant.english : base.prompt.context,
      },
      acceptedAnswers: acceptedFor(variant),
      modelAnswer: variant.korean,
    } as VariantExerciseRecord;
  }

  return undefined;
}

export function createVariantExercise(
  exercise: ExerciseRecord,
  blockedIds: Iterable<string> = [],
): VariantExerciseRecord | undefined {
  if (exercise.type === "mcq" || exercise.type === "minimalPair" || exercise.type === "conjugation") return undefined;

  const blocked = new Set(blockedIds);
  const candidates = familyCandidates(exercise);
  const sorted = [...candidates].sort((left, right) =>
    variantId(exercise.id, left).localeCompare(variantId(exercise.id, right)),
  );
  const offset = sorted.length > 0 ? parseInt(simpleHash({ id: exercise.id, answer: modelAnswerFor(exercise) }).slice(0, 6), 16) : 0;

  for (let attempt = 0; attempt < sorted.length; attempt += 1) {
    const variant = sorted[(offset + attempt) % sorted.length];
    const id = variantId(exercise.id, variant);
    if (blocked.has(id)) continue;
    const adapted = adaptVariant(exercise, variant);
    if (adapted) return adapted;
  }

  return undefined;
}
