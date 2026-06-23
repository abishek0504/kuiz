export type PracticeCategoryId = "all" | "vocab" | "numbers" | "grammar" | "particles" | "connectors" | "mixed";

export type PracticeCategory = {
  id: PracticeCategoryId;
  label: string;
  description: string;
  tags: string[];
};

export const practiceCategories: PracticeCategory[] = [
  {
    id: "all",
    label: "All",
    description: "Full deck",
    tags: [],
  },
  {
    id: "vocab",
    label: "Vocab",
    description: "Words and meanings",
    tags: ["vocab", "card"],
  },
  {
    id: "numbers",
    label: "Numbers · time",
    description: "Numbers, dates, and time",
    tags: ["number", "numbers", "sino-numbers", "native-numbers", "time", "dates", "calendar"],
  },
  {
    id: "grammar",
    label: "Grammar",
    description: "Sentence patterns",
    tags: [
      "grammar",
      "progressive",
      "purpose",
      "necessity",
      "conjugation",
      "ayo",
      "describing",
      "date-pattern",
      "time-action",
      "sentence-pattern",
      "sentencebuilder",
      "sentence-builder",
      "correction",
    ],
  },
  {
    id: "particles",
    label: "Particles",
    description: "은/는, 이/가, 에",
    tags: [
      "particles",
      "particle",
      "e",
      "do",
      "boda-particle",
      "bakke",
      "buteo",
      "cheoreom",
      "comparison",
      "direction",
      "do-dwaeyo",
      "an",
    ],
  },
  {
    id: "connectors",
    label: "Connectors",
    description: "그리고, 하지만",
    tags: ["connectors", "connection", "connector", "go", "jiman", "geona", "ani-myeon"],
  },
  {
    id: "mixed",
    label: "Mixed",
    description: "Integrated sentence practice",
    tags: [
      "mixed",
      "sentencebuilder",
      "sentence-builder",
      "correction",
      "time-action",
      "time-and-actions",
      "sentence-pattern",
    ],
  },
];

const tagLabels: Record<string, string> = {
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
  connector: "연결어",
  connectors: "연결어",
  correction: "교정",
  "date-pattern": "날짜 표현",
  dates: "날짜",
  describing: "묘사",
  dialogue: "대화",
  direction: "방향",
  dictation: "받아쓰기",
  do: "도",
  "do-dwaeyo": "도 돼요",
  e: "에",
  eureo: "(으)러",
  fillBlank: "빈칸 채우기",
  food: "음식",
  geona: "거나",
  go: "고",
  grammar: "문법",
  hago: "하고",
  hante: "한테",
  hanteseo: "한테서",
  jiman: "지만",
  listening: "듣기",
  mcq: "객관식",
  minimalPair: "비교 선택",
  mixed: "혼합",
  native: "고유어",
  "native-numbers": "하나·둘·셋",
  necessity: "아/어야 해요",
  number: "숫자",
  numbers: "숫자",
  particle: "조사",
  particles: "조사",
  people: "사람",
  places: "장소",
  progressive: "고 있어요",
  purpose: "(으)러",
  rang: "(이)랑",
  reading: "읽기",
  roleplay: "역할 말하기",
  ordering: "순서 배열",
  scenario: "상황",
  routine: "일과",
  sentenceBuilder: "문장 만들기",
  "sentence-builder": "문장 만들기",
  sentencebuilder: "문장 만들기",
  "sentence-pattern": "문장 패턴",
  "sino-numbers": "일·이·삼",
  sipeoyo: "고 싶어요",
  shopping: "쇼핑",
  subakke: "수밖에",
  time: "시간",
  "time-action": "시간+동작",
  "time-and-actions": "시간+동작",
  transport: "교통",
  vocab: "어휘",
  weather: "날씨",
};

export const coreParticleTags = [
  "particles",
  "particle",
  "e",
  "do",
  "buteo",
  "bakke",
  "an",
] as const;

export function isCoreParticleExercise(exercise: { tags: string[] }): boolean {
  return exercise.tags.some((tag) => coreParticleTags.includes(tag as (typeof coreParticleTags)[number]));
}

export function tagsForPracticeCategory(categoryId: PracticeCategoryId): string[] {
  return [...(practiceCategories.find((category) => category.id === categoryId)?.tags ?? [])];
}

export function categoryMatchesSelectedTags(category: PracticeCategory, selectedTags: string[]): boolean {
  if (category.id === "all") return selectedTags.length === 0;
  if (selectedTags.length === 0) return false;
  return selectedTags.every((tag) => category.tags.includes(tag));
}

export function labelForTag(tag: string): string {
  return tagLabels[tag] ?? "학습 항목";
}
