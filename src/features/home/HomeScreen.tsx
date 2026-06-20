import type { EntryRecord, ExerciseRecord, PackRecord, UserSettings } from "../../db/schema";

type HomeScreenProps = {
  packs: PackRecord[];
  entries: EntryRecord[];
  exercises: ExerciseRecord[];
  settings: UserSettings;
  onSettingsChange: (patch: Partial<UserSettings>) => void;
  onStartQuiz: () => void;
};

const preferredTags = [
  "particles",
  "vocab",
  "grammar",
  "number",
  "numbers",
  "sino-numbers",
  "native-numbers",
  "time",
  "dates",
  "routine",
  "progressive",
  "purpose",
  "necessity",
  "sentencebuilder",
  "correction",
];

const focusTagLabels: Record<string, string> = {
  particles: "조사",
  vocab: "어휘",
  grammar: "문법",
  number: "숫자",
  numbers: "숫자",
  "sino-numbers": "일·이·삼",
  "native-numbers": "하나·둘·셋",
  time: "시간",
  dates: "날짜",
  routine: "일과",
  progressive: "고 있어요",
  purpose: "(으)러",
  necessity: "아/어야 해요",
  sentencebuilder: "문장 만들기",
  "sentence-builder": "문장 만들기",
  correction: "교정",
  an: "안",
  animals: "동물",
  ayo: "아/어/여요",
  bakke: "밖에",
  "boda-particle": "보다",
  buteo: "부터",
  calendar: "달력",
  card: "뜻 카드",
  cheoreom: "처럼",
  comparison: "비교",
  conjugation: "활용",
  connection: "연결",
  connectors: "연결어",
  "date-pattern": "날짜 표현",
  describing: "묘사",
  direction: "방향",
  do: "도",
  "do-dwaeyo": "도 돼요",
  e: "에",
};

function focusTagLabel(tag: string): string {
  return focusTagLabels[tag] ?? tag;
}

export function HomeScreen({
  packs,
  entries,
  exercises,
  settings,
  onSettingsChange,
  onStartQuiz,
}: HomeScreenProps) {
  const allTags = Array.from(new Set([...entries, ...exercises].flatMap((item) => item.tags))).sort();
  const visibleTags = [
    ...preferredTags.filter((tag) => allTags.includes(tag)),
    ...allTags.filter((tag) => !preferredTags.includes(tag)).slice(0, 24),
  ].slice(0, 32);
  const selectedTags = settings.focusTags ?? [];

  function toggleFocus(tag: string) {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((item) => item !== tag)
      : [...selectedTags, tag];
    onSettingsChange({ focusTags: next });
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
              Choose the topics you want Quiz to prioritize. Leave all off for the full deck.
            </p>
          </div>
          {selectedTags.length > 0 ? (
            <button type="button" className="text-button" onClick={() => onSettingsChange({ focusTags: [] })}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="tag-wrap focus-grid">
          {visibleTags.map((tag) => (
            <button
              type="button"
              className={selectedTags.includes(tag) ? "tag-button active" : "tag-button"}
              aria-pressed={selectedTags.includes(tag)}
              key={tag}
              title={`Focus tag: ${tag}`}
              onClick={() => toggleFocus(tag)}
            >
              {focusTagLabel(tag)}
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
