import type { EntryRecord, ExerciseRecord, PackRecord, UserSettings } from "../../db/schema";
import {
  categoryMatchesSelectedTags,
  practiceCategories,
  tagsForPracticeCategory,
  type PracticeCategoryId,
} from "../../engine/practiceCategories";
import { countVocabPracticeExercises } from "../../engine/vocabPractice";
import { recommendedPractice } from "../../engine/recommendations";
import type { ReviewState } from "../../engine/scheduler";

type HomeScreenProps = {
  packs: PackRecord[];
  entries: EntryRecord[];
  exercises: ExerciseRecord[];
  reviewStates: ReviewState[];
  settings: UserSettings;
  onSettingsChange: (patch: Partial<UserSettings>) => void | Promise<void>;
  onStartQuiz: () => void;
};

const practicePath: Array<{
  phase: string;
  title: string;
  description: string;
  categoryId: PracticeCategoryId;
}> = [
  {
    phase: "Input",
    title: "Read and listen for meaning",
    description: "Start broad so vocab, particles, and grammar appear in real prompts.",
    categoryId: "all",
  },
  {
    phase: "Notice",
    title: "Isolate the form",
    description: "Focus on particles and the job each one performs in the sentence.",
    categoryId: "particles",
  },
  {
    phase: "Produce",
    title: "Build integrated sentences",
    description: "Use mixed practice for sentence building, corrections, and multi-rule sentence production.",
    categoryId: "mixed",
  },
  {
    phase: "Fluency",
    title: "Return to the full deck",
    description: "Interleave known material so review is not just one grammar point at a time.",
    categoryId: "all",
  },
];

export function HomeScreen({
  packs,
  entries,
  exercises,
  reviewStates,
  settings,
  onSettingsChange,
  onStartQuiz,
}: HomeScreenProps) {
  const selectedTags = settings.focusTags ?? [];
  const recommendation = recommendedPractice(exercises, reviewStates);

  function selectCategory(categoryId: PracticeCategoryId) {
    onSettingsChange({ focusTags: tagsForPracticeCategory(categoryId) });
  }

  async function startCategory(categoryId: PracticeCategoryId) {
    await onSettingsChange({ focusTags: tagsForPracticeCategory(categoryId) });
    onStartQuiz();
  }

  function exerciseCountForCategory(categoryId: PracticeCategoryId): number {
    if (categoryId === "vocab") return countVocabPracticeExercises(exercises);
    const tags = tagsForPracticeCategory(categoryId);
    if (tags.length === 0) return exercises.length;
    return exercises.filter((exercise) => exercise.tags.some((tag) => tags.includes(tag))).length;
  }

  return (
    <section className="stack">
      <div className="screen-heading">
        <p className="eyebrow">Local-first Korean practice</p>
        <h1>Study particles, grammar, vocab, and sentence production.</h1>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <strong>{packs.length}</strong>
          <span>packs</span>
        </div>
        <div className="stat-card">
          <strong>{entries.length}</strong>
          <span>entries</span>
        </div>
        <div className="stat-card">
          <strong>{exercises.length}</strong>
          <span>exercises</span>
        </div>
      </div>
      <button type="button" className="primary-button full-width" onClick={onStartQuiz}>
        Start quiz
      </button>
      <section className="recommendation-card" aria-label="Recommended next practice">
        <div>
          <p className="eyebrow">Recommended next</p>
          <h2>{recommendation.title}</h2>
          <p>{recommendation.reason}</p>
        </div>
        <div className="recommendation-metrics">
          <span>{recommendation.insight.due} due</span>
          <span>{recommendation.insight.weak} weak</span>
          <span>{recommendation.insight.production} production</span>
        </div>
        <button
          type="button"
          className="primary-button full-width"
          onClick={() => void startCategory(recommendation.categoryId)}
        >
          Start recommended
        </button>
      </section>
      <section className="plain-section">
        <div className="section-title-row">
          <div>
            <h2>Practice path</h2>
            <p className="section-help">
              A balanced session moves from meaning, to form, to production, then back to fluency.
            </p>
          </div>
        </div>
        <div className="path-grid">
          {practicePath.map((step) => (
            <article className="path-card" key={`${step.phase}-${step.categoryId}`}>
              <span className="path-phase">{step.phase}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <button type="button" className="secondary-button" onClick={() => void startCategory(step.categoryId)}>
                Practice {exerciseCountForCategory(step.categoryId)}
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="plain-section">
        <div className="section-title-row">
          <div>
            <h2>Study focus</h2>
            <p className="section-help">
              Choose the lane you want Kuiz to prioritize. All uses the full deck.
            </p>
          </div>
          {selectedTags.length > 0 ? (
            <button type="button" className="text-button" onClick={() => onSettingsChange({ focusTags: [] })}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="focus-grid category-grid">
          {practiceCategories.map((category) => {
            const active = categoryMatchesSelectedTags(category, selectedTags);
            return (
              <button
                type="button"
                className={active ? "category-button active" : "category-button"}
                aria-pressed={active}
                key={category.id}
                onClick={() => selectCategory(category.id)}
              >
                <span className="category-label">{category.label}</span>
                <span className="category-detail">{category.description}</span>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}
