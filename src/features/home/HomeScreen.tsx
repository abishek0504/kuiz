import type { EntryRecord, ExerciseRecord, PackRecord } from "../../db/schema";

type HomeScreenProps = {
  packs: PackRecord[];
  entries: EntryRecord[];
  exercises: ExerciseRecord[];
  onStartQuiz: () => void;
};

export function HomeScreen({ packs, entries, exercises, onStartQuiz }: HomeScreenProps) {
  const tags = Array.from(new Set([...entries, ...exercises].flatMap((item) => item.tags))).slice(0, 10);

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
        <h2>Current focus</h2>
        <div className="tag-wrap">
          {tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </section>
    </section>
  );
}
