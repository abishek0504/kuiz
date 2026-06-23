import type { ExerciseRecord } from "../db/schema";
import { normalizeKorean, simpleHash } from "./normalize";

export type VariantExerciseRecord = ExerciseRecord & {
  variantOf: string;
  variantTranslation?: string;
};

type VariantCandidate = {
  family: string;
  korean: string;
  english: string;
  chunks: string[];
  blankStem?: string;
  blankAnswer?: string;
  incorrect?: string;
  explanation: string;
  tags: string[];
};

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
  variants: VariantCandidate[];
}> = [
  {
    id: "time-range",
    matches: (text) => text.includes("부터") && text.includes("까지"),
    variants: [
      {
        family: "time-range",
        korean: "월요일부터 금요일까지 공부해요.",
        english: "I study from Monday to Friday.",
        chunks: ["월요일부터", "금요일까지", "공부해요"],
        blankStem: "월요일___ 금요일___ 공부해요.",
        blankAnswer: "부터 까지",
        incorrect: "월요일에서 금요일까지 공부해요.",
        explanation: "부터 marks the starting point, and 까지 marks the endpoint.",
        tags: ["particles", "time", "routine", "mixed"],
      },
      {
        family: "time-range",
        korean: "아홉 시부터 열한 시까지 일해요.",
        english: "I work from 9 o'clock to 11 o'clock.",
        chunks: ["아홉 시부터", "열한 시까지", "일해요"],
        blankStem: "아홉 시___ 열한 시___ 일해요.",
        blankAnswer: "부터 까지",
        incorrect: "아홉 시에서 열한 시까지 일해요.",
        explanation: "Use 부터 for the start of the time range and 까지 for the endpoint.",
        tags: ["particles", "time", "routine", "mixed"],
      },
      {
        family: "time-range",
        korean: "아침부터 밤까지 공부해요.",
        english: "I study from morning until night.",
        chunks: ["아침부터", "밤까지", "공부해요"],
        blankStem: "아침___ 밤___ 공부해요.",
        blankAnswer: "부터 까지",
        incorrect: "아침에서 밤까지 공부해요.",
        explanation: "Time ranges use 부터 and 까지, not 에서 for the starting time.",
        tags: ["particles", "time", "routine", "mixed"],
      },
    ],
  },
  {
    id: "place-time-object",
    matches: (text) => text.includes("에서") && text.includes("시에") && (text.includes("읽어요") || text.includes("만나요")),
    variants: [
      {
        family: "place-time-object",
        korean: "저는 네 시에 카페에서 커피를 마셔요.",
        english: "I drink coffee at the cafe at 4 o'clock.",
        chunks: ["저는", "네 시에", "카페에서", "커피를", "마셔요"],
        incorrect: "저는 네 시에 카페에 커피를 마셔요.",
        explanation: "에서 marks where the action happens. 에 would sound like destination or time.",
        tags: ["particles", "time", "places", "mixed"],
      },
      {
        family: "place-time-object",
        korean: "동생은 두 시에 학교에서 숙제를 해요.",
        english: "My younger sibling does homework at school at 2 o'clock.",
        chunks: ["동생은", "두 시에", "학교에서", "숙제를", "해요"],
        incorrect: "동생은 두 시에 학교에 숙제를 해요.",
        explanation: "Use 에서 for an action location such as doing homework at school.",
        tags: ["particles", "time", "places", "mixed"],
      },
      {
        family: "place-time-object",
        korean: "친구는 세 시에 도서관에서 책을 읽어요.",
        english: "My friend reads a book at the library at 3 o'clock.",
        chunks: ["친구는", "세 시에", "도서관에서", "책을", "읽어요"],
        incorrect: "친구는 세 시에 도서관에 책을 읽어요.",
        explanation: "The action happens at the library, so 도서관에서 is the natural marker.",
        tags: ["particles", "time", "places", "mixed"],
      },
    ],
  },
  {
    id: "directions",
    matches: (text, exercise) =>
      text.includes("오른쪽") || text.includes("왼쪽") || exercise.tags.some((tag) => tag === "direction"),
    variants: [
      {
        family: "directions",
        korean: "버스 정류장까지 왼쪽으로 가세요.",
        english: "Go left to the bus stop.",
        chunks: ["버스 정류장까지", "왼쪽으로", "가세요"],
        incorrect: "왼쪽에 가세요.",
        explanation: "으로 marks direction, while 에 marks destination or location.",
        tags: ["direction", "places", "mixed"],
      },
      {
        family: "directions",
        korean: "학교까지 오른쪽으로 가세요.",
        english: "Go right to the school.",
        chunks: ["학교까지", "오른쪽으로", "가세요"],
        incorrect: "오른쪽에 가세요.",
        explanation: "오른쪽으로 describes the direction of movement.",
        tags: ["direction", "places", "mixed"],
      },
      {
        family: "directions",
        korean: "카페까지 똑바로 가세요.",
        english: "Go straight to the cafe.",
        chunks: ["카페까지", "똑바로", "가세요"],
        incorrect: "카페에서 똑바로 가세요.",
        explanation: "까지 marks the endpoint of the route.",
        tags: ["direction", "places", "mixed"],
      },
    ],
  },
  {
    id: "routine-connector",
    matches: (text, exercise) => text.includes("마다") || exercise.tags.some((tag) => tag === "routine"),
    variants: [
      {
        family: "routine-connector",
        korean: "저녁마다 공부하고 밤에 쉬어요.",
        english: "Every evening I study and rest at night.",
        chunks: ["저녁마다", "공부하고", "밤에", "쉬어요"],
        incorrect: "저녁마다 공부해서 밤에 쉬어요.",
        explanation: "고 simply connects actions; 그래서/해서 would make it sound like cause and result.",
        tags: ["routine", "connectors", "mixed"],
      },
      {
        family: "routine-connector",
        korean: "아침마다 운동하고 오후에 일해요.",
        english: "Every morning I exercise and work in the afternoon.",
        chunks: ["아침마다", "운동하고", "오후에", "일해요"],
        incorrect: "아침마다 운동해서 오후에 일해요.",
        explanation: "Use 고 for a simple sequence or addition of routine actions.",
        tags: ["routine", "connectors", "mixed"],
      },
      {
        family: "routine-connector",
        korean: "날마다 한국어를 공부하고 음악을 들어요.",
        english: "Every day I study Korean and listen to music.",
        chunks: ["날마다", "한국어를", "공부하고", "음악을", "들어요"],
        incorrect: "날마다 한국어를 공부해서 음악을 들어요.",
        explanation: "고 links two actions without adding an unnecessary cause relationship.",
        tags: ["routine", "connectors", "mixed"],
      },
    ],
  },
];

function familyCandidates(exercise: ExerciseRecord): VariantCandidate[] {
  const text = sourceText(exercise);
  const family = sentenceFamilies.find((item) => item.matches(text, exercise));
  if (!family) return [];
  const baseAnswer = normalizeKorean(modelAnswerFor(exercise));
  return family.variants.filter((variant) => normalizeKorean(variant.korean) !== baseAnswer);
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
