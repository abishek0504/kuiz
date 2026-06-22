import type { ReactNode } from "react";
import type { EntryRecord } from "../../db/schema";

type GrammarScreenProps = {
  entries: EntryRecord[];
};

export function GrammarScreen({ entries }: GrammarScreenProps) {
  const grammar = entries
    .filter((entry) => entry.kind === "grammar")
    .sort((left, right) => left.title.localeCompare(right.title, "ko"));
  const particles = entries
    .filter((entry) => entry.kind === "particle")
    .sort((left, right) => left.form.localeCompare(right.form, "ko"));

  return (
    <section className="stack">
      <div className="screen-heading">
        <p className="eyebrow">Reference</p>
        <h1>Particles and grammar forms</h1>
        <p>Particles are listed as individual sentence jobs. Mixed sentence building stays in quiz practice.</p>
      </div>
      <ReferenceSection title="조사" subtitle="One particle function per reference card.">
        {particles.map((entry) => (
          <article className="reference-item" key={entry.id}>
            <h2>{entry.form}</h2>
            <p className="reference-meaning">{entry.meaning}</p>
            <p>{entry.usage}</p>
            {entry.examples.length ? (
              <ul>
                {entry.examples.slice(0, 2).map((example) => (
                  <li key={`${entry.id}-${example.ko}`}>{example.ko}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </ReferenceSection>
      <ReferenceSection title="문법 형태" subtitle="Forms and endings, kept separate from sentence-production drills.">
        {grammar.map((entry) => (
          <article className="reference-item" key={entry.id}>
            <h2>{entry.title}</h2>
            <p className="korean-prompt">{entry.pattern}</p>
            <p className="reference-meaning">{entry.meaning}</p>
            {entry.formation.length ? (
              <ul>
                {entry.formation.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            ) : null}
            {entry.examples.length ? (
              <ul>
                {entry.examples.slice(0, 2).map((example) => (
                  <li key={`${entry.id}-${example.ko}`}>{example.ko}</li>
                ))}
              </ul>
            ) : null}
            {entry.pitfalls.length ? <p className="muted-copy">{entry.pitfalls[0]}</p> : null}
          </article>
        ))}
      </ReferenceSection>
    </section>
  );
}

function ReferenceSection({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="reference-section">
      <div className="reference-section-heading">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="reference-list">{children}</div>
    </section>
  );
}
