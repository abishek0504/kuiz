import { useEffect, useMemo, useState } from "react";
import { ChipTabs } from "../../components/ChipTabs";
import { AudioButton } from "../../components/AudioButton";
import { StickyFeedback, type FeedbackState } from "../../components/StickyFeedback";
import { db } from "../../db/db";
import type { ExerciseRecord, UserSettings } from "../../db/schema";
import { checkAnswer } from "../../engine/answerCheck";
import { orderChoices } from "../../engine/choiceOrder";
import { applyAnswerAnalytics } from "../../engine/mistakeAnalytics";
import {
  categoryMatchesSelectedTags,
  labelForTag,
  practiceCategories,
  tagsForPracticeCategory,
  type PracticeCategoryId,
} from "../../engine/practiceCategories";
import { initialReviewState, review, type ReviewState } from "../../engine/scheduler";
import {
  isListeningExercise,
  isProductionExercise,
  planBalancedSessionExercises,
  planRecommendedSessionExercises,
  planSessionExercises,
  sessionSummary,
} from "../../engine/sessionPlanner";
import { sentenceBreakdown } from "../../engine/sentenceBreakdown";
import { isActiveQuizMode, type QuizMode } from "../../engine/tabs";
import { speakKorean } from "../../utils/speech";

const quizModes: Array<{ id: QuizMode; label: string }> = [
  { id: "recommended", label: "추천" },
  { id: "practice", label: "연습" },
  { id: "review", label: "복습" },
  { id: "sentence", label: "문장" },
  { id: "listening", label: "듣기" },
];

const technicalTags = new Set([
  "mcq",
  "fillBlank",
  "sentenceBuilder",
  "sentence-builder",
  "correction",
  "conjugation",
  "dialogue",
  "reading",
  "listening",
  "dictation",
  "roleplay",
  "ordering",
  "minimalPair",
  "card",
]);

type QuizScreenProps = {
  exercises: ExerciseRecord[];
  reviewStates: ReviewState[];
  settings: UserSettings;
  onSettingsChange: (patch: Partial<UserSettings>) => void;
};

function exerciseMatchesMode(exercise: ExerciseRecord, mode: QuizMode): boolean {
  if (mode === "recommended" || mode === "practice" || mode === "review") return true;
  if (mode === "sentence") return isProductionExercise(exercise);
  if (mode === "listening") return isListeningExercise(exercise);
  return true;
}

function isChoiceExercise(exercise: ExerciseRecord): exercise is Extract<ExerciseRecord, { type: "mcq" | "minimalPair" }> {
  return exercise.type === "mcq" || exercise.type === "minimalPair";
}

function getModelAnswer(exercise: ExerciseRecord): string {
  if (isChoiceExercise(exercise)) return exercise.choices.find((choice) => choice.isCorrect)?.text ?? "";
  if (exercise.type === "correction") return exercise.corrected;
  return exercise.modelAnswer;
}

function getLookupQuery(exercise: ExerciseRecord): string {
  return exercise.prompt.audioText ?? getModelAnswer(exercise) ?? exercise.prompt.stem;
}

function answerDetails(
  exercise: ExerciseRecord,
): Pick<
  FeedbackState,
  "modelAnswer" | "explanation" | "particleNote" | "naturalnessNote" | "lookupQuery" | "audioText" | "sentenceParts"
> {
  const modelAnswer = getModelAnswer(exercise);
  const audioText = exercise.prompt.audioText ?? modelAnswer;
  return {
    modelAnswer,
    explanation: exercise.explanation,
    particleNote: exercise.particleNote,
    naturalnessNote: exercise.naturalnessNote,
    lookupQuery: getLookupQuery(exercise),
    audioText,
    sentenceParts: sentenceBreakdown(audioText),
  };
}

export function QuizScreen({ exercises, reviewStates, settings, onSettingsChange }: QuizScreenProps) {
  const [mode, setMode] = useState<QuizMode>("recommended");
  const [index, setIndex] = useState(0);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | undefined>();

  const modeExercises = useMemo(() => {
    const matchingMode = exercises.filter((exercise) => exerciseMatchesMode(exercise, mode));
    const focusTags = settings.focusTags ?? [];
    if (focusTags.length === 0) return matchingMode;
    const matchingFocus = matchingMode.filter((exercise) =>
      exercise.tags.some((tag) => focusTags.includes(tag)),
    );
    return matchingFocus.length > 0 ? matchingFocus : matchingMode;
  }, [exercises, mode, settings.focusTags]);
  const sessionExercises = useMemo(
    () =>
      mode === "recommended"
        ? planRecommendedSessionExercises(modeExercises, reviewStates)
        : mode === "review"
          ? planSessionExercises(modeExercises, reviewStates)
          : planBalancedSessionExercises(modeExercises, reviewStates),
    [mode, modeExercises, reviewStates],
  );
  const summary = useMemo(() => sessionSummary(modeExercises, reviewStates), [modeExercises, reviewStates]);
  const exercise =
    sessionExercises.find((candidate) => candidate.id === activeExerciseId) ??
    sessionExercises[index % Math.max(1, sessionExercises.length)];
  const tagSummary = exercise?.tags
    .filter((tag) => !technicalTags.has(tag))
    .slice(0, 3)
    .map(labelForTag)
    .join(" · ");
  const displayedChoices = useMemo(
    () => (exercise && isChoiceExercise(exercise) ? orderChoices(exercise.choices, exercise.id) : []),
    [exercise],
  );
  const selectedTags = settings.focusTags ?? [];
  const similarExercise = useMemo(() => {
    if (!exercise || !feedback) return undefined;
    const currentTags = new Set(exercise.tags.filter((tag) => !technicalTags.has(tag)));
    const candidates = [...sessionExercises, ...modeExercises].filter((candidate) => candidate.id !== exercise.id);
    return (
      candidates.find((candidate) => candidate.type === exercise.type && candidate.tags.some((tag) => currentTags.has(tag))) ??
      candidates.find((candidate) => candidate.tags.some((tag) => currentTags.has(tag))) ??
      candidates.find((candidate) => candidate.type === exercise.type)
    );
  }, [exercise, feedback, modeExercises, sessionExercises]);

  function selectFocus(categoryId: PracticeCategoryId) {
    onSettingsChange({ focusTags: tagsForPracticeCategory(categoryId) });
  }

  useEffect(() => {
    setIndex(0);
    setActiveExerciseId(null);
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
  }, [mode]);

  useEffect(() => {
    setMode("recommended");
    setIndex(0);
    setActiveExerciseId(null);
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
  }, [settings.focusTags]);

  useEffect(() => {
    if (sessionExercises.length === 0) {
      setActiveExerciseId(null);
      return;
    }
    if (!activeExerciseId || !sessionExercises.some((candidate) => candidate.id === activeExerciseId)) {
      setActiveExerciseId(sessionExercises[0].id);
    }
  }, [activeExerciseId, sessionExercises]);

  useEffect(() => {
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
    if (settings.autoAudio && exercise?.prompt.audioText) {
      speakKorean(exercise.prompt.audioText, settings);
    }
  }, [exercise?.id]);

  async function gradeCurrent(correct: boolean, reason?: string) {
    if (!exercise) return;
    const existing = (await db.reviewState.get(exercise.id)) ?? initialReviewState(exercise.id);
    const reviewed = review(existing, correct ? "good" : "again");
    await db.reviewState.put(applyAnswerAnalytics(reviewed, exercise, correct, reason));
  }

  function moveNext() {
    if (sessionExercises.length === 0) {
      setIndex(0);
      setActiveExerciseId(null);
      setSelectedChoiceId(null);
      setInput("");
      setFeedback(undefined);
      return;
    }

    const currentIndex = sessionExercises.findIndex((candidate) => candidate.id === exercise?.id);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % sessionExercises.length : 0;
    setIndex(nextIndex);
    setActiveExerciseId(sessionExercises[nextIndex]?.id ?? null);
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
  }

  function moveToSimilar() {
    if (!similarExercise) return;
    const nextIndex = sessionExercises.findIndex((candidate) => candidate.id === similarExercise.id);
    setIndex(nextIndex >= 0 ? nextIndex : 0);
    setActiveExerciseId(similarExercise.id);
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
  }

  async function handleChoice(choiceId: string) {
    if (!exercise || !isChoiceExercise(exercise) || feedback) return;
    const choice = exercise.choices.find((item) => item.id === choiceId);
    if (!choice) return;
    setSelectedChoiceId(choiceId);
    await gradeCurrent(choice.isCorrect, choice.isCorrect ? undefined : choice.why);
    setFeedback({
      result: choice.isCorrect ? "correct" : "incorrect",
      ...answerDetails(exercise),
      misconception: choice.isCorrect ? undefined : choice.why,
      explanation: choice.why ? `${choice.why} ${exercise.explanation ?? ""}`.trim() : exercise.explanation,
    });
  }

  async function handleCheck() {
    if (!exercise || isChoiceExercise(exercise)) return;
    const accepted =
      "acceptedAnswers" in exercise
        ? {
            strict: exercise.acceptedAnswers.strict,
            relaxed: exercise.acceptedAnswers.relaxed,
            regex: exercise.acceptedAnswers.regex,
          }
        : undefined;
    const result = checkAnswer({
      model: getModelAnswer(exercise),
      input,
      strictness: settings.particleStrictness,
      accepted,
    });
    await gradeCurrent(result.correct, result.correct ? undefined : result.note || exercise.explanation);
    setFeedback({
      result: result.correct ? "correct" : "incorrect",
      ...answerDetails(exercise),
      misconception: result.correct ? undefined : result.note,
      explanation: [exercise.explanation, result.note].filter(Boolean).join(" "),
    });
  }

  function handleShowAnswer() {
    if (!exercise) return;
    setFeedback({
      result: "shown",
      ...answerDetails(exercise),
    });
  }

  if (!exercise) {
    return (
      <section className="stack">
        <ChipTabs label="Session type" items={quizModes} current={mode} onChange={setMode} />
        <div className="empty-state">No exercises found for this mode yet.</div>
      </section>
    );
  }

  return (
    <section className="quiz-layout">
      <div className="quiz-focus-strip" aria-label="Practice focus">
        {practiceCategories.map((category) => {
          const active = categoryMatchesSelectedTags(category, selectedTags);
          return (
            <button
              type="button"
              className={active ? "focus-pill active" : "focus-pill"}
              aria-pressed={active}
              key={category.id}
              onClick={() => selectFocus(category.id)}
            >
              {category.label}
            </button>
          );
        })}
      </div>
      <ChipTabs label="Session type" items={quizModes} current={mode} onChange={setMode} />
      <article className="quiz-card">
        <div className="quiz-meta">
          <span data-testid="quiz-index">
            {Math.min(index + 1, sessionExercises.length)} / {sessionExercises.length}
          </span>
          <span>{tagSummary}</span>
        </div>
        <p className="session-summary">
          Smart order: {summary.due} due, {summary.weak} weak, {summary.fresh} new
        </p>
        <h1>{exercise.prompt.stem}</h1>
        {exercise.prompt.stemKo ? <p className="korean-prompt">{exercise.prompt.stemKo}</p> : null}
        {exercise.prompt.context ? <p>{exercise.prompt.context}</p> : null}
        {exercise.communicativeGoal ? <p className="goal-line">Goal: {exercise.communicativeGoal}</p> : null}
        {exercise.type === "dialogue" ? (
          <div className="dialogue-card" aria-label="Dialogue">
            {exercise.turns.map((turn, turnIndex) => (
              <p key={`${turn.speaker}-${turnIndex}`}>
                <strong>{turn.speaker}</strong>
                <span>{turn.ko}</span>
              </p>
            ))}
          </div>
        ) : null}
        {exercise.type === "reading" ? (
          <div className="reading-card" aria-label="Reading passage">
            {exercise.passage.title ? <h2>{exercise.passage.title}</h2> : null}
            <p>{exercise.passage.ko}</p>
          </div>
        ) : null}
        {"question" in exercise ? <p className="question-line">{exercise.question}</p> : null}

        <div className="quiz-controls">
          <AudioButton text={exercise.prompt.audioText} settings={settings} />
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.autoAudio}
              onChange={(event) => onSettingsChange({ autoAudio: event.target.checked })}
            />
            Auto audio
          </label>
          {!feedback ? (
            <>
              <button type="button" className="secondary-button" onClick={handleShowAnswer}>
                Show answer
              </button>
              <button type="button" className="skip-button" onClick={moveNext}>
                Skip
              </button>
            </>
          ) : (
            <>
              {similarExercise ? (
                <button type="button" className="secondary-button" onClick={moveToSimilar}>
                  Try similar one
                </button>
              ) : null}
              <button type="button" className="primary-button" onClick={moveNext}>
                Next
              </button>
            </>
          )}
        </div>

        {isChoiceExercise(exercise) ? (
          <div className={feedback ? "choice-grid answered" : "choice-grid"} aria-label="Answer choices">
            {displayedChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={
                  selectedChoiceId === choice.id
                    ? choice.isCorrect
                      ? "choice selected correct"
                      : "choice selected incorrect"
                    : "choice"
                }
                onClick={() => handleChoice(choice.id)}
              >
                {choice.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="free-answer">
            {"tokens" in exercise && exercise.tokens.length > 0 ? (
              <div className="token-bank">
                {exercise.tokens.map((token) => (
                  <button
                    key={token}
                    type="button"
                    className="token"
                    onClick={() => setInput((current) => `${current} ${token}`.trim())}
                  >
                    {token}
                  </button>
                ))}
              </div>
            ) : null}
            {"chunks" in exercise && exercise.chunks.length > 0 ? (
              <div className="token-bank" aria-label="Ordering chunks">
                {exercise.chunks.map((chunk) => (
                  <button
                    key={chunk}
                    type="button"
                    className="token"
                    onClick={() => setInput((current) => `${current} ${chunk}`.trim())}
                  >
                    {chunk}
                  </button>
                ))}
              </div>
            ) : null}
            {"incorrect" in exercise ? <p className="incorrect-source">{exercise.incorrect}</p> : null}
            <label className="field-label" htmlFor="free-response">
              Your answer
            </label>
            <input
              id="free-response"
              className="text-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && input.trim()) {
                  void handleCheck();
                }
              }}
            />
            {!feedback && input.trim() ? (
              <button type="button" className="primary-button" disabled={!input.trim()} onClick={handleCheck}>
                Check
              </button>
            ) : null}
          </div>
        )}
      </article>
      <StickyFeedback feedback={feedback} settings={settings} />
      <p className="sr-only">
        Active mode: {quizModes.find((item) => isActiveQuizMode(mode, item.id))?.label ?? mode}
      </p>
    </section>
  );
}
