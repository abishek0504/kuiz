import type { EntryRecord, ExerciseRecord, PackRecord, UserSettings } from "../../db/schema";
import {
  categoryMatchesSelectedTags,
  practiceCategories,
  tagsForPracticeCategory,
  type PracticeCategoryId,
} from "../../engine/practiceCategories";

type HomeScreenProps = {
  packs: PackRecord[];
  entries: EntryRecord[];
  exercises: ExerciseRecord[];
  settings: UserSettings;
  onSettingsChange: (patch: Partial<UserSettings>) => void;
  onStartQuiz: () => void;
};

export function HomeScreen({
  packs,
  entries,
  exercises,
  settings,
  onSettingsChange,
  onStartQuiz,
}: HomeScreenProps) {
  const selectedTags = settings.focusTags ?? [];

  function selectCategory(categoryId: PracticeCategoryId) {
    onSettingsChange({ focusTags: tagsForPracticeCategory(categoryId) });
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
      <section className="plain-section">
        <div className="section-title-row">
          <div>
            <h2>Study focus</h2>
            <p className="section-help">
              Choose the lane you want Kuiz to prioritize. 전체 uses the full deck.
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
