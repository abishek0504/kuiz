import { AudioButton } from "./AudioButton";
import { NaverLookupLink } from "./NaverLookupLink";
import type { UserSettings } from "../db/schema";
import type { SentenceBreakdownPart } from "../engine/sentenceBreakdown";

export type FeedbackState = {
  result: "correct" | "incorrect" | "shown";
  modelAnswer: string;
  explanation?: string;
  particleNote?: string;
  naturalnessNote?: string;
  sentenceParts?: SentenceBreakdownPart[];
  lookupQuery: string;
  audioText?: string;
};

type StickyFeedbackProps = {
  feedback?: FeedbackState;
  settings: UserSettings;
};

export function StickyFeedback({ feedback, settings }: StickyFeedbackProps) {
  if (!feedback) return null;

  return (
    <section className={`feedback-panel ${feedback.result}`} data-testid="feedback-panel" aria-live="polite">
      <div className="feedback-topline">
        <strong>{feedback.result === "shown" ? "Shown" : feedback.result === "correct" ? "Correct" : "Incorrect"}</strong>
        <NaverLookupLink query={feedback.lookupQuery} />
      </div>
      <p className="model-answer">{feedback.modelAnswer}</p>
      <details className="feedback-details">
        <summary>Why this answer?</summary>
        {feedback.explanation ? <p>{feedback.explanation}</p> : null}
        {feedback.particleNote ? <p className="note">Particle note: {feedback.particleNote}</p> : null}
        {feedback.naturalnessNote ? <p className="note">Naturalness: {feedback.naturalnessNote}</p> : null}
        {feedback.sentenceParts?.length ? (
          <div className="sentence-breakdown">
            <h3>Sentence breakdown</h3>
            <dl>
              {feedback.sentenceParts.map((part) => (
                <div key={`${part.role}-${part.text}`}>
                  <dt>{part.text}</dt>
                  <dd>
                    <strong>{part.role}</strong>
                    <span>{part.note}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </details>
      <AudioButton text={feedback.audioText ?? feedback.modelAnswer} settings={settings} label="Replay" />
    </section>
  );
}
