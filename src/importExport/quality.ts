import type { ContentPack, Exercise, MCQExercise, MinimalPairExercise } from "../schemas/contentPack";

function extractBlankParticleSequence(value: string): string | undefined {
  const particles = [
    "에서",
    "에게서",
    "한테서",
    "에게",
    "한테",
    "부터",
    "까지",
    "으로",
    "로",
    "에",
    "을",
    "를",
    "은",
    "는",
    "이",
    "가",
    "도",
    "만",
    "밖에",
  ];
  const tokens = value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .flatMap((token) =>
      particles.filter((particle) => token === particle || (token.length > particle.length && token.endsWith(particle))),
    );
  const uniqueSequence = tokens.filter((particle, index) => particle !== tokens[index - 1]);
  return uniqueSequence.length >= 2 ? uniqueSequence.join(" ") : undefined;
}

function hasHangul(text: string): boolean {
  return /[가-힣]/u.test(text);
}

function hasLatin(text: string): boolean {
  return /[A-Za-z]/u.test(text);
}

function sentenceLike(text: string): boolean {
  const trimmed = text.trim();
  return /[.!?]$/u.test(trimmed) || /\s/u.test(trimmed) || /[가-힣].*(요|다|까|죠|네)[.!?]?$/u.test(trimmed);
}

function isParticleLike(text: string): boolean {
  return !/\s/u.test(text.trim()) && text.trim().length <= 8;
}

function looksLikeFakeCombinationRule(text: string): boolean {
  const normalized = text.toLocaleLowerCase();
  const hasPlace = /장소|place|location/u.test(normalized);
  const hasTime = /시간|time/u.test(normalized);
  const hasObject = /목적어|object/u.test(normalized);
  const hasEnding = /어미|ending|verb ending/u.test(normalized);
  return (hasPlace && hasTime && hasObject) || (hasPlace && hasTime && hasEnding) || (hasObject && hasEnding && hasTime);
}

function modelAnswerFor(exercise: Exercise): string {
  if ("modelAnswer" in exercise) return exercise.modelAnswer;
  if ("corrected" in exercise) return exercise.corrected;
  if ("choices" in exercise) return exercise.choices.find((choice) => choice.isCorrect)?.text ?? "";
  return "";
}

function validateChoiceExercise(exercise: MCQExercise | MinimalPairExercise, errors: string[]) {
  const label = `exercises.${exercise.id}`;
  const texts = exercise.choices.map((choice) => choice.text.trim());
  const uniqueTexts = new Set(texts.map((text) => text.toLocaleLowerCase()));
  const correct = exercise.choices.find((choice) => choice.isCorrect)?.text.trim() ?? "";
  const wrongChoices = exercise.choices.filter((choice) => !choice.isCorrect);

  if (exercise.choices.length !== 4) {
    errors.push(`${label}: multiple choice exercises must have exactly 4 choices.`);
  }
  if (exercise.choices[0]?.isCorrect) {
    errors.push(`${label}: source choices must not put the correct answer first.`);
  }
  if (uniqueTexts.size !== texts.length) {
    errors.push(`${label}: choices must not repeat the same visible answer.`);
  }
  if (texts.some((text) => /^[0-9]+$/u.test(text))) {
    errors.push(`${label}: choices must not use bare numeric filler like 1, 2, or 3.`);
  }

  for (const choice of exercise.choices) {
    if (!choice.isCorrect && !choice.why?.trim()) {
      errors.push(`${label}: every distractor needs a misconception note in "why".`);
    }
    if (!choice.isCorrect && /^(wrong|not correct|incorrect)\.?$/iu.test(choice.why?.trim() ?? "")) {
      errors.push(`${label}: distractor "why" must name a concrete misconception.`);
    }
  }

  if (exercise.choiceKind === "full-sentence-meaning" && sentenceLike(correct)) {
    const muchShorter = wrongChoices.filter((choice) => choice.text.trim().length * 2 < correct.length).length;
    if (muchShorter >= 3) {
      errors.push(`${label}: distractors must stay near the same granularity as the correct answer.`);
    }
  }

  if (exercise.choiceKind === "particle" && !texts.every(isParticleLike)) {
    errors.push(`${label}: particle choices must all be short particle-form options.`);
  }

  if (exercise.choiceKind === "full-sentence-meaning") {
    if (!texts.every(sentenceLike)) {
      errors.push(`${label}: full-sentence MCQs must use full-sentence choices.`);
    }
    if (texts.some((text) => !hasHangul(text) && !/\s/u.test(text) && text.length < 8)) {
      errors.push(`${label}: full-sentence MCQs must not use one-word English choices.`);
    }
  }
}

export function validateContentQuality(pack: ContentPack): string[] {
  const errors: string[] = [];
  const entries = [...pack.vocab, ...pack.particles, ...pack.grammar];
  const dedupeKeys = [...entries, ...pack.exercises].map((item) => item.dedupeKey);
  const seenKeys = new Set<string>();

  for (const key of dedupeKeys) {
    if (seenKeys.has(key)) errors.push(`dedupeKey ${key}: duplicate within incoming pack.`);
    seenKeys.add(key);
  }

  const audioTexts = [
    ...pack.exercises.map((exercise) => exercise.prompt.audioText),
    ...pack.exercises.flatMap((exercise) =>
      exercise.type === "dialogue" ? exercise.turns.map((turn) => turn.audioText ?? turn.ko) : [],
    ),
    ...entries.flatMap((entry) => entry.examples.map((example) => example.audioText)),
  ].filter((text): text is string => Boolean(text));

  for (const audioText of audioTexts) {
    if (!hasHangul(audioText) || hasLatin(audioText)) {
      errors.push(`audioText "${audioText}": audio must be Korean-only Hangul text.`);
    }
  }

  for (const entry of pack.grammar) {
    if (/\[[^\]]+\]/u.test(`${entry.title} ${entry.pattern}`)) {
      errors.push(`grammar.${entry.id}: use real Korean examples instead of bracket placeholders.`);
    }
    if (looksLikeFakeCombinationRule(`${entry.title} ${entry.pattern} ${entry.meaning} ${entry.notes ?? ""}`)) {
      errors.push(
        `grammar.${entry.id}: do not create fake combined rules for place, time, object, and endings; keep rules separate and use mixed sentence exercises for combinations.`,
      );
    }
  }

  for (const exercise of pack.exercises) {
    if (exercise.type === "mcq" || exercise.type === "minimalPair") {
      validateChoiceExercise(exercise, errors);
      if (
        exercise.type === "mcq" &&
        exercise.choiceKind === "phrase-meaning" &&
        /^what does .+ mean\?$/i.test(exercise.prompt.stem.trim()) &&
        exercise.tags.includes("vocab")
      ) {
        errors.push(
          `exercises.${exercise.id}: grammar meaning MCQs must not use the vocab tag; use grammar tags and keep word drills on choiceKind "vocab" or dedupeKey exercise:vocab:<lemma>.`,
        );
      }
      if (
        exercise.type === "mcq" &&
        exercise.choiceKind === "phrase-meaning" &&
        /choose the (?:korean|english) for/i.test(exercise.prompt.stem) &&
        !exercise.dedupeKey.startsWith("exercise:vocab:")
      ) {
        errors.push(
          `exercises.${exercise.id}: word translation drills should use choiceKind "vocab" or dedupeKey exercise:vocab:<lemma>.`,
        );
      }
    }
    if (exercise.type === "fillBlank") {
      const blankRegions = exercise.prompt.stem.match(/_{3,}/g) ?? [];
      if (blankRegions.length >= 2 && exercise.answerPresentation !== "sentence") {
        const modelAnswer = modelAnswerFor(exercise);
        const blankOnly = extractBlankParticleSequence(modelAnswer) ?? modelAnswer.trim();
        const accepted = [...(exercise.acceptedAnswers?.strict ?? []), ...(exercise.acceptedAnswers?.relaxed ?? [])];
        const normalizedAccepted = accepted.map((answer) => answer.replace(/\s+/g, " ").trim());
        const hasBlankOnly = normalizedAccepted.some(
          (answer) =>
            answer === blankOnly ||
            answer.replace(/\s+/g, "") === blankOnly.replace(/\s+/g, "") ||
            Boolean(extractBlankParticleSequence(modelAnswer) && answer === extractBlankParticleSequence(modelAnswer)),
        );
        if (!hasBlankOnly) {
          errors.push(
            `exercises.${exercise.id}: multi-blank fillBlank items must include the blank-only accepted answer such as "${blankOnly}".`,
          );
        }
      }
    }
    if (/\[[^\]]+\]/u.test(`${exercise.prompt.stem} ${exercise.prompt.stemKo ?? ""} ${modelAnswerFor(exercise)}`)) {
      errors.push(`exercises.${exercise.id}: use concrete Korean sentences instead of bracket placeholders.`);
    }
  }

  const repeatedDistractors = new Map<string, number>();
  for (const exercise of pack.exercises) {
    if (exercise.type !== "mcq" || exercise.choiceKind !== "full-sentence-meaning") continue;
    for (const choice of exercise.choices) {
      if (!choice.isCorrect) {
        repeatedDistractors.set(choice.text, (repeatedDistractors.get(choice.text) ?? 0) + 1);
      }
    }
  }
  for (const [choice, count] of repeatedDistractors) {
    if (count > 2) {
      errors.push(`choice "${choice}": generic full-sentence distractor is reused ${count} times.`);
    }
  }

  function visitStrings(value: unknown, path: string) {
    if (typeof value === "string") {
      if (value.includes("??")) {
        errors.push(`${path}: visible replacement-marker question marks are not allowed.`);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((child, index) => visitStrings(child, `${path}.${index}`));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, child]) => visitStrings(child, `${path}.${key}`));
    }
  }
  visitStrings(pack, "pack");

  const hasFormFocusedContent =
    pack.particles.length > 0 ||
    pack.grammar.length > 0 ||
    pack.pack.includes.some((tag) => ["particles", "particle", "grammar", "connectors"].includes(tag));
  const hasProductionTask = pack.exercises.some(
    (exercise) =>
      exercise.type === "fillBlank" ||
      exercise.type === "sentenceBuilder" ||
      exercise.type === "correction" ||
      exercise.type === "conjugation" ||
      exercise.type === "dictation" ||
      exercise.type === "roleplay" ||
      exercise.type === "ordering",
  );
  if (hasFormFocusedContent && !hasProductionTask) {
    errors.push("pack: grammar, particle, and connector lessons must include at least one production or repair task.");
  }

  return errors;
}
