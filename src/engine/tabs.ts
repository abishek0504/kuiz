export type MainTab = "home" | "quiz" | "grammar" | "library" | "progress" | "settings";
export type QuizMode = "recommended" | "practice" | "review" | "sentence" | "listening";
export type QuizTypeFilter =
  | "all"
  | "mcq"
  | "vocab"
  | "fillBlank"
  | "sentenceBuilder"
  | "correction"
  | "dialogue"
  | "reading"
  | "listening";

export function isActiveMainTab(current: MainTab, candidate: MainTab): boolean {
  return current === candidate;
}

export function isActiveQuizMode(current: QuizMode, candidate: QuizMode): boolean {
  return current === candidate;
}

export function isActiveQuizType(current: QuizTypeFilter, candidate: QuizTypeFilter): boolean {
  return current === candidate;
}
