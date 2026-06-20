import type { ExerciseRecord } from "../../db/schema";
import type { ReviewState } from "../../engine/scheduler";

type ProgressScreenProps = {
  exercises: ExerciseRecord[];
  reviewStates: ReviewState[];
};

export function ProgressScreen({ exercises, reviewStates }: ProgressScreenProps) {
  const now = Date.now();
  const due = reviewStates.filter((state) => new Date(state.dueAt).getTime() <= now).length;
  const reviewed = reviewStates.filter((state) => state.reps > 0).length;
  const lapses = reviewStates.reduce((sum, state) => sum + state.lapses, 0);

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
    </section>
  );
}
