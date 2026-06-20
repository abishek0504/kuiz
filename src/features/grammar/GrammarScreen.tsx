import type { EntryRecord } from "../../db/schema";

type GrammarScreenProps = {
  entries: EntryRecord[];
};

export function GrammarScreen({ entries }: GrammarScreenProps) {
  const grammar = entries.filter((entry) => entry.kind === "grammar");
  const particles = entries.filter((entry) => entry.kind === "particle");

  return (
    <section className="stack">
      <div className="screen-heading">
        <p className="eyebrow">Reference</p>
        <h1>Grammar and particles</h1>
      </div>
      <div className="reference-list">
        {grammar.map((entry) => (
          <article className="reference-item" key={entry.id}>
            <h2>{entry.title}</h2>
            <p className="korean-prompt">{entry.pattern}</p>
            <p>{entry.meaning}</p>
            <ul>
              {entry.formation.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </article>
        ))}
        {particles.map((entry) => (
          <article className="reference-item" key={entry.id}>
            <h2>{entry.form}</h2>
            <p>{entry.meaning}</p>
            <p>{entry.usage}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
