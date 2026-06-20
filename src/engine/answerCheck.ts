import { normalizeKorean, normalizeSpacing } from "./normalize";

export type Strictness = "strict" | "relaxed";

export type CheckAnswerInput = {
  model: string;
  input: string;
  strictness: Strictness;
  accepted?: {
    strict?: string[];
    relaxed?: string[];
    regex?: string[];
  };
};

export type CheckAnswerResult = {
  correct: boolean;
  mode: Strictness;
  note?: string;
};

const PARTICLES = [
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "에",
  "에서",
  "에게",
  "한테",
  "께",
  "에게서",
  "한테서",
  "부터",
  "까지",
  "도",
  "만",
  "밖에",
  "보다",
  "만큼",
  "와",
  "과",
  "하고",
  "랑",
  "이랑",
];

export function stripOptionalParticles(value: string): string {
  return normalizeKorean(value)
    .split(" ")
    .map((token) => {
      const matched = PARTICLES
        .filter((particle) => token.length > particle.length && token.endsWith(particle))
        .sort((a, b) => b.length - a.length)[0];
      return matched ? token.slice(0, -matched.length) : token;
    })
    .join(" ");
}

function acceptedSet(input: CheckAnswerInput): string[] {
  const strict = input.accepted?.strict ?? [];
  const relaxed = input.accepted?.relaxed ?? [];
  const base = input.strictness === "strict" ? strict : [...strict, ...relaxed];
  return [input.model, ...base];
}

export function checkAnswer(input: CheckAnswerInput): CheckAnswerResult {
  const submitted = normalizeKorean(input.input);
  const exactMatches = acceptedSet(input).map(normalizeKorean);

  if (exactMatches.includes(submitted)) {
    return { correct: true, mode: input.strictness };
  }

  const regexPatterns = input.accepted?.regex ?? [];
  const regexMatched = regexPatterns.some((pattern) => new RegExp(`^(?:${pattern})$`, "u").test(submitted));
  if (regexMatched) {
    return { correct: true, mode: input.strictness };
  }

  if (input.strictness === "relaxed") {
    const relaxedSubmitted = stripOptionalParticles(submitted);
    const relaxedModels = acceptedSet(input).map(stripOptionalParticles);
    if (relaxedModels.includes(relaxedSubmitted)) {
      return {
        correct: true,
        mode: "relaxed",
        note: "Accepted in relaxed mode. Keep the full-particle model answer in strict practice.",
      };
    }
  }

  return {
    correct: false,
    mode: input.strictness,
    note:
      input.strictness === "strict"
        ? "Strict mode requires the model particles and spacing."
        : `Try: ${normalizeSpacing(input.model)}`,
  };
}
