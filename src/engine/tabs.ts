export type MainTab = "home" | "quiz" | "grammar" | "library" | "progress" | "settings";
export type QuizMode = "recommended" | "practice" | "review" | "sentence" | "listening";

export function isActiveMainTab(current: MainTab, candidate: MainTab): boolean {
  return current === candidate;
}

export function isActiveQuizMode(current: QuizMode, candidate: QuizMode): boolean {
  return current === candidate;
}
