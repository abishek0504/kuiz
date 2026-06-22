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
  allowModelFragment?: boolean;
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

const PARTICLE_SPACING_PATTERN = new RegExp(`\\s+(${PARTICLES.sort((a, b) => b.length - a.length).join("|")})(?=\\s|$)`, "gu");

export function normalizeAnswerKorean(value: string): string {
  return normalizeKorean(value).replace(PARTICLE_SPACING_PATTERN, "$1");
}

export function stripOptionalParticles(value: string): string {
  return normalizeAnswerKorean(value)
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

function loose(value: string): string {
  return normalizeAnswerKorean(value).replace(/\s+/g, "");
}

function sortedTokens(value: string): string[] {
  return normalizeAnswerKorean(value).split(" ").filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
}

export function hasFlexibleKoreanWordOrder(model: string, submitted: string): boolean {
  const modelTokens = normalizeAnswerKorean(model).split(" ").filter(Boolean);
  const submittedTokens = normalizeAnswerKorean(submitted).split(" ").filter(Boolean);
  if (modelTokens.length < 3 || modelTokens.length !== submittedTokens.length) return false;
  if (!/[가-힣]/u.test(modelTokens.join("")) || !/[가-힣]/u.test(submittedTokens.join(""))) return false;

  const modelFinal = modelTokens.at(-1);
  const submittedFinal = submittedTokens.at(-1);
  if (!modelFinal || modelFinal !== submittedFinal) return false;

  const modelMovable = sortedTokens(modelTokens.slice(0, -1).join(" "));
  const submittedMovable = sortedTokens(submittedTokens.slice(0, -1).join(" "));
  return modelMovable.join("\u0000") === submittedMovable.join("\u0000");
}

export function checkAnswer(input: CheckAnswerInput): CheckAnswerResult {
  const submitted = normalizeAnswerKorean(input.input);
  const models = acceptedSet(input);
  const exactMatches = models.map(normalizeAnswerKorean);

  if (exactMatches.includes(submitted)) {
    return { correct: true, mode: input.strictness };
  }

  const regexPatterns = input.accepted?.regex ?? [];
  const regexMatched = regexPatterns.some((pattern) => new RegExp(`^(?:${pattern})$`, "u").test(submitted));
  if (regexMatched) {
    return { correct: true, mode: input.strictness };
  }

  if (models.some((model) => hasFlexibleKoreanWordOrder(model, submitted))) {
    return {
      correct: true,
      mode: input.strictness,
      note: "Accepted: the same particle-marked words can move before the final verb in Korean.",
    };
  }

  if (input.allowModelFragment && models.some((model) => loose(submitted).includes(loose(model)))) {
    return {
      correct: true,
      mode: input.strictness,
      note: "Accepted as a full sentence. For this blank, the expected missing part is the model answer.",
    };
  }

  if (input.strictness === "relaxed") {
    const relaxedSubmitted = stripOptionalParticles(submitted);
    const relaxedModels = models.map(stripOptionalParticles);
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
