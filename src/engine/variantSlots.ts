import { normalizeKorean } from "./normalize";

export type SlotRole =
  | "subject"
  | "time"
  | "place"
  | "object"
  | "recipient"
  | "source"
  | "predicate"
  | "direction"
  | "endpoint"
  | "connector";

export type KoreanSlot = {
  role: SlotRole;
  korean: string;
  english: string;
};

export type GeneratedVariant = {
  family: string;
  korean: string;
  english: string;
  chunks: string[];
  blankStem?: string;
  blankAnswer?: string;
  incorrect?: string;
  explanation: string;
  tags: string[];
};

const defaultOrder: SlotRole[] = ["subject", "time", "place", "object", "predicate"];

export function composeSentence(slots: KoreanSlot[], order: SlotRole[] = defaultOrder): string {
  return order
    .map((role) => slots.find((slot) => slot.role === role)?.korean)
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

export function composeEnglish(slots: KoreanSlot[]): string {
  const subject = slots.find((slot) => slot.role === "subject");
  const time = slots.find((slot) => slot.role === "time");
  const place = slots.find((slot) => slot.role === "place");
  const object = slots.find((slot) => slot.role === "object");
  const predicate = slots.find((slot) => slot.role === "predicate");

  if (predicate && object && place && time && subject) {
    return `${subject.english} ${predicate.english} ${object.english} at ${place.english} at ${time.english}.`;
  }
  return slots.map((slot) => slot.english).join(" ");
}

const subjects: KoreanSlot[] = [
  { role: "subject", korean: "저는", english: "I" },
  { role: "subject", korean: "동생은", english: "My younger sibling" },
  { role: "subject", korean: "친구는", english: "My friend" },
  { role: "subject", korean: "어머니는", english: "My mother" },
];

const times: KoreanSlot[] = [
  { role: "time", korean: "세 시에", english: "3 o'clock" },
  { role: "time", korean: "네 시에", english: "4 o'clock" },
  { role: "time", korean: "두 시에", english: "2 o'clock" },
  { role: "time", korean: "아침에", english: "the morning" },
  { role: "time", korean: "오후에", english: "the afternoon" },
];

const places: KoreanSlot[] = [
  { role: "place", korean: "도서관에서", english: "the library" },
  { role: "place", korean: "카페에서", english: "the cafe" },
  { role: "place", korean: "학교에서", english: "school" },
  { role: "place", korean: "집에서", english: "home" },
];

const objects: KoreanSlot[] = [
  { role: "object", korean: "책을", english: "a book" },
  { role: "object", korean: "커피를", english: "coffee" },
  { role: "object", korean: "숙제를", english: "homework" },
  { role: "object", korean: "친구를", english: "a friend" },
];

const predicates: KoreanSlot[] = [
  { role: "predicate", korean: "읽어요", english: "read" },
  { role: "predicate", korean: "마셔요", english: "drink" },
  { role: "predicate", korean: "해요", english: "do" },
  { role: "predicate", korean: "만나요", english: "meet" },
];

const timeRangeStarts = ["월요일", "아홉 시", "아침", "저녁", "월요일"];
const timeRangeEnds = ["금요일", "열한 시", "밤", "밤", "토요일"];

const directions: KoreanSlot[] = [
  { role: "direction", korean: "왼쪽으로", english: "left" },
  { role: "direction", korean: "오른쪽으로", english: "right" },
  { role: "direction", korean: "똑바로", english: "straight" },
];

const endpoints: KoreanSlot[] = [
  { role: "endpoint", korean: "버스 정류장까지", english: "the bus stop" },
  { role: "endpoint", korean: "학교까지", english: "school" },
  { role: "endpoint", korean: "카페까지", english: "the cafe" },
  { role: "endpoint", korean: "역까지", english: "the station" },
];

const routineConnectors: KoreanSlot[] = [
  { role: "connector", korean: "저녁마다", english: "Every evening" },
  { role: "connector", korean: "아침마다", english: "Every morning" },
  { role: "connector", korean: "날마다", english: "Every day" },
];

const routinePredicates: Array<{ chunks: string[]; english: string; incorrect: string; explanation: string }> = [
  {
    chunks: ["공부하고", "밤에", "쉬어요"],
    english: "I study and rest at night.",
    incorrect: "저녁마다 공부해서 밤에 쉬어요.",
    explanation: "고 links actions without adding an unnecessary cause relationship.",
  },
  {
    chunks: ["운동하고", "오후에", "일해요"],
    english: "I exercise and work in the afternoon.",
    incorrect: "아침마다 운동해서 오후에 일해요.",
    explanation: "Use 고 for a simple sequence of routine actions.",
  },
  {
    chunks: ["한국어를", "공부하고", "음악을", "들어요"],
    english: "I study Korean and listen to music.",
    incorrect: "날마다 한국어를 공부해서 음악을 들어요.",
    explanation: "고 connects two actions without implying cause and result.",
  },
];

function uniqueByKorean(variants: GeneratedVariant[]): GeneratedVariant[] {
  const seen = new Set<string>();
  return variants.filter((variant) => {
    const key = normalizeKorean(variant.korean);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function generatePlaceTimeObjectVariants(minUnique = 20): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  for (const subject of subjects) {
    for (const time of times) {
      for (const place of places) {
        for (const object of objects) {
          for (const predicate of predicates) {
            const slots = [subject, time, place, object, predicate];
            const korean = composeSentence(slots);
            const english = `${subject.english} ${predicate.english} ${object.english.replace("을", "").replace("를", "")} at ${place.english.replace("에서", "")} at ${time.english.replace("에", "")}.`;
            const incorrectPlace = place.korean.replace("에서", "에");
            variants.push({
              family: "place-time-object",
              korean,
              english,
              chunks: slots.map((slot) => slot.korean),
              incorrect: composeSentence([subject, time, { ...place, korean: incorrectPlace }, object, predicate]),
              explanation: "에서 marks where the action happens. 에 would sound like destination or existence.",
              tags: ["particles", "time", "places", "mixed"],
            });
          }
        }
      }
    }
  }
  return uniqueByKorean(variants).slice(0, Math.max(minUnique, uniqueByKorean(variants).length));
}

export function generateTimeRangeVariants(minUnique = 20): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  for (let index = 0; index < timeRangeStarts.length; index += 1) {
    const start = timeRangeStarts[index];
    const end = timeRangeEnds[index];
    const korean = `${start}부터 ${end}까지 공부해요.`;
    variants.push({
      family: "time-range",
      korean,
      english: `I study from ${start} to ${end}.`,
      chunks: [`${start}부터`, `${end}까지`, "공부해요"],
      blankStem: `${start}___ ${end}___ 공부해요.`,
      blankAnswer: "부터 까지",
      incorrect: `${start}에서 ${end}까지 공부해요.`,
      explanation: "Time ranges use 부터 for the start and 까지 for the endpoint.",
      tags: ["particles", "time", "routine", "mixed"],
    });
  }
  for (const start of ["아홉 시", "열 시", "한 시"]) {
    for (const end of ["열한 시", "두 시", "세 시"]) {
      const korean = `${start}부터 ${end}까지 일해요.`;
      variants.push({
        family: "time-range",
        korean,
        english: `I work from ${start} to ${end}.`,
        chunks: [`${start}부터`, `${end}까지`, "일해요"],
        blankStem: `${start}___ ${end}___ 일해요.`,
        blankAnswer: "부터 까지",
        incorrect: `${start}에서 ${end}까지 일해요.`,
        explanation: "Use 부터 for the start of the time range and 까지 for the endpoint.",
        tags: ["particles", "time", "routine", "mixed"],
      });
    }
  }
  return uniqueByKorean(variants).slice(0, Math.max(minUnique, uniqueByKorean(variants).length));
}

export function generateDirectionVariants(minUnique = 12): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  for (const direction of directions) {
    for (const endpoint of endpoints) {
      const korean = `${endpoint.korean} ${direction.korean} 가세요.`;
      variants.push({
        family: "directions",
        korean,
        english: `Go ${direction.english} to ${endpoint.english.replace("까지", "")}.`,
        chunks: [endpoint.korean, direction.korean, "가세요"],
        incorrect: `${direction.korean.replace("으로", "에")} 가세요.`,
        explanation: "으로 marks direction, while 에 marks destination or location.",
        tags: ["direction", "places", "mixed"],
      });
    }
  }
  return uniqueByKorean(variants).slice(0, Math.max(minUnique, uniqueByKorean(variants).length));
}

export function generateRoutineConnectorVariants(minUnique = 12): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  for (const connector of routineConnectors) {
    for (const routine of routinePredicates) {
      const korean = `${connector.korean} ${routine.chunks.join(" ")}`;
      variants.push({
        family: "routine-connector",
        korean,
        english: routine.english.replace(/^I /, `${connector.english} `),
        chunks: [connector.korean, ...routine.chunks],
        incorrect: routine.incorrect,
        explanation: routine.explanation,
        tags: ["routine", "connectors", "mixed"],
      });
    }
  }
  return uniqueByKorean(variants).slice(0, Math.max(minUnique, uniqueByKorean(variants).length));
}

export function generatedVariantsForFamily(familyId: string, minUnique = 20): GeneratedVariant[] {
  if (familyId === "place-time-object") return generatePlaceTimeObjectVariants(minUnique);
  if (familyId === "time-range") return generateTimeRangeVariants(minUnique);
  if (familyId === "directions") return generateDirectionVariants(minUnique);
  if (familyId === "routine-connector") return generateRoutineConnectorVariants(minUnique);
  return [];
}

export function predicateIsFinal(korean: string): boolean {
  const trimmed = korean.trim();
  return /(요|다|세요|까|죠|네)[.!?]?$/u.test(trimmed);
}
