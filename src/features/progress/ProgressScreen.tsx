import type { ExerciseRecord } from "../../db/schema";
import { categoryInsights } from "../../engine/recommendations";
import type { ReviewState } from "../../engine/scheduler";

type ProgressScreenProps = {
  exercises: ExerciseRecord[];
  reviewStates: ReviewState[];
};

export function ProgressScreen({ exercises, reviewStates }: ProgressScreenProps) {
  const now = Date.now();
  const due = reviewStates.filter((state) => state.reps > 0 && new Date(state.dueAt).getTime() <= now).length;
  const reviewed = reviewStates.filter((state) => state.reps > 0).length;
  const lapses = reviewStates.reduce((sum, state) => sum + state.lapses, 0);
  const insights = categoryInsights(exercises, reviewStates)
    .filter((insight) => insight.category.id !== "all" && insight.total > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return (
    <section className="stack">
      <div className="screen-heading">
        <p className="eyebrow">Review state</p>
        <h1>Progress</h1>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <strong>{due}</strong>
          <span>due now</span>
        </div>
        <div className="stat-card">
          <strong>{reviewed}</strong>
          <span>reviewed</span>
        </div>
        <div className="stat-card">
          <strong>{lapses}</strong>
          <span>lapses</span>
        </div>
      </div>
      <section className="plain-section">
        <h2>Deck health</h2>
        <p>
          {reviewStates.length} scheduled cards for {exercises.length} exercises. Cards become due using a simplified
          stability, difficulty, and retrievability scheduler.
        </p>
      </section>
      <section className="plain-section">
        <div className="section-title-row">
          <div>
            <h2>Focus diagnostics</h2>
            <p className="section-help">
              Categories are ranked by due reviews, weak answers, fresh items, and production practice.
            </p>
          </div>
        </div>
        <div className="insight-grid">
          {insights.map((insight) => (
            <article className="insight-card" key={insight.category.id}>
              <h3>{insight.category.label}</h3>
              <div className="metric-row">
                <span>Due</span>
                <strong>{insight.due}</strong>
              </div>
              <div className="metric-row">
                <span>Weak</span>
                <strong>{insight.weak}</strong>
              </div>
              <div className="metric-row">
                <span>New</span>
                <strong>{insight.fresh}</strong>
              </div>
              <div className="metric-row">
                <span>Production</span>
                <strong>{insight.production}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
