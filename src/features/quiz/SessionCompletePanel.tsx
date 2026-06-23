import type { SessionBatchStats } from "../../engine/sessionStats";
import { missedReviewSummary, strongestAndWeakestLanes } from "../../engine/sessionStats";

type SessionCompletePanelProps = {
  stats: SessionBatchStats;
  onContinue: () => void;
  onReviewMissed: () => void;
  onChangeFocus: () => void;
};

export function SessionCompletePanel({ stats, onContinue, onReviewMissed, onChangeFocus }: SessionCompletePanelProps) {
  const lanes = strongestAndWeakestLanes(stats);
  const hasMisses = stats.incorrectIds.length > 0;

  return (
    <section className="session-complete-panel" data-testid="session-complete-panel" aria-live="polite">
      <h2>Session complete</h2>
      <dl className="session-complete-stats">
        <div>
          <dt>Answered</dt>
          <dd>{stats.answered}</dd>
        </div>
        <div>
          <dt>Correct</dt>
          <dd>{stats.correct}</dd>
        </div>
        <div>
          <dt>Review</dt>
          <dd>{missedReviewSummary(stats)}</dd>
        </div>
        {lanes.strongest ? (
          <div>
            <dt>Strongest lane</dt>
            <dd>{lanes.strongest}</dd>
          </div>
        ) : null}
        {lanes.weakest ? (
          <div>
            <dt>Weakest lane</dt>
            <dd>{lanes.weakest}</dd>
          </div>
        ) : null}
      </dl>
      <div className="session-complete-actions">
        <button type="button" className="primary-button" onClick={onContinue}>
          Continue next 10
        </button>
        <button type="button" className="secondary-button" onClick={onReviewMissed} disabled={!hasMisses}>
          Review missed
        </button>
        <button type="button" className="secondary-button" onClick={onChangeFocus}>
          Change focus/type
        </button>
      </div>
    </section>
  );
}
