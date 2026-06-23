import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChipTabs } from "../../components/ChipTabs";
import { AudioButton } from "../../components/AudioButton";
import { StickyFeedback, type FeedbackState } from "../../components/StickyFeedback";
import { db } from "../../db/db";
import type { EntryRecord, ExerciseRecord, UserSettings } from "../../db/schema";
import { checkAnswer, extractParticleSequence } from "../../engine/answerCheck";
import { feedbackModelAnswer, getModelAnswer, getTranslation, type RuntimeExerciseRecord } from "../../engine/quizFeedback";
import { orderChoices } from "../../engine/choiceOrder";
import { applyAnswerAnalytics } from "../../engine/mistakeAnalytics";
import {
  categoryMatchesSelectedTags,
  isCoreParticleExercise,
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
import { isActiveQuizMode, isActiveQuizType, type QuizMode, type QuizTypeFilter } from "../../engine/tabs";
import {
  buildRuntimeVocabExercises,
  countVocabPracticeExercises,
  isVocabPracticeExercise,
  shouldAugmentVocabPool,
  type RuntimeVocabExerciseRecord,
} from "../../engine/vocabPractice";
import { createVariantExercise, type VariantExerciseRecord } from "../../engine/variants";
import { SessionCompletePanel } from "./SessionCompletePanel";
import { emptyBatchStats, recordBatchAnswer, recordBatchSkip, type SessionBatchStats } from "../../engine/sessionStats";
import { speakKorean } from "../../utils/speech";

const quizModes: Array<{ id: QuizMode; label: string }> = [
  { id: "recommended", label: "Recommended" },
  { id: "practice", label: "Practice" },
  { id: "review", label: "Review" },
  { id: "sentence", label: "Sentences" },
  { id: "listening", label: "Listening" },
];

const questionTypeFilters: Array<{ id: QuizTypeFilter; label: string }> = [
  { id: "all", label: "All types" },
  { id: "mcq", label: "Multiple choice" },
  { id: "vocab", label: "Vocab cards" },
  { id: "fillBlank", label: "Fill blank" },
  { id: "sentenceBuilder", label: "Build" },
  { id: "correction", label: "Fix" },
  { id: "dialogue", label: "Dialogue" },
  { id: "reading", label: "Reading" },
  { id: "listening", label: "Listening" },
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
  entries: EntryRecord[];
  exercises: ExerciseRecord[];
  reviewStates: ReviewState[];
  settings: UserSettings;
  onSettingsChange: (patch: Partial<UserSettings>) => void;
};

type PersistedQuizState = {
  mode: QuizMode;
  questionType: QuizTypeFilter;
  index: number;
  activeExerciseId: string | null;
  selectedChoiceId: string | null;
  input: string;
  feedback?: FeedbackState;
  sessionPlanIds: string[];
  seenExerciseIds: string[];
  variantExercises: VariantExerciseRecord[];
  filterSignature: string;
  batchStats: SessionBatchStats;
  showSessionComplete: boolean;
};

const quizSessionStorageKey = "kuiz.quizSession.v5";
const sessionSize = 10;

function isQuizMode(value: unknown): value is QuizMode {
  return typeof value === "string" && quizModes.some((mode) => mode.id === value);
}

function isQuizTypeFilter(value: unknown): value is QuizTypeFilter {
  return typeof value === "string" && questionTypeFilters.some((filter) => filter.id === value);
}

function readPersistedQuizState(): PersistedQuizState {
  if (typeof window === "undefined") return emptyPersistedQuizState();
  try {
    const raw = window.localStorage.getItem(quizSessionStorageKey);
    const parsed = raw ? (JSON.parse(raw) as Partial<PersistedQuizState>) : {};
    return {
      mode: isQuizMode(parsed.mode) ? parsed.mode : "recommended",
      questionType: isQuizTypeFilter(parsed.questionType) ? parsed.questionType : "all",
      index: typeof parsed.index === "number" && Number.isFinite(parsed.index) ? parsed.index : 0,
      activeExerciseId: typeof parsed.activeExerciseId === "string" ? parsed.activeExerciseId : null,
      selectedChoiceId: typeof parsed.selectedChoiceId === "string" ? parsed.selectedChoiceId : null,
      input: typeof parsed.input === "string" ? parsed.input : "",
      feedback: parsed.feedback,
      sessionPlanIds: Array.isArray(parsed.sessionPlanIds)
        ? parsed.sessionPlanIds.filter((id): id is string => typeof id === "string")
        : [],
      seenExerciseIds: Array.isArray(parsed.seenExerciseIds)
        ? parsed.seenExerciseIds.filter((id): id is string => typeof id === "string")
        : [],
      variantExercises: Array.isArray(parsed.variantExercises)
        ? parsed.variantExercises.filter(
            (exercise): exercise is VariantExerciseRecord =>
              Boolean(exercise) &&
              typeof exercise === "object" &&
              typeof (exercise as Partial<VariantExerciseRecord>).id === "string" &&
              typeof (exercise as Partial<VariantExerciseRecord>).variantOf === "string",
          )
        : [],
      filterSignature: typeof parsed.filterSignature === "string" ? parsed.filterSignature : "",
      batchStats:
        parsed.batchStats && typeof parsed.batchStats === "object"
          ? {
              answered: Number(parsed.batchStats.answered) || 0,
              correct: Number(parsed.batchStats.correct) || 0,
              incorrectIds: Array.isArray(parsed.batchStats.incorrectIds)
                ? parsed.batchStats.incorrectIds.filter((id): id is string => typeof id === "string")
                : [],
              tagCorrect:
                parsed.batchStats.tagCorrect && typeof parsed.batchStats.tagCorrect === "object"
                  ? (parsed.batchStats.tagCorrect as Record<string, number>)
                  : {},
              tagTotal:
                parsed.batchStats.tagTotal && typeof parsed.batchStats.tagTotal === "object"
                  ? (parsed.batchStats.tagTotal as Record<string, number>)
                  : {},
            }
          : emptyBatchStats(),
      showSessionComplete: parsed.showSessionComplete === true,
    };
  } catch {
    return emptyPersistedQuizState();
  }
}

function emptyPersistedQuizState(): PersistedQuizState {
  return {
    mode: "recommended",
    questionType: "all",
    index: 0,
    activeExerciseId: null,
    selectedChoiceId: null,
    input: "",
    sessionPlanIds: [],
    seenExerciseIds: [],
    variantExercises: [],
    filterSignature: "",
    batchStats: emptyBatchStats(),
    showSessionComplete: false,
  };
}

function exerciseMatchesMode(exercise: ExerciseRecord, mode: QuizMode): boolean {
  if (mode === "recommended" || mode === "practice" || mode === "review") return true;
  if (mode === "sentence") return isProductionExercise(exercise);
  if (mode === "listening") return isListeningExercise(exercise);
  return true;
}

function exerciseMatchesQuestionType(exercise: ExerciseRecord, questionType: QuizTypeFilter): boolean {
  if (questionType === "all") return true;
  if (questionType === "mcq") return exercise.type === "mcq" || exercise.type === "minimalPair";
  if (questionType === "vocab") return isVocabPracticeExercise(exercise);
  if (questionType === "listening") return isListeningExercise(exercise);
  return exercise.type === questionType;
}

function selectedFocusIsVocab(selectedTags: string[]): boolean {
  return selectedTags.includes("vocab") || selectedTags.includes("card");
}

function isChoiceExercise(exercise: RuntimeExerciseRecord): exercise is Extract<RuntimeExerciseRecord, { type: "mcq" | "minimalPair" }> {
  return exercise.type === "mcq" || exercise.type === "minimalPair";
}

function reviewCardId(exercise: RuntimeExerciseRecord): string {
  if ("variantOf" in exercise) return exercise.variantOf;
  if ("runtimeVocabOf" in exercise) return exercise.dedupeKey;
  return exercise.id;
}

function getLookupQuery(exercise: RuntimeExerciseRecord): string {
  return exercise.prompt.audioText ?? getModelAnswer(exercise) ?? exercise.prompt.stem;
}

function getPromptAudioText(exercise: RuntimeExerciseRecord): string | undefined {
  return isListeningExercise(exercise) ? exercise.prompt.audioText : undefined;
}

function answerInstruction(exercise: RuntimeExerciseRecord): string {
  if (exercise.type === "fillBlank") {
    if (exercise.answerPresentation === "sentence") return "Type the complete Korean sentence.";
    if (exercise.answerPresentation === "particle") return "Type only the missing particle or particles.";
    return "Type only the missing blank. A full sentence is accepted if the blank answer is correct.";
  }
  if (exercise.type === "sentenceBuilder") return "Build the full Korean sentence. Particle-marked time and place can move before the final verb.";
  if (exercise.type === "ordering") return "Tap chunks or type the full Korean sentence in a natural order.";
  if (exercise.type === "correction") return "Type the corrected full Korean sentence.";
  if (exercise.type === "conjugation") return "Type the requested Korean form.";
  if (exercise.type === "dictation") return "Type the Korean sentence you hear.";
  if (exercise.type === "listening") return "Listen first, then type the Korean answer.";
  if (exercise.type === "dialogue") return "Type the useful Korean line from the exchange.";
  if (exercise.type === "reading") return "Answer in Korean using the passage.";
  if (exercise.type === "roleplay") return "Produce one natural Korean line for the situation.";
  return "Type your Korean answer.";
}

function filterSignature(mode: QuizMode, questionType: QuizTypeFilter, focusTags: string[]): string {
  return JSON.stringify({ mode, questionType, focusTags: [...focusTags].sort() });
}

function planForMode(mode: QuizMode, exercises: ExerciseRecord[], reviewStates: ReviewState[]): ExerciseRecord[] {
  if (mode === "recommended") return planRecommendedSessionExercises(exercises, reviewStates);
  if (mode === "review") return planSessionExercises(exercises, reviewStates);
  return planBalancedSessionExercises(exercises, reviewStates);
}

function addUniqueId(ids: string[], id: string | undefined): string[] {
  if (!id || ids.includes(id)) return ids;
  return [...ids, id];
}

function buildSessionPlanIds(
  mode: QuizMode,
  exercises: ExerciseRecord[],
  reviewStates: ReviewState[],
  seenIds: string[],
): { planIds: string[]; seenIds: string[] } {
  const seen = new Set(seenIds);
  const unseenExercises = exercises.filter((exercise) => !seen.has(exercise.id));
  const source = unseenExercises.length > 0 ? unseenExercises : exercises;
  const nextSeenIds = unseenExercises.length > 0 ? seenIds : [];
  const planIds = planForMode(mode, source, reviewStates)
    .slice(0, sessionSize)
    .map((exercise) => exercise.id);

  return { planIds, seenIds: nextSeenIds };
}

function answerDetails(
  exercise: RuntimeExerciseRecord,
): Pick<
  FeedbackState,
  | "modelAnswer"
  | "explanation"
  | "particleNote"
  | "naturalnessNote"
  | "lookupQuery"
  | "audioText"
  | "sentenceParts"
  | "translation"
> {
  const modelAnswer = getModelAnswer(exercise);
  const audioText = exercise.prompt.audioText ?? modelAnswer;
  return {
    modelAnswer: feedbackModelAnswer(exercise),
    explanation: exercise.explanation,
    particleNote: exercise.particleNote,
    naturalnessNote: exercise.naturalnessNote,
    lookupQuery: getLookupQuery(exercise),
    audioText,
    sentenceParts: sentenceBreakdown(audioText),
    translation: getTranslation(exercise),
  };
}

export function QuizScreen({ entries, exercises, reviewStates, settings, onSettingsChange }: QuizScreenProps) {
  const [initialQuizState] = useState(readPersistedQuizState);
  const [mode, setMode] = useState<QuizMode>(initialQuizState.mode);
  const [questionType, setQuestionType] = useState<QuizTypeFilter>(initialQuizState.questionType);
  const [index, setIndex] = useState(initialQuizState.index);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(initialQuizState.activeExerciseId);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(initialQuizState.selectedChoiceId);
  const [input, setInput] = useState(initialQuizState.input);
  const [feedback, setFeedback] = useState<FeedbackState | undefined>(initialQuizState.feedback);
  const [sessionPlanIds, setSessionPlanIds] = useState<string[]>(initialQuizState.sessionPlanIds);
  const [seenExerciseIds, setSeenExerciseIds] = useState<string[]>(initialQuizState.seenExerciseIds);
  const [variantExercises, setVariantExercises] = useState<VariantExerciseRecord[]>(initialQuizState.variantExercises);
  const [batchStats, setBatchStats] = useState<SessionBatchStats>(initialQuizState.batchStats);
  const [showSessionComplete, setShowSessionComplete] = useState(initialQuizState.showSessionComplete);
  const [sessionSignature, setSessionSignature] = useState(initialQuizState.filterSignature);
  const focusStripRef = useRef<HTMLDivElement | null>(null);
  const previousExerciseId = useRef<string | undefined>(undefined);

  function writePersistedQuizState(patch: Partial<PersistedQuizState> = {}) {
    if (typeof window === "undefined") return;
    const nextState: PersistedQuizState = {
      mode,
      questionType,
      index,
      activeExerciseId,
      selectedChoiceId,
      input,
      feedback,
      sessionPlanIds,
      seenExerciseIds,
      variantExercises,
      filterSignature: sessionSignature,
      batchStats,
      showSessionComplete,
      ...patch,
    };
    window.localStorage.setItem(quizSessionStorageKey, JSON.stringify(nextState));
  }

  const packModeExercises = useMemo(() => {
    const matchingMode = questionType === "all" ? exercises.filter((exercise) => exerciseMatchesMode(exercise, mode)) : exercises;
    const matchingType = matchingMode.filter((exercise) => exerciseMatchesQuestionType(exercise, questionType));
    const focusTags = settings.focusTags ?? [];
    if (focusTags.length === 0) return matchingType;
    const matchingFocus = matchingType.filter((exercise) =>
      exercise.tags.some((tag) => focusTags.includes(tag)),
    );
    const focused = matchingFocus.length > 0 ? matchingFocus : matchingType;
    if (selectedFocusIsVocab(focusTags) && questionType === "all") {
      const vocabOnly = focused.filter(isVocabPracticeExercise);
      return vocabOnly.length > 0 ? vocabOnly : focused;
    }
    if (
      settings.particleCoverage === "core" &&
      focusTags.some((tag) => ["particles", "particle", "e", "do", "buteo", "bakke", "an"].includes(tag))
    ) {
      const coreOnly = focused.filter(isCoreParticleExercise);
      return coreOnly.length > 0 ? coreOnly : focused;
    }
    return focused;
  }, [exercises, mode, questionType, settings.focusTags, settings.particleCoverage]);

  const runtimeVocabExercises = useMemo((): RuntimeVocabExerciseRecord[] => {
    const focusTags = settings.focusTags ?? [];
    const vocabCount = countVocabPracticeExercises(packModeExercises);
    if (!shouldAugmentVocabPool(questionType, selectedFocusIsVocab(focusTags), vocabCount)) return [];
    const existingKeys = new Set(exercises.map((item) => item.dedupeKey));
    return buildRuntimeVocabExercises(entries, existingKeys);
  }, [entries, exercises, packModeExercises, questionType, settings.focusTags]);

  const modeExercises = useMemo(() => {
    if (runtimeVocabExercises.length === 0) return packModeExercises;
    return [...packModeExercises, ...runtimeVocabExercises];
  }, [packModeExercises, runtimeVocabExercises]);
  const exerciseById = useMemo(
    () => new Map<RuntimeExerciseRecord["id"], RuntimeExerciseRecord>([...modeExercises, ...variantExercises].map((candidate) => [candidate.id, candidate])),
    [modeExercises, variantExercises],
  );
  const sessionExercises = useMemo(() => {
    const restored = sessionPlanIds
      .map((id) => exerciseById.get(id))
      .filter((candidate): candidate is RuntimeExerciseRecord => Boolean(candidate));
    return restored;
  }, [exerciseById, sessionPlanIds]);
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
  const currentFilterSignature = useMemo(
    () => filterSignature(mode, questionType, selectedTags),
    [mode, questionType, selectedTags],
  );
  const generatedSimilarExercise = useMemo(() => {
    if (!exercise || !feedback) return undefined;
    return createVariantExercise(exercise, [...sessionPlanIds, ...seenExerciseIds, ...variantExercises.map((variant) => variant.id)]);
  }, [exercise, feedback, seenExerciseIds, sessionPlanIds, variantExercises]);
  const similarExercise = useMemo((): RuntimeExerciseRecord | undefined => {
    if (!exercise || !feedback) return undefined;
    if (generatedSimilarExercise) return generatedSimilarExercise;
    const currentTags = new Set(exercise.tags.filter((tag) => !technicalTags.has(tag)));
    const currentSessionIds = new Set(sessionPlanIds);
    const seenIds = new Set(seenExerciseIds);
    const candidates = modeExercises.filter((candidate) => candidate.id !== exercise.id);
    const scored = candidates
      .map((candidate) => {
        const sharedTagCount = candidate.tags.filter((tag) => currentTags.has(tag)).length;
        const sameType = candidate.type === exercise.type;
        const score =
          (sameType ? 100 : 0) +
          sharedTagCount * 10 +
          (!currentSessionIds.has(candidate.id) ? 5 : 0) +
          (!seenIds.has(candidate.id) ? 3 : 0);
        return { candidate, score, similar: sameType || sharedTagCount > 0 };
      })
      .filter((item) => item.similar)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return left.candidate.id.localeCompare(right.candidate.id);
      });

    return scored[0]?.candidate;
  }, [exercise, feedback, generatedSimilarExercise, modeExercises, seenExerciseIds, sessionPlanIds]);
  const promptAudioText = exercise ? getPromptAudioText(exercise) : undefined;

  function selectFocus(categoryId: PracticeCategoryId) {
    setSessionSignature("");
    setSeenExerciseIds([]);
    setVariantExercises([]);
    setBatchStats(emptyBatchStats());
    setShowSessionComplete(false);
    onSettingsChange({ focusTags: tagsForPracticeCategory(categoryId) });
  }

  function resetInteraction(nextPlanIds: string[]) {
    setIndex(0);
    setActiveExerciseId(nextPlanIds[0] ?? null);
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
  }

  function handleModeChange(nextMode: QuizMode) {
    setMode(nextMode);
    setSeenExerciseIds([]);
    setVariantExercises([]);
    setBatchStats(emptyBatchStats());
    setShowSessionComplete(false);
    setSessionSignature("");
  }

  function handleQuestionTypeChange(nextType: QuizTypeFilter) {
    setQuestionType(nextType);
    setSeenExerciseIds([]);
    setVariantExercises([]);
    setBatchStats(emptyBatchStats());
    setShowSessionComplete(false);
    setSessionSignature("");
  }

  function startNextBatch() {
    const nextSeenIds = addUniqueId(seenExerciseIds, exercise?.id);
    const nextSession = buildSessionPlanIds(mode, modeExercises, reviewStates, nextSeenIds);
    setSeenExerciseIds(nextSession.seenIds);
    setSessionPlanIds(nextSession.planIds);
    setBatchStats(emptyBatchStats());
    setShowSessionComplete(false);
    resetInteraction(nextSession.planIds);
  }

  function startMissedReview() {
    const missedIds = Array.from(new Set(batchStats.incorrectIds)).filter((id) => exerciseById.has(id));
    if (missedIds.length === 0) return;
    const planIds = missedIds.slice(0, sessionSize);
    setBatchStats(emptyBatchStats());
    setShowSessionComplete(false);
    setSessionPlanIds(planIds);
    resetInteraction(planIds);
    setSessionSignature(`${currentFilterSignature}:missed`);
  }

  function openFocusSelectors() {
    setShowSessionComplete(false);
    setFeedback(undefined);
    focusStripRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    if (exercises.length === 0) return;
    if (showSessionComplete) return;

    if (modeExercises.length === 0) {
      setSessionPlanIds([]);
      resetInteraction([]);
      setSeenExerciseIds([]);
      setSessionSignature(currentFilterSignature);
      return;
    }

    const validStoredPlan =
      sessionSignature === currentFilterSignature &&
      sessionPlanIds.length > 0 &&
      sessionPlanIds.some((id) => exerciseById.has(id));

    if (validStoredPlan) return;

    const nextSession = buildSessionPlanIds(mode, modeExercises, reviewStates, seenExerciseIds);
    setSeenExerciseIds(nextSession.seenIds);
    setSessionPlanIds(nextSession.planIds);
    resetInteraction(nextSession.planIds);
    setSessionSignature(currentFilterSignature);
  }, [
    currentFilterSignature,
    exerciseById,
    exercises.length,
    mode,
    modeExercises,
    reviewStates,
    seenExerciseIds,
    sessionPlanIds,
    sessionSignature,
    showSessionComplete,
  ]);

  useLayoutEffect(() => {
    writePersistedQuizState();
  }, [
    activeExerciseId,
    feedback,
    index,
    input,
    mode,
    questionType,
    selectedChoiceId,
    seenExerciseIds,
    sessionPlanIds,
    sessionSignature,
    batchStats,
    showSessionComplete,
  ]);

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
    if (!exercise?.id) return;
    if (!previousExerciseId.current) {
      previousExerciseId.current = exercise.id;
      return;
    }
    if (previousExerciseId.current === exercise.id) return;
    previousExerciseId.current = exercise.id;

    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
    if (settings.autoAudio && promptAudioText) {
      speakKorean(promptAudioText, settings);
    }
  }, [exercise?.id, promptAudioText]);

  async function gradeCurrent(correct: boolean, reason?: string) {
    if (!exercise) return;
    setBatchStats((current) => recordBatchAnswer(current, exercise, correct));
    const cardId = reviewCardId(exercise);
    const existing = (await db.reviewState.get(cardId)) ?? initialReviewState(cardId);
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

    if (exercise && !feedback) {
      setBatchStats((current) => recordBatchSkip(current, exercise));
    }

    const nextSeenIds = addUniqueId(seenExerciseIds, exercise?.id);
    const locatedIndex = sessionExercises.findIndex((candidate) => candidate.id === exercise?.id);
    const safeIndex = locatedIndex >= 0 ? locatedIndex : index;
    const atLastItem = sessionExercises.length > 0 && safeIndex >= sessionExercises.length - 1;
    if (atLastItem) {
      setShowSessionComplete(true);
      setFeedback(undefined);
      setSelectedChoiceId(null);
      setInput("");
      return;
    }

    const nextIndex = safeIndex + 1;
    setSeenExerciseIds(nextSeenIds);
    setIndex(nextIndex);
    setActiveExerciseId(sessionExercises[nextIndex]?.id ?? null);
    setSelectedChoiceId(null);
    setInput("");
    setFeedback(undefined);
  }

  function moveToSimilar() {
    if (!similarExercise) return;
    if ("variantOf" in similarExercise) {
      setVariantExercises((current) =>
        current.some((variant) => variant.id === similarExercise.id) ? current : [...current, similarExercise],
      );
    }
    const nextIndex = sessionExercises.findIndex((candidate) => candidate.id === similarExercise.id);
    const currentIndex = sessionExercises.findIndex((candidate) => candidate.id === exercise?.id);
    if (nextIndex < 0) {
      const replacementIndex = currentIndex >= 0 ? currentIndex : Math.min(index, sessionPlanIds.length - 1);
      const nextPlanIds = [...sessionPlanIds];
      nextPlanIds[Math.max(0, replacementIndex)] = similarExercise.id;
      setSessionPlanIds(nextPlanIds);
      setIndex(Math.max(0, replacementIndex));
    } else {
      setIndex(nextIndex);
    }
    setSeenExerciseIds(addUniqueId(seenExerciseIds, exercise?.id));
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
    const particleSequence =
      exercise.type === "fillBlank" && exercise.answerPresentation !== "sentence"
        ? extractParticleSequence(getModelAnswer(exercise))
        : undefined;
    const accepted =
      "acceptedAnswers" in exercise
        ? {
            strict: particleSequence
              ? Array.from(new Set([...exercise.acceptedAnswers.strict, particleSequence]))
              : exercise.acceptedAnswers.strict,
            relaxed: particleSequence
              ? Array.from(new Set([...exercise.acceptedAnswers.relaxed, particleSequence]))
              : exercise.acceptedAnswers.relaxed,
            regex: exercise.acceptedAnswers.regex,
          }
        : undefined;
    const result = checkAnswer({
      model: getModelAnswer(exercise),
      input,
      strictness: settings.particleStrictness,
      accepted,
      allowModelFragment: exercise.type === "fillBlank" && exercise.answerPresentation !== "sentence",
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
    setBatchStats((current) => recordBatchAnswer(current, exercise, false));
    setFeedback({
      result: "shown",
      ...answerDetails(exercise),
    });
  }

  if (showSessionComplete) {
    return (
      <section className="stack">
        <SessionCompletePanel
          stats={batchStats}
          onContinue={startNextBatch}
          onReviewMissed={startMissedReview}
          onChangeFocus={openFocusSelectors}
        />
      </section>
    );
  }

  if (!exercise) {
    return (
      <section className="stack">
        <ChipTabs label="Session type" items={quizModes} current={mode} onChange={handleModeChange} />
        <ChipTabs
          label="Question type"
          items={questionTypeFilters}
          current={questionType}
          onChange={handleQuestionTypeChange}
        />
        <div className="empty-state">No exercises found for this mode yet.</div>
      </section>
    );
  }

  return (
    <section className="quiz-layout">
      <div className="quiz-focus-strip" aria-label="Practice focus" ref={focusStripRef}>
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
      <ChipTabs label="Session type" items={quizModes} current={mode} onChange={handleModeChange} />
      <ChipTabs
        label="Question type"
        items={questionTypeFilters}
        current={questionType}
        onChange={handleQuestionTypeChange}
      />
      <article className="quiz-card" data-testid="quiz-card" data-exercise-id={exercise.id}>
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
          {promptAudioText ? <AudioButton text={promptAudioText} settings={settings} /> : null}
          {promptAudioText ? (
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.autoAudio}
                onChange={(event) => onSettingsChange({ autoAudio: event.target.checked })}
              />
              Auto audio
            </label>
          ) : null}
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
            <p className="answer-hint">{answerInstruction(exercise)}</p>
            {"tokens" in exercise && exercise.tokens.length > 0 ? (
              <div className="token-bank">
                {exercise.tokens.map((token) => (
                  <button
                    key={token}
                    type="button"
                    className="token"
                    onClick={() =>
                      setInput((current) => {
                        const nextInput = `${current} ${token}`.trim();
                        writePersistedQuizState({ input: nextInput });
                        return nextInput;
                      })
                    }
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
                    onClick={() =>
                      setInput((current) => {
                        const nextInput = `${current} ${chunk}`.trim();
                        writePersistedQuizState({ input: nextInput });
                        return nextInput;
                      })
                    }
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
              onChange={(event) => {
                setInput(event.target.value);
                writePersistedQuizState({ input: event.target.value });
              }}
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
        {"; "}
        Active question type: {questionTypeFilters.find((item) => isActiveQuizType(questionType, item.id))?.label ?? questionType}
      </p>
    </section>
  );
}
