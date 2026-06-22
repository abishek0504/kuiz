export type ChoiceKind =
  | "particle"
  | "full-sentence-meaning"
  | "phrase-meaning"
  | "grammar-form"
  | "naturalness"
  | "connector"
  | "vocab";

export type GeneratedChoice = {
  id: string;
  text: string;
  isCorrect: boolean;
  why?: string;
};

export type MakeMcqChoicesInput = {
  correct: string;
  distractorGroup: string[];
  choiceKind: ChoiceKind;
  count?: number;
};

function isParticleLike(text: string): boolean {
  return !/\s/u.test(text) && text.length <= 8;
}

function isFullSentenceMeaning(text: string): boolean {
  return /[.!?]$/.test(text.trim()) || /\b(I|You|He|She|They|It|We)\b/.test(text);
}

function isSameGranularity(options: string[]): boolean {
  const longest = Math.max(...options.map((option) => option.trim().length));
  const shortest = Math.min(...options.map((option) => option.trim().length));
  return shortest * 3 >= longest;
}

export function optionsAreHomogeneous(options: string[], kind: ChoiceKind): boolean {
  if (kind === "particle") {
    return options.every(isParticleLike);
  }
  if (kind === "full-sentence-meaning") {
    return options.every(isFullSentenceMeaning) && isSameGranularity(options);
  }
  return true;
}

export function makeMcqChoices(input: MakeMcqChoicesInput): GeneratedChoice[] {
  const distinct = Array.from(new Set([input.correct, ...input.distractorGroup])).filter(Boolean);
  const candidates = distinct.filter((value) => value === input.correct || value !== input.correct);
  const options = candidates.slice(0, input.count ?? 4);

  if (!options.includes(input.correct)) {
    options.unshift(input.correct);
  }

  if (!optionsAreHomogeneous(options, input.choiceKind)) {
    throw new Error(`Distractors are not homogeneous for ${input.choiceKind}.`);
  }

  return options.slice(0, input.count ?? 4).map((text, index) => ({
    id: String.fromCharCode(97 + index),
    text,
    isCorrect: text === input.correct,
  }));
}
