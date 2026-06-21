export type MainTab = "home" | "quiz" | "grammar" | "library" | "progress" | "settings";
export type QuizMode = "balanced" | "mcq" | "fillBlank" | "sentenceBuilder" | "correction";

export function isActiveMainTab(current: MainTab, candidate: MainTab): boolean {
  return current === candidate;
}

export function isActiveQuizMode(current: QuizMode, candidate: QuizMode): boolean {
  return current === candidate;
}
