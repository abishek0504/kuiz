import { useEffect, useMemo, useState } from "react";
import { ChipTabs } from "../../components/ChipTabs";
import { AudioButton } from "../../components/AudioButton";
import { StickyFeedback, type FeedbackState } from "../../components/StickyFeedback";
import { db } from "../../db/db";
import type { ExerciseRecord, UserSettings } from "../../db/schema";
import { checkAnswer } from "../../engine/answerCheck";
import { initialReviewState, review } from "../../engine/scheduler";
import { isActiveQuizMode, type QuizMode } from "../../engine/tabs";
import { speakKorean } from "../../utils/speech";

const quizModes: Array<{ id: QuizMode; label: string }> = [
  { id: "mcq", label: "Multiple choice" },
  { id: "fillBlank", label: "Fill blank" },
  { id: "sentenceBuilder", label: "Sentence builder" },
  { id: "correction", label: "Corrections" },
];

type QuizScreenProps = {
  exercises: ExerciseRecord[];
  settings: UserSettings;
  onSettingsChange: (patch: Partial<UserSettings>) => void;
};

function exerciseMatchesMode(exercise: ExerciseRecord, mode: QuizMode): boolean {
  if (mode === "correction") return exercise.type === "correction" || exercise.type === "conjugation";
  return exercise.type === mode;
}

function getModelAnswer(exercise: ExerciseRecord): string {
  if (exercise.type === "mcq") return exercise.choices.find((choice) => choice.isCorrect)?.text ?? "";
  if (exercise.type === "correction") return exercise.corrected;
  return exercise.modelAnswer;
}

function getLookupQuery(exercise: ExerciseRecord): string {
  return exercise.prompt.audioText ?? getModelAnswer(exercise) ?? exercise.prompt.stem;
}

function answerDetails(exercise: ExerciseRecord): Pick<FeedbackState, "modelAnswer" | "explanation" | "particleNote" | "naturalnessNote" | "lookupQuery" | "audioText"> {
  return {
    modelAnswer: getModelAnswer(exercise),
    explanation: exercise.explanation,
    particleNote: exercise.particleNote,
    naturalnessNote: exercise.naturalnessNote,
    lookupQuery: getLookupQuery(exercise),
    audioText: exercise.prompt.audioText ?? getModelAnswer(exercise),
  };
}

export function QuizScreen({ exercises, settings, onSettingsChange }: QuizScreenProps) {
  const [mode, setMode] = useState<QuizMode>("mcq");
  const [index, setIndex] = useState(0);
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
  const exercise = modeExercises[index % Math.max(1, modeExercises.length)];

  useEffect(() => {
    setIndex(0);
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
  }, [mode]);

  useEffect(() => {
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
    if (settings.autoAudio && exercise?.prompt.audioText) {
      speakKorean(exercise.prompt.audioText, settings);
    }
  }, [exercise?.id]);

  async function gradeCurrent(correct: boolean) {
    if (!exercise) return;
    const existing = (await db.reviewState.get(exercise.id)) ?? initialReviewState(exercise.id);
    await db.reviewState.put(review(existing, correct ? "good" : "again"));
  }

  function moveNext() {
    setIndex((current) => (modeExercises.length === 0 ? 0 : (current + 1) % modeExercises.length));
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
  }

  async function handleMcqChoice(choiceId: string) {
    if (!exercise || exercise.type !== "mcq" || feedback) return;
    const choice = exercise.choices.find((item) => item.id === choiceId);
    if (!choice) return;
    setSelectedChoiceId(choiceId);
    await gradeCurrent(choice.isCorrect);
    setFeedback({
      result: choice.isCorrect ? "correct" : "incorrect",
      ...answerDetails(exercise),
      explanation: choice.why ? `${choice.why} ${exercise.explanation ?? ""}`.trim() : exercise.explanation,
    });
  }

  async function handleCheck() {
    if (!exercise || exercise.type === "mcq") return;
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
    await gradeCurrent(result.correct);
    setFeedback({
      result: result.correct ? "correct" : "incorrect",
      ...answerDetails(exercise),
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
        <ChipTabs label="Quiz modes" items={quizModes} current={mode} onChange={setMode} />
        <div className="empty-state">No exercises found for this mode yet.</div>
      </section>
    );
  }

  return (
    <section className="quiz-layout">
      <ChipTabs label="Quiz modes" items={quizModes} current={mode} onChange={setMode} />
      <article className="quiz-card">
        <div className="quiz-meta">
          <span data-testid="quiz-index">
            {index + 1} / {modeExercises.length}
          </span>
          <span>{exercise.tags.slice(0, 3).join(" · ")}</span>
        </div>
        <h1>{exercise.prompt.stem}</h1>
        {exercise.prompt.stemKo ? <p className="korean-prompt">{exercise.prompt.stemKo}</p> : null}
        {exercise.prompt.context ? <p>{exercise.prompt.context}</p> : null}

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
            <button type="button" className="primary-button" onClick={moveNext}>
              Next
            </button>
          )}
        </div>

        {exercise.type === "mcq" ? (
          <div className={feedback ? "choice-grid answered" : "choice-grid"} aria-label="Answer choices">
            {exercise.choices.map((choice) => (
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
                onClick={() => handleMcqChoice(choice.id)}
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
            {!feedback ? (
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
