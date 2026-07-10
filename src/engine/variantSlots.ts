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

const subjects: KoreanSlot[] = [
  { role: "subject", korean: "저는", english: "I" },
  { role: "subject", korean: "동생은", english: "My younger sibling" },
  { role: "subject", korean: "친구는", english: "My friend" },
  { role: "subject", korean: "어머니는", english: "My mother" },
];

const times: KoreanSlot[] = [
  { role: "time", korean: "두 시에", english: "at 2 o'clock" },
  { role: "time", korean: "세 시에", english: "at 3 o'clock" },
  { role: "time", korean: "네 시에", english: "at 4 o'clock" },
  { role: "time", korean: "아침에", english: "in the morning" },
  { role: "time", korean: "오후에", english: "in the afternoon" },
];

const places = {
  library: { role: "place", korean: "도서관에서", english: "at the library" } as KoreanSlot,
  cafe: { role: "place", korean: "카페에서", english: "at the cafe" } as KoreanSlot,
  school: { role: "place", korean: "학교에서", english: "at school" } as KoreanSlot,
  home: { role: "place", korean: "집에서", english: "at home" } as KoreanSlot,
  park: { role: "place", korean: "공원에서", english: "at the park" } as KoreanSlot,
  restaurant: { role: "place", korean: "식당에서", english: "at the restaurant" } as KoreanSlot,
  office: { role: "place", korean: "사무실에서", english: "at the office" } as KoreanSlot,
};

type CompatibleAction = {
  object: KoreanSlot;
  predicate: KoreanSlot;
  places: KoreanSlot[];
};

const compatibleActions: CompatibleAction[] = [
  {
    object: { role: "object", korean: "책을", english: "a book" },
    predicate: { role: "predicate", korean: "읽어요", english: "reads" },
    places: [places.library, places.cafe, places.home, places.school],
  },
  {
    object: { role: "object", korean: "커피를", english: "coffee" },
    predicate: { role: "predicate", korean: "마셔요", english: "drinks" },
    places: [places.cafe, places.home, places.restaurant, places.office],
  },
  {
    object: { role: "object", korean: "숙제를", english: "homework" },
    predicate: { role: "predicate", korean: "해요", english: "does" },
    places: [places.library, places.home, places.school, places.cafe],
  },
  {
    object: { role: "object", korean: "친구를", english: "a friend" },
    predicate: { role: "predicate", korean: "만나요", english: "meets" },
    places: [places.cafe, places.school, places.park, places.restaurant],
  },
];

const directions: KoreanSlot[] = [
  { role: "direction", korean: "왼쪽으로", english: "left" },
  { role: "direction", korean: "오른쪽으로", english: "right" },
  { role: "direction", korean: "똑바로", english: "straight" },
];

const endpoints: KoreanSlot[] = [
  { role: "endpoint", korean: "버스 정류장까지", english: "the bus stop" },
  { role: "endpoint", korean: "학교 앞까지", english: "the front of the school" },
  { role: "endpoint", korean: "카페까지", english: "the cafe" },
  { role: "endpoint", korean: "역까지", english: "the station" },
];

const routineTimes = [
  { ko: "저녁마다", en: "Every evening" },
  { ko: "아침마다", en: "Every morning" },
  { ko: "날마다", en: "Every day" },
  { ko: "주말마다", en: "Every weekend" },
];

const routines = [
  { chunks: ["공부하고", "밤에", "쉬어요"], en: "I study and rest at night." },
  { chunks: ["운동하고", "오후에", "일해요"], en: "I exercise and work in the afternoon." },
  { chunks: ["한국어를", "공부하고", "음악을", "들어요"], en: "I study Korean and listen to music." },
  { chunks: ["아침을", "먹고", "학교에", "가요"], en: "I eat breakfast and go to school." },
  { chunks: ["책을", "읽고", "일찍", "자요"], en: "I read a book and go to bed early." },
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
      for (const action of compatibleActions) {
        for (const place of action.places) {
          const slots = [subject, time, place, action.object, action.predicate];
          const korean = composeSentence(slots);
          variants.push({
            family: "place-time-object",
            korean,
            english: `${subject.english} ${action.predicate.english} ${action.object.english} ${place.english} ${time.english}.`,
            chunks: slots.map((slot) => slot.korean),
            incorrect: composeSentence([subject, time, { ...place, korean: place.korean.replace("에서", "에") }, action.object, action.predicate]),
            explanation: "에서 marks where an action happens. 에 marks a destination, existence location, or time.",
            tags: ["particles", "time", "places", "mixed"],
          });
        }
      }
    }
  }
  return uniqueByKorean(variants).slice(0, Math.max(minUnique, variants.length));
}

const rangePoints = [
  { start: "월요일", startEn: "Monday", end: "금요일", endEn: "Friday", verb: "일해요", verbEn: "work" },
  { start: "아침", startEn: "morning", end: "저녁", endEn: "evening", verb: "공부해요", verbEn: "study" },
  { start: "처음", startEn: "the beginning", end: "끝", endEn: "the end", verb: "읽어요", verbEn: "read" },
  { start: "한 시", startEn: "1 o'clock", end: "세 시", endEn: "3 o'clock", verb: "공부해요", verbEn: "study" },
  { start: "두 시", startEn: "2 o'clock", end: "네 시", endEn: "4 o'clock", verb: "일해요", verbEn: "work" },
  { start: "세 시", startEn: "3 o'clock", end: "다섯 시", endEn: "5 o'clock", verb: "운동해요", verbEn: "exercise" },
  { start: "아홉 시", startEn: "9 o'clock", end: "열한 시", endEn: "11 o'clock", verb: "일해요", verbEn: "work" },
  { start: "열 시", startEn: "10 o'clock", end: "열두 시", endEn: "12 o'clock", verb: "공부해요", verbEn: "study" },
  { start: "어제", startEn: "yesterday", end: "오늘", endEn: "today", verb: "기다렸어요", verbEn: "waited" },
  { start: "학교", startEn: "school", end: "집", endEn: "home", verb: "걸어가요", verbEn: "walk" },
  { start: "서울", startEn: "Seoul", end: "부산", endEn: "Busan", verb: "가요", verbEn: "go" },
  { start: "머리", startEn: "my head", end: "발끝", endEn: "my toes", verb: "아파요", verbEn: "hurt" },
];

export function generateTimeRangeVariants(minUnique = 20): GeneratedVariant[] {
  const expanded = [...rangePoints];
  for (const start of ["한 시", "두 시", "세 시", "네 시"]) {
    for (const end of ["다섯 시", "여섯 시", "일곱 시"]) {
      expanded.push({ start, startEn: start, end, endEn: end, verb: "공부해요", verbEn: "study" });
    }
  }
  return uniqueByKorean(
    expanded.map(({ start, startEn, end, endEn, verb, verbEn }) => ({
      family: "time-range",
      korean: `${start}부터 ${end}까지 ${verb}.`,
      english: `I ${verbEn} from ${startEn} to ${endEn}.`,
      chunks: [`${start}부터`, `${end}까지`, verb],
      blankStem: `${start}___ ${end}___ ${verb}.`,
      blankAnswer: "부터 까지",
      incorrect: `${start}에서 ${end}까지 ${verb}.`,
      explanation: "부터 marks the start of a range and 까지 marks its endpoint. A place of departure can instead use 에서.",
      tags: ["particles", "time", "routine", "mixed"],
    })),
  ).slice(0, Math.max(minUnique, expanded.length));
}

export function generateDirectionVariants(minUnique = 12): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  for (const endpoint of endpoints) {
    for (const direction of directions) {
      const korean = `${endpoint.korean} ${direction.korean} 가세요.`;
      const wrongDirection = direction.korean === "똑바로" ? "똑바로에" : direction.korean.replace("으로", "에");
      variants.push({
        family: "directions",
        korean,
        english: `Go ${direction.english} until ${endpoint.english}.`,
        chunks: [endpoint.korean, direction.korean, "가세요"],
        incorrect: `${endpoint.korean} ${wrongDirection} 가세요.`,
        explanation: "(으)로 marks direction, while 에 marks a destination or location.",
        tags: ["direction", "places", "mixed"],
      });
    }
  }
  return uniqueByKorean(variants).slice(0, Math.max(minUnique, variants.length));
}

export function generateRoutineConnectorVariants(minUnique = 12): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  for (const time of routineTimes) {
    for (const routine of routines) {
      const korean = `${time.ko} ${routine.chunks.join(" ")}`;
      variants.push({
        family: "routine-connector",
        korean,
        english: `${time.en}, ${routine.en.charAt(0).toLocaleLowerCase()}${routine.en.slice(1)}`,
        chunks: [time.ko, ...routine.chunks],
        incorrect: `${time.ko} ${routine.chunks.join(" ").replace("고 ", "서 ")}`,
        explanation: "고 connects a simple sequence of actions without adding a cause-and-result meaning.",
        tags: ["routine", "connectors", "mixed"],
      });
    }
  }
  return uniqueByKorean(variants).slice(0, Math.max(minUnique, variants.length));
}

const experienceActions = [
  { modifier: "한국에 간", en: "been to Korea", wrong: "한국에 가는" },
  { modifier: "김치를 먹은", en: "eaten kimchi", wrong: "김치를 먹는" },
  { modifier: "한복을 입은", en: "worn hanbok", wrong: "한복을 입는" },
  { modifier: "사진을 찍은", en: "taken a photo", wrong: "사진을 찍는" },
  { modifier: "한국 노래를 들은", en: "listened to a Korean song", wrong: "한국 노래를 듣은" },
  { modifier: "한국어를 공부한", en: "studied Korean", wrong: "한국어를 공부하는" },
  { modifier: "김치를 만든", en: "made kimchi", wrong: "김치를 만들은" },
  { modifier: "제주도에 가 본", en: "tried visiting Jeju", wrong: "제주도에 가 보는" },
  { modifier: "비행기를 타 본", en: "tried taking a plane", wrong: "비행기를 타 보는" },
  { modifier: "한국 영화를 본", en: "seen a Korean movie", wrong: "한국 영화를 보는" },
];

export function generateExperienceVariants(minUnique = 20): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  for (const action of experienceActions) {
    for (const state of [
      { ko: "있어요", en: "have" },
      { ko: "없어요", en: "have never" },
    ]) {
      const korean = `저는 ${action.modifier} 적이 ${state.ko}.`;
      variants.push({
        family: "experience",
        korean,
        english: `I ${state.en} ${action.en} before.`,
        chunks: ["저는", action.modifier, "적이", state.ko],
        blankStem: `저는 ___ 적이 ${state.ko}.`,
        blankAnswer: action.modifier,
        incorrect: `저는 ${action.wrong} 적이 ${state.ko}.`,
        explanation: "Past experience uses the past modifier -(으)ㄴ before 적이 있어요 or 없어요.",
        tags: ["grammar", "experience", "past", "mixed"],
      });
    }
  }
  return uniqueByKorean(variants).slice(0, Math.max(minUnique, variants.length));
}

const tryActions = [
  { phrase: "김치를 먹어", stem: "김치를 ___ 봤어요.", answer: "먹어", en: "eating kimchi", wrong: "김치를 먹고 봤어요." },
  { phrase: "한국어를 공부해", stem: "한국어를 ___ 봤어요.", answer: "공부해", en: "studying Korean", wrong: "한국어를 공부하고 봤어요." },
  { phrase: "한복을 입어", stem: "한복을 ___ 봤어요.", answer: "입어", en: "wearing hanbok", wrong: "한복을 입고 봤어요." },
  { phrase: "제주도에 가", stem: "제주도에 ___ 봤어요.", answer: "가", en: "going to Jeju", wrong: "제주도에 가고 봤어요." },
  { phrase: "한국 노래를 들어", stem: "한국 노래를 ___ 봤어요.", answer: "들어", en: "listening to a Korean song", wrong: "한국 노래를 듣어 봤어요." },
  { phrase: "김치를 만들어", stem: "김치를 ___ 봤어요.", answer: "만들어", en: "making kimchi", wrong: "김치를 만들아 봤어요." },
  { phrase: "비행기를 타", stem: "비행기를 ___ 봤어요.", answer: "타", en: "taking a plane", wrong: "비행기를 타고 봤어요." },
  { phrase: "사진을 찍어", stem: "사진을 ___ 봤어요.", answer: "찍어", en: "taking a photo", wrong: "사진을 찍고 봤어요." },
];

export function generateTryVariants(minUnique = 8): GeneratedVariant[] {
  return uniqueByKorean(
    tryActions.map((action) => ({
      family: "try",
      korean: `${action.phrase} 봤어요.`,
      english: `I tried ${action.en}.`,
      chunks: [...action.phrase.split(" "), "봤어요"],
      blankStem: action.stem,
      blankAnswer: action.answer,
      incorrect: action.wrong,
      explanation: "-아/어 보다 means to try doing something. In past polite speech, 보다 becomes 봤어요.",
      tags: ["grammar", "experience", "try", "past"],
    })),
  ).slice(0, Math.max(minUnique, tryActions.length));
}

const whenSentences = [
  { condition: "배고플 때", action: "밥을 먹어요", en: "When I am hungry, I eat." },
  { condition: "피곤할 때", action: "커피를 마셔요", en: "When I am tired, I drink coffee." },
  { condition: "시간이 있을 때", action: "영화를 봐요", en: "When I have time, I watch a movie." },
  { condition: "한국어를 공부할 때", action: "단어를 외워요", en: "When I study Korean, I memorize vocabulary." },
  { condition: "밥을 먹을 때", action: "물을 마셔요", en: "When I eat, I drink water." },
  { condition: "커피를 마실 때", action: "책을 읽어요", en: "When I drink coffee, I read." },
  { condition: "학교에 갈 때", action: "버스를 타요", en: "When I go to school, I take the bus." },
  { condition: "어렸을 때", action: "한국 영화를 봤어요", en: "When I was young, I watched Korean movies." },
];

export function generateWhenVariants(minUnique = 8): GeneratedVariant[] {
  return uniqueByKorean(
    whenSentences.map((item) => ({
      family: "when",
      korean: `${item.condition} ${item.action}.`,
      english: item.en,
      chunks: [item.condition, item.action],
      blankStem: `___ ${item.action}.`,
      blankAnswer: item.condition,
      incorrect: `${item.condition.replace(" 때", "에")} ${item.action}.`,
      explanation: "Use -(으)ㄹ 때 with a state or action. Use 에 with a calendar point such as 월요일에.",
      tags: ["grammar", "when", "time", "mixed"],
    })),
  ).slice(0, Math.max(minUnique, whenSentences.length));
}

const intentions = [
  { context: "내년에", phrase: "한국에 가려고", en: "go to Korea next year", wrong: "한국에 갈려고" },
  { context: "오늘 저녁은", phrase: "건강하게 먹으려고", en: "eat healthily tonight", wrong: "건강하게 먹려고" },
  { context: "이번 달부터", phrase: "운동을 더 열심히 하려고", en: "exercise harder starting this month", wrong: "운동을 더 열심히 할려고" },
  { context: "친구 생일 선물을", phrase: "사려고", en: "buy a friend's birthday present", wrong: "살려고" },
  { context: "이번 주말에는 집에서", phrase: "쉬려고", en: "rest at home this weekend", wrong: "쉴려고" },
  { context: "다음 달부터 요리를 좀", phrase: "배우려고", en: "learn some cooking next month", wrong: "배울려고" },
  { context: "주말에 산책하러", phrase: "나가려고", en: "go out for a walk on the weekend", wrong: "나갈려고" },
  { context: "수업 후에 친구를", phrase: "만나려고", en: "meet a friend after class", wrong: "만날려고" },
];

export function generateIntentionVariants(minUnique = 8): GeneratedVariant[] {
  return uniqueByKorean(
    intentions.map((item) => ({
      family: "intention",
      korean: `${item.context} ${item.phrase} 해요.`,
      english: `I intend to ${item.en}.`,
      chunks: [item.context, item.phrase, "해요"],
      blankStem: `${item.context} ___ 해요.`,
      blankAnswer: item.phrase,
      incorrect: `${item.context} ${item.wrong} 해요.`,
      explanation: "-(으)려고 해요 expresses intention or internal planning. It is not the same as a fixed future prediction.",
      tags: ["grammar", "intention", "future", "mixed"],
    })),
  ).slice(0, Math.max(minUnique, intentions.length));
}

const seemingSentences = [
  { korean: "오늘 날씨가 좋은 것 같아요", blank: "좋은", stem: "오늘 날씨가 ___ 것 같아요.", en: "I think the weather is nice today.", wrong: "오늘 날씨가 좋는 것 같아요." },
  { korean: "밖을 보니 비가 오는 것 같아요", blank: "오는", stem: "밖을 보니 비가 ___ 것 같아요.", en: "It looks like it is raining.", wrong: "밖을 보니 비가 온 것 같아요." },
  { korean: "제 친구는 요즘 아주 바쁜 것 같아요", blank: "바쁜", stem: "제 친구는 요즘 아주 ___ 것 같아요.", en: "My friend seems very busy these days.", wrong: "제 친구는 요즘 아주 바쁘는 것 같아요." },
  { korean: "이 옷은 저한테 조금 작은 것 같아요", blank: "작은", stem: "이 옷은 저한테 조금 ___ 것 같아요.", en: "I think these clothes are a little small for me.", wrong: "이 옷은 저한테 조금 작는 것 같아요." },
  { korean: "어제 비가 온 것 같아요", blank: "온", stem: "어제 비가 ___ 것 같아요.", en: "I think it rained yesterday.", wrong: "어제 비가 오는 것 같아요." },
  { korean: "Ace 씨는 한국어를 정말 잘하는 것 같아요", blank: "잘하는", stem: "Ace 씨는 한국어를 정말 ___ 것 같아요.", en: "I think Ace is really good at Korean.", wrong: "Ace 씨는 한국어를 정말 잘한 것 같아요." },
  { korean: "이 식당은 정말 맛있는 것 같아요", blank: "맛있는", stem: "이 식당은 정말 ___ 것 같아요.", en: "I think this restaurant is delicious.", wrong: "이 식당은 정말 맛있하는 것 같아요." },
  { korean: "친구가 많이 피곤한 것 같아요", blank: "피곤한", stem: "친구가 많이 ___ 것 같아요.", en: "My friend seems very tired.", wrong: "친구가 많이 피곤하는 것 같아요." },
];

export function generateSeemingVariants(minUnique = 8): GeneratedVariant[] {
  return uniqueByKorean(
    seemingSentences.map((item) => ({
      family: "seeming",
      korean: `${item.korean}.`,
      english: item.en,
      chunks: item.korean.split(" "),
      blankStem: item.stem,
      blankAnswer: item.blank,
      incorrect: item.wrong,
      explanation: "Descriptive verbs use -(으)ㄴ 것 같아요, present action verbs use -는 것 같아요, and past actions use -(으)ㄴ 것 같아요.",
      tags: ["grammar", "seeming", "naturalness", "mixed"],
    })),
  ).slice(0, Math.max(minUnique, seemingSentences.length));
}

const numberContexts = [
  { korean: "지금 두 시 십오 분이에요", blankStem: "지금 ___이에요.", blankAnswer: "두 시 십오 분", incorrect: "지금 둘 시 열다섯 분이에요.", english: "It is 2:15 now.", explanation: "Hours use contracted Native Korean numbers; minutes use Sino-Korean numbers." },
  { korean: "수업은 오전 아홉 시 삼십 분에 시작해요", blankStem: "수업은 오전 ___에 시작해요.", blankAnswer: "아홉 시 삼십 분", incorrect: "수업은 오전 구 시 서른 분에 시작해요.", english: "Class starts at 9:30 AM.", explanation: "Use Native 아홉 for the hour and Sino 삼십 for the minutes." },
  { korean: "약속은 오후 네 시 사십오 분이에요", blankStem: "약속은 오후 ___이에요.", blankAnswer: "네 시 사십오 분", incorrect: "약속은 오후 넷 시 마흔다섯 분이에요.", english: "The appointment is at 4:45 PM.", explanation: "넷 contracts to 네 before 시, while minutes use Sino 사십오." },
  { korean: "기차는 오전 열한 시 오 분에 출발해요", blankStem: "기차는 오전 ___에 출발해요.", blankAnswer: "열한 시 오 분", incorrect: "기차는 오전 십일 시 다섯 분에 출발해요.", english: "The train leaves at 11:05 AM.", explanation: "Hours use Native 열한 and minutes use Sino 오." },
  { korean: "사과 세 개 주세요", blankStem: "사과 ___ 주세요.", blankAnswer: "세 개", incorrect: "사과 셋 개 주세요.", english: "Please give me three apples.", explanation: "셋 contracts to 세 before the object counter 개." },
  { korean: "학생이 네 명 왔어요", blankStem: "학생이 ___ 왔어요.", blankAnswer: "네 명", incorrect: "학생이 넷 명 왔어요.", english: "Four students came.", explanation: "넷 contracts to 네 before the people counter 명." },
  { korean: "커피 두 잔을 주문했어요", blankStem: "커피 ___을 주문했어요.", blankAnswer: "두 잔", incorrect: "커피 둘 잔을 주문했어요.", english: "I ordered two cups of coffee.", explanation: "둘 contracts to 두 before a counter such as 잔." },
  { korean: "동생은 스무 살이에요", blankStem: "동생은 ___이에요.", blankAnswer: "스무 살", incorrect: "동생은 스물 살이에요.", english: "My younger sibling is twenty years old.", explanation: "스물 contracts to 스무 before the age counter 살." },
  { korean: "제 생일은 유월 이일이에요", blankStem: "제 생일은 ___이에요.", blankAnswer: "유월 이일", incorrect: "제 생일은 육월 두일이에요.", english: "My birthday is June 2.", explanation: "Dates use Sino numbers, and June is pronounced 유월." },
  { korean: "시험은 시월 십일일이에요", blankStem: "시험은 ___이에요.", blankAnswer: "시월 십일일", incorrect: "시험은 십월 열하루예요.", english: "The exam is October 11.", explanation: "Dates use Sino numbers, and October is pronounced 시월." },
  { korean: "오늘은 칠월 사일이에요", blankStem: "오늘은 ___이에요.", blankAnswer: "칠월 사일", incorrect: "오늘은 일곱월 넷일이에요.", english: "Today is July 4.", explanation: "Both the month and day use Sino-Korean numbers." },
  { korean: "크리스마스는 십이월 이십오일이에요", blankStem: "크리스마스는 ___이에요.", blankAnswer: "십이월 이십오일", incorrect: "크리스마스는 열두월 스물다섯일이에요.", english: "Christmas is December 25.", explanation: "Calendar dates use Sino-Korean numbers." },
  { korean: "이 책은 만 이천 원이에요", blankStem: "이 책은 ___이에요.", blankAnswer: "만 이천 원", incorrect: "이 책은 열둘 천 원이에요.", english: "This book costs 12,000 won.", explanation: "Prices use Sino-Korean numbers and large units such as 만 and 천." },
  { korean: "점심은 팔천오백 원이에요", blankStem: "점심은 ___이에요.", blankAnswer: "팔천오백 원", incorrect: "점심은 여덟천다섯백 원이에요.", english: "Lunch costs 8,500 won.", explanation: "Won amounts use Sino 팔천오백, not Native number forms." },
  { korean: "전화번호는 공일공 일이삼사 오육칠팔이에요", blankStem: "전화번호는 ___이에요.", blankAnswer: "공일공 일이삼사 오육칠팔", incorrect: "전화번호는 영하나영 하나둘셋넷 오육칠팔이에요.", english: "The phone number is 010-1234-5678.", explanation: "Phone-number digits are read one by one with Sino forms; zero is often 공." },
  { korean: "오늘은 금요일이에요", blankStem: "오늘은 ___이에요.", blankAnswer: "금요일", incorrect: "오늘은 금월일이에요.", english: "Today is Friday.", explanation: "Weekday names are fixed forms ending in 요일; Friday is 금요일." },
];

export function generateNumberContextVariants(minUnique = 16): GeneratedVariant[] {
  return uniqueByKorean(
    numberContexts.map((item) => ({
      family: "number-context",
      korean: `${item.korean}.`,
      english: item.english,
      chunks: item.korean.split(" "),
      blankStem: item.blankStem,
      blankAnswer: item.blankAnswer,
      incorrect: item.incorrect,
      explanation: item.explanation,
      tags: ["numbers", "counter", "time", "calendar", "mixed"],
    })),
  ).slice(0, Math.max(minUnique, numberContexts.length));
}

export function generatedVariantsForFamily(familyId: string, minUnique = 20): GeneratedVariant[] {
  if (familyId === "place-time-object") return generatePlaceTimeObjectVariants(minUnique);
  if (familyId === "time-range") return generateTimeRangeVariants(minUnique);
  if (familyId === "directions") return generateDirectionVariants(minUnique);
  if (familyId === "routine-connector") return generateRoutineConnectorVariants(minUnique);
  if (familyId === "experience") return generateExperienceVariants(minUnique);
  if (familyId === "try") return generateTryVariants(minUnique);
  if (familyId === "when") return generateWhenVariants(minUnique);
  if (familyId === "intention") return generateIntentionVariants(minUnique);
  if (familyId === "seeming") return generateSeemingVariants(minUnique);
  if (familyId === "number-context") return generateNumberContextVariants(minUnique);
  return [];
}

export function predicateIsFinal(korean: string): boolean {
  const trimmed = korean.trim();
  return /(요|다|세요|까|죠|네)[.!?]?$/u.test(trimmed);
}
