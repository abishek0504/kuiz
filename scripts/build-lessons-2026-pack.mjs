import { readFileSync, writeFileSync } from "node:fs";

const starter = JSON.parse(readFileSync(new URL("../content-packs/starter.core.v1.json", import.meta.url), "utf8"));
const existingVocab = new Set(starter.vocab.map((entry) => entry.ko));

const refs = {
  review: "lessons-review-july-2026",
  advanced: "advanced-class-handwritten-june-2026",
  experience: "experience-time-handout-june-2026",
  numbers: "numbers-units-handout-june-2026",
  routine: "visual-routine-handwritten-june-2026",
  pronunciation: "pronunciation-handouts-march-june-2026",
  subakke: "subakke-connectors-handwritten-june-2026",
  particles: "particle-handwritten-corrections-may-2026",
  foundations: "foundation-handwritten-february-march-2026",
};

const sourceRefs = [
  { sourceId: refs.review, label: "Korean Review Worksheet, word bank, and answer key", locator: "Lessons PDF pages 1-33", inferred: false },
  { sourceId: refs.advanced, label: "Advanced Korean Class with Ace, including handwritten corrections", locator: "Lessons PDF pages 35-40", inferred: false },
  { sourceId: refs.experience, label: "Experience and Time lesson", locator: "Lessons PDF pages 42-45", inferred: false },
  { sourceId: refs.numbers, label: "Korean Numbers and Units guide", locator: "Lessons PDF pages 47-51", inferred: false },
  { sourceId: refs.routine, label: "Four-day visual output routine with handwritten answers", locator: "Lessons PDF pages 54-61", inferred: false },
  { sourceId: refs.pronunciation, label: "Pronunciation and tense-consonant notes", locator: "Lessons PDF pages 63-66 and 335-337", inferred: false },
  { sourceId: refs.subakke, label: "Handwritten 수밖에 and connector notes", locator: "Lessons PDF page 68", inferred: false },
  { sourceId: refs.particles, label: "Teacher particle corrections and contrast notes", locator: "Lessons PDF pages 130-131, 219, 221, 224, and 227-230", inferred: false },
  { sourceId: refs.foundations, label: "Early handwritten lesson notes", locator: "Lessons PDF pages 329-343", inferred: false },
];

const slug = (value) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9가-힣]+/gu, "-")
    .replace(/^-|-$/g, "");

const audioExample = (ko, en, note) => ({ ko, en, audioText: ko, ...(note ? { note } : {}) });

const desiredVocab = [
  ["월요일", "Monday", "noun", ["calendar", "weekday"], "월요일에 한국어 수업이 있어요.", "I have Korean class on Monday."],
  ["화요일", "Tuesday", "noun", ["calendar", "weekday"], "화요일에 운동해요.", "I exercise on Tuesday."],
  ["수요일", "Wednesday", "noun", ["calendar", "weekday"], "수요일에 친구를 만나요.", "I meet a friend on Wednesday."],
  ["목요일", "Thursday", "noun", ["calendar", "weekday"], "목요일에 공부해요.", "I study on Thursday."],
  ["금요일", "Friday", "noun", ["calendar", "weekday"], "금요일에 일해요.", "I work on Friday."],
  ["토요일", "Saturday", "noun", ["calendar", "weekday"], "토요일에 쉬어요.", "I rest on Saturday."],
  ["일요일", "Sunday", "noun", ["calendar", "weekday"], "일요일에 집에 있어요.", "I am home on Sunday."],
  ["일월", "January", "noun", ["calendar", "month"], "일월은 겨울이에요.", "January is in winter."],
  ["이월", "February", "noun", ["calendar", "month"], "제 생일은 이월이에요.", "My birthday is in February."],
  ["삼월", "March", "noun", ["calendar", "month"], "삼월에 봄이 시작해요.", "Spring starts in March."],
  ["사월", "April", "noun", ["calendar", "month"], "사월에 여행을 가요.", "I travel in April."],
  ["오월", "May", "noun", ["calendar", "month"], "오월은 따뜻해요.", "May is warm."],
  ["유월", "June", "noun", ["calendar", "month", "irregular-pronunciation"], "유월에 여름이 시작해요.", "Summer starts in June."],
  ["칠월", "July", "noun", ["calendar", "month"], "오늘은 칠월 사일이에요.", "Today is July 4."],
  ["팔월", "August", "noun", ["calendar", "month"], "팔월은 더워요.", "August is hot."],
  ["구월", "September", "noun", ["calendar", "month"], "구월에 학교가 시작해요.", "School starts in September."],
  ["시월", "October", "noun", ["calendar", "month", "irregular-pronunciation"], "시월에는 날씨가 시원해요.", "The weather is cool in October."],
  ["십일월", "November", "noun", ["calendar", "month"], "십일월은 추워요.", "November is cold."],
  ["십이월", "December", "noun", ["calendar", "month"], "크리스마스는 십이월 이십오일이에요.", "Christmas is December 25."],
  ["눈치", "social awareness; ability to read the room", "noun", ["culture", "emotion"], "그 사람은 눈치가 빨라요.", "That person reads the room quickly."],
  ["눈치가 빠르다", "to be quick at reading social cues", "expression", ["culture", "emotion"], "눈치가 빨라서 제 기분을 알아요.", "They read the room and understand how I feel."],
  ["눈치가 없다", "to miss social cues", "expression", ["culture", "emotion"], "분위기가 안 좋은데 농담을 하다니 눈치가 없네요.", "Joking in this mood shows poor social awareness."],
  ["눈치를 보다", "to watch someone's reaction; walk on eggshells", "expression", ["culture", "emotion"], "하루 종일 상사 눈치를 봤어요.", "I watched my boss's reaction all day."],
  ["정", "affection or attachment that grows over time", "noun", ["culture", "emotion"], "이 동네에 정이 들었어요.", "I grew attached to this neighbourhood."],
  ["정이 많다", "to be warm-hearted and affectionate", "expression", ["culture", "emotion"], "알고 보면 정이 많아요.", "Once you know them, they are warm-hearted."],
  ["정이 들다", "to grow attached", "expression", ["culture", "emotion"], "이 지갑에 정이 들어서 버릴 수가 없어요.", "I am attached to this wallet and cannot throw it away."],
  ["답답하다", "to feel frustrated, trapped, or stifled", "adjective", ["emotion"], "한국어로 말이 안 나와서 답답해요.", "I feel frustrated because the Korean words will not come out."],
  ["억울하다", "to feel wronged or unfairly blamed", "adjective", ["emotion"], "제가 혼나서 너무 억울했어요.", "I felt wronged because I was scolded."],
  ["분위기", "atmosphere; mood", "noun", ["culture", "social"], "사무실 분위기가 조용해요.", "The office atmosphere is quiet."],
  ["상사", "workplace superior; boss", "noun", ["work", "people"], "상사가 화가 나 있어요.", "The boss is angry."],
  ["실력", "skill; ability", "noun", ["school", "work"], "제 실력을 다 보여주고 싶어요.", "I want to show all of my ability."],
  ["보여주다", "to show", "verb", ["action"], "사진을 보여 주세요.", "Please show me the photo."],
  ["몇 월 며칠", "what month and day", "expression", ["calendar", "question"], "오늘은 몇 월 며칠이에요?", "What is today's date?"],
  ["전화번호", "phone number", "noun", ["numbers", "daily-life"], "전화번호가 뭐예요?", "What is your phone number?"],
  ["가격", "price", "noun", ["numbers", "shopping"], "가격이 얼마예요?", "How much is it?"],
  ["한 명", "one person", "expression", ["counter", "people", "native-numbers"], "한 명이 왔어요.", "One person came."],
  ["두 명", "two people", "expression", ["counter", "people", "native-numbers"], "두 명이 왔어요.", "Two people came."],
  ["한 개", "one item", "expression", ["counter", "objects", "native-numbers"], "사과 한 개 주세요.", "One apple, please."],
  ["세 개", "three items", "expression", ["counter", "objects", "native-numbers"], "사과 세 개 주세요.", "Three apples, please."],
  ["스무 살", "twenty years old", "expression", ["counter", "age", "native-numbers"], "저는 스무 살이에요.", "I am twenty years old."],
  ["그러므로", "therefore", "adverb", ["connectors", "formal"], "시간이 없어요. 그러므로 지금 가야 해요.", "There is no time. Therefore, we must go now."],
  ["게다가", "in addition; moreover", "adverb", ["connectors"], "친절해요. 게다가 재미있어요.", "They are kind. In addition, they are funny."],
  ["따라가다", "to follow; go along", "verb", ["action", "pronunciation"], "친구를 따라가요.", "I follow my friend."],
  ["짜다", "to be salty", "adjective", ["food", "pronunciation"], "이거 좀 짜요.", "This is a little salty."],
  ["꼭", "surely; 반드시; must", "adverb", ["necessity", "pronunciation"], "꼭 해야 해요.", "You really must do it."],
  ["딱", "exactly; just right", "adverb", ["pronunciation"], "딱 좋아요.", "It is exactly right."],
];

const vocab = desiredVocab
  .filter(([ko]) => !existingVocab.has(ko))
  .map(([ko, en, pos, tags, exampleKo, exampleEn]) => ({
    id: `lesson-vocab-${slug(ko)}`,
    dedupeKey: `vocab:${ko}`,
    kind: "vocab",
    ko,
    en,
    pos,
    tags: ["vocab", ...tags],
    sourceRefIds: tags.includes("pronunciation") ? [refs.pronunciation] : tags.includes("culture") || tags.includes("emotion") ? [refs.advanced, refs.review] : tags.includes("counter") || tags.includes("month") ? [refs.numbers, refs.review] : [refs.review],
    inferred: false,
    examples: [audioExample(exampleKo, exampleEn)],
  }));

const grammar = [
  {
    id: "lesson-grammar-experience",
    dedupeKey: "grammar:past-experience-eun-jeogi-isseoyo",
    kind: "grammar",
    title: "Past experience: -(으)ㄴ 적이 있어요 / 없어요",
    pattern: "V-(으)ㄴ 적이 있어요 / 없어요",
    meaning: "have or have never had the experience of doing something",
    formation: ["Vowel or ㄹ-ending stem + ㄴ 적이 있어요: 가다 → 간 적이 있어요", "Consonant-ending stem + 은 적이 있어요: 먹다 → 먹은 적이 있어요", "ㄷ irregular: 듣다 → 들은 적이 있어요", "Use 없어요 for no past experience."],
    tags: ["grammar", "experience", "past"],
    sourceRefIds: [refs.experience, refs.review],
    inferred: false,
    examples: [audioExample("한국에 간 적이 있어요.", "I have been to Korea."), audioExample("한복을 입은 적이 없어요.", "I have never worn hanbok.")],
    pitfalls: ["Do not place the dictionary form directly before 적.", "This presents a life-history fact, while -아/어 봤어요 emphasizes trying the action."],
  },
  {
    id: "lesson-grammar-try",
    dedupeKey: "grammar:try-a-eo-boda",
    kind: "grammar",
    title: "Trying an action: -아/어 보다",
    pattern: "V-아/어 보다; past polite V-아/어 봤어요",
    meaning: "try doing something to see what it is like",
    formation: ["먹다 → 먹어 봤어요", "공부하다 → 공부해 봤어요", "입다 → 입어 봤어요", "듣다 → 들어 봤어요", "만들다 → 만들어 봤어요"],
    tags: ["grammar", "experience", "try", "past"],
    sourceRefIds: [refs.experience, refs.review],
    inferred: false,
    examples: [audioExample("김치를 먹어 봤어요.", "I tried eating kimchi."), audioExample("한복을 입어 봤어요.", "I tried wearing hanbok.")],
    pitfalls: ["-아/어 봤어요 focuses on the attempt or taste, not only the historical record.", "Do not replace the connective with -고."],
  },
  {
    id: "lesson-grammar-when",
    dedupeKey: "grammar:when-eul-ttae",
    kind: "grammar",
    title: "When or during: -(으)ㄹ 때",
    pattern: "N 때; V/A-(으)ㄹ 때",
    meaning: "when, during, or in the situation that",
    formation: ["Noun + 때 for a period or life stage: 어렸을 때", "Vowel or ㄹ-ending stem + ㄹ 때: 가다 → 갈 때", "Consonant-ending stem + 을 때: 먹다 → 먹을 때", "Use 에 for calendar points: 월요일에, 주말에."],
    tags: ["grammar", "when", "time"],
    sourceRefIds: [refs.experience, refs.review],
    inferred: false,
    examples: [audioExample("배고플 때 밥을 먹어요.", "I eat when I am hungry."), audioExample("월요일에 한국어 수업이 있어요.", "I have Korean class on Monday.", "A calendar point uses 에, not 때.")],
    pitfalls: ["Do not use 때 after a regular weekday as if it were a continuous situation.", "Do not use 에 to attach a verb clause."],
  },
  {
    id: "lesson-grammar-intention",
    dedupeKey: "grammar:intention-euryeogo-haeyo",
    kind: "grammar",
    title: "Intention: -(으)려고 해요",
    pattern: "V-(으)려고 해요",
    meaning: "intend or plan internally to do something",
    formation: ["Vowel or ㄹ-ending stem + 려고 해요: 가다 → 가려고 해요, 만들다 → 만들려고 해요", "Consonant-ending stem + 으려고 해요: 먹다 → 먹으려고 해요", "하다 → 하려고 해요"],
    tags: ["grammar", "intention", "future"],
    sourceRefIds: [refs.advanced, refs.review],
    inferred: false,
    examples: [audioExample("내년에 한국에 가려고 해요.", "I intend to go to Korea next year."), audioExample("이번 주말에는 집에서 쉬려고 해요.", "I intend to rest at home this weekend.")],
    pitfalls: ["This emphasizes intention, not a fixed prediction.", "Do not use the future modifier -ㄹ before 려고."],
  },
  {
    id: "lesson-grammar-seeming",
    dedupeKey: "grammar:seeming-geot-gatayo",
    kind: "grammar",
    title: "Soft opinion or appearance: 것 같아요",
    pattern: "A-(으)ㄴ 것 같아요; V-는 것 같아요; past V-(으)ㄴ 것 같아요",
    meaning: "I think, it seems, or it looks like",
    formation: ["Present descriptive verb + -(으)ㄴ: 좋다 → 좋은 것 같아요", "Present action verb + -는: 오다 → 오는 것 같아요", "Past action + -(으)ㄴ: 오다 → 온 것 같아요", "잘하다 is an action verb: 잘하는 것 같아요."],
    tags: ["grammar", "seeming", "naturalness"],
    sourceRefIds: [refs.advanced, refs.review],
    inferred: false,
    examples: [audioExample("오늘 날씨가 좋은 것 같아요.", "I think the weather is nice today."), audioExample("밖을 보니 비가 오는 것 같아요.", "It looks like it is raining."), audioExample("어제 비가 온 것 같아요.", "I think it rained yesterday.")],
    pitfalls: ["Do not use -는 with a descriptive verb.", "Keep present observation and past inference distinct.", "Korean often uses this form to sound less blunt even when the speaker feels sure."],
  },
  {
    id: "lesson-grammar-number-systems",
    dedupeKey: "grammar:native-sino-number-systems-and-counters",
    kind: "grammar",
    title: "Native and Sino-Korean number systems",
    pattern: "Native + 살/개/명/시; Sino + 원/월/일/분/phone digits",
    meaning: "choose the number system based on the following counter or context",
    formation: ["Native numbers for age, people, objects, and hours.", "Sino-Korean numbers for prices, dates, phone numbers, and minutes.", "Before counters: 하나→한, 둘→두, 셋→세, 넷→네, 스물→스무."],
    tags: ["grammar", "numbers", "counter", "native-numbers", "sino-numbers"],
    sourceRefIds: [refs.numbers, refs.review],
    inferred: false,
    examples: [audioExample("사과 세 개 주세요.", "Three apples, please."), audioExample("지금 오후 두 시 십오 분이에요.", "It is 2:15 PM."), audioExample("만 원이에요.", "It is 10,000 won.")],
    pitfalls: ["Hours are Native Korean, but minutes are Sino-Korean.", "Do not say 하나 시, 둘 명, or 스물 살."],
  },
  {
    id: "lesson-grammar-calendar-months",
    dedupeKey: "grammar:calendar-month-day-and-irregular-months",
    kind: "grammar",
    title: "Calendar dates and irregular month names",
    pattern: "Sino number + 월 + Sino number + 일",
    meaning: "state months and days of the month",
    formation: ["June is 유월, not 육월.", "October is 시월, not 십월.", "Ask 오늘은 몇 월 며칠이에요?"],
    tags: ["grammar", "calendar", "dates", "months"],
    sourceRefIds: [refs.numbers, refs.review],
    inferred: false,
    examples: [audioExample("오늘은 칠월 사일이에요.", "Today is July 4."), audioExample("제 생일은 이월 칠일이에요.", "My birthday is February 7.")],
    pitfalls: ["Use 유월 and 시월 for natural pronunciation."],
  },
  {
    id: "lesson-grammar-pronunciation-contrast",
    dedupeKey: "grammar:plain-aspirated-tense-consonants",
    kind: "grammar",
    title: "Plain, aspirated, and tense consonants",
    pattern: "ㄱ/ㅋ/ㄲ, ㄷ/ㅌ/ㄸ, ㅂ/ㅍ/ㅃ, ㅈ/ㅊ/ㅉ, ㅅ/ㅆ",
    meaning: "distinguish consonants by aspiration and muscle tension",
    formation: ["Plain consonants are relaxed.", "Aspirated consonants release a strong burst of air.", "Tense consonants use tight, controlled pressure with very little air.", "Accuracy and physical tension matter more than speed or loudness."],
    tags: ["grammar", "pronunciation", "minimal-pair"],
    sourceRefIds: [refs.pronunciation],
    inferred: false,
    examples: [audioExample("발이 아파요.", "My foot hurts."), audioExample("빨리 와요.", "Come quickly."), audioExample("딱 좋아요.", "It is exactly right."), audioExample("이거 좀 짜요.", "This is a little salty.")],
    pitfalls: ["Tense does not mean louder.", "Do not add a large puff of air to a tense consonant."],
  },
];

const accepted = (...strict) => ({ strict, relaxed: strict, regex: [] });
const base = (id, type, tags, sourceRefIds, prompt, extra = {}) => ({
  id: `lesson-${id}`,
  dedupeKey: `exercise:lesson-2026:${id}`,
  type,
  tags,
  sourceRefIds,
  inferred: false,
  prompt,
  level: "A1",
  ...extra,
});

const choices = (wrong1, correct, wrong2, wrong3) => [
  { id: "a", text: wrong1[0], isCorrect: false, why: wrong1[1] },
  { id: "b", text: correct[0], isCorrect: true, why: `Correct: ${correct[1]}` },
  { id: "c", text: wrong2[0], isCorrect: false, why: wrong2[1] },
  { id: "d", text: wrong3[0], isCorrect: false, why: wrong3[1] },
];

const exercises = [
  base("experience-form-mcq", "mcq", ["grammar", "experience", "past", "mcq"], [refs.experience], { stem: "Choose the correctly formed past-experience sentence." }, { choiceKind: "grammar-form", choices: choices(["한국에 가는 적이 있어요.", "-는 describes a present action, not a completed experience."], ["한국에 간 적이 있어요.", "가다 becomes 간 before 적."], ["한국에 가은 적이 있어요.", "A vowel-ending stem takes -ㄴ, not -은."], ["한국에 갈 적이 있어요.", "-ㄹ points forward and does not form this past-experience pattern."]), explanation: "Use the past modifier -(으)ㄴ before 적이 있어요." }),
  base("experience-listen-blank", "fillBlank", ["grammar", "experience", "past", "fillBlank"], [refs.review], { stem: "한국 노래를 ___ 적이 있어요.", audioText: "한국 노래를 들은 적이 있어요.", stemEn: "I have listened to a Korean song before." }, { answerPresentation: "word", acceptedAnswers: accepted("들은", "한국 노래를 들은 적이 있어요"), modelAnswer: "들은", explanation: "듣다 is ㄷ-irregular before a vowel, so it becomes 들은." }),
  base("experience-fix", "correction", ["grammar", "experience", "past", "correction"], [refs.experience], { stem: "Fix the experience sentence.", stemEn: "I have made kimchi before." }, { incorrect: "김치를 만들은 적이 있어요.", corrected: "김치를 만든 적이 있어요.", acceptedAnswers: accepted("김치를 만든 적이 있어요"), explanation: "만들다 has a ㄹ-ending stem, so use 만든, not 만들은." }),
  base("experience-build", "sentenceBuilder", ["grammar", "experience", "past", "sentence-builder"], [refs.review], { stem: "Build: I have worn hanbok before.", stemEn: "I have worn hanbok before." }, { tokens: ["저는", "한복을", "입은", "적이", "있어요"], targetMeaning: "I have worn hanbok before.", acceptedAnswers: accepted("저는 한복을 입은 적이 있어요", "한복을 입은 적이 있어요"), modelAnswer: "저는 한복을 입은 적이 있어요", explanation: "입다 takes -은 before 적이 있어요." }),
  base("experience-roleplay", "roleplay", ["grammar", "experience", "interaction", "roleplay"], [refs.experience], { stem: "Answer the question in Korean.", context: "A friend asks whether you have ever been to Korea.", stemKo: "한국에 간 적이 있어요?" }, { acceptedAnswers: accepted("네, 한국에 간 적이 있어요", "아니요, 한국에 간 적이 없어요"), modelAnswer: "네, 한국에 간 적이 있어요", explanation: "Use 있어요 for experience and 없어요 for no experience." }),

  base("try-vs-history-mcq", "mcq", ["grammar", "experience", "try", "mcq"], [refs.experience], { stem: "You are emphasizing the attempt and taste. What fits best?", stemKo: "김치를 ___" }, { choiceKind: "grammar-form", choices: choices(["먹은 적이 있어요", "This presents a historical fact rather than focusing on trying it."], ["먹어 봤어요", "This emphasizes trying kimchi to see what it is like."], ["먹을 때예요", "This means it is a time to eat."], ["먹으려고 해요", "This expresses a future intention." ]), explanation: "-아/어 봤어요 focuses on trying an action." }),
  base("try-fill", "fillBlank", ["grammar", "experience", "try", "fillBlank"], [refs.review], { stem: "한국 노래를 ___ 봤어요.", audioText: "한국 노래를 들어 봤어요.", stemEn: "I tried listening to a Korean song." }, { answerPresentation: "word", acceptedAnswers: accepted("들어", "한국 노래를 들어 봤어요"), modelAnswer: "들어", explanation: "듣다 becomes 들어 before 보다." }),
  base("try-fix", "correction", ["grammar", "experience", "try", "correction"], [refs.review], { stem: "Fix the sentence about trying an action." }, { incorrect: "김치를 먹고 봤어요.", corrected: "김치를 먹어 봤어요.", acceptedAnswers: accepted("김치를 먹어 봤어요"), explanation: "The try construction is -아/어 보다, not -고 보다." }),
  base("try-order", "ordering", ["grammar", "experience", "try", "ordering"], [refs.review], { stem: "Put the chunks in a natural order.", stemEn: "I tried taking a plane." }, { chunks: ["저는", "비행기를", "타", "봤어요"], acceptedAnswers: accepted("저는 비행기를 타 봤어요", "비행기를 타 봤어요"), modelAnswer: "저는 비행기를 타 봤어요", explanation: "타다 becomes 타 봤어요." }),

  base("when-calendar-mcq", "mcq", ["grammar", "when", "time", "mcq"], [refs.experience, refs.review], { stem: "Choose the natural pair for a calendar day and an action situation." }, { choiceKind: "grammar-form", choices: choices(["월요일 때 / 공부할 에", "These endings are reversed."], ["월요일에 / 공부할 때", "A calendar point takes 에, while a verb clause takes 때."], ["월요일에서 / 공부할 때", "에서 marks an action place or source, not a weekday."], ["월요일에 / 공부해서", "-아서 gives a cause or sequence, not simply when." ]), explanation: "Use 월요일에 but 공부할 때." }),
  base("when-fill", "fillBlank", ["grammar", "when", "time", "fillBlank"], [refs.review], { stem: "학교에 ___ 버스를 타요.", audioText: "학교에 갈 때 버스를 타요.", stemEn: "When I go to school, I take the bus." }, { answerPresentation: "phrase", acceptedAnswers: accepted("갈 때", "학교에 갈 때 버스를 타요"), modelAnswer: "갈 때", explanation: "가다 becomes 갈 때." }),
  base("when-fix", "correction", ["grammar", "when", "time", "correction"], [refs.experience], { stem: "Fix the time expression." }, { incorrect: "월요일 때 한국어 수업이 있어요.", corrected: "월요일에 한국어 수업이 있어요.", acceptedAnswers: accepted("월요일에 한국어 수업이 있어요"), explanation: "Regular calendar points use 에." }),
  base("when-build", "sentenceBuilder", ["grammar", "when", "time", "sentence-builder"], [refs.review], { stem: "Build: When I am tired, I drink coffee.", stemEn: "When I am tired, I drink coffee." }, { tokens: ["피곤할", "때", "커피를", "마셔요"], targetMeaning: "When I am tired, I drink coffee.", acceptedAnswers: accepted("피곤할 때 커피를 마셔요"), modelAnswer: "피곤할 때 커피를 마셔요", explanation: "피곤하다 becomes 피곤할 때." }),

  base("intention-mcq", "mcq", ["grammar", "intention", "future", "mcq"], [refs.advanced], { stem: "Choose the sentence that emphasizes an internal plan." }, { choiceKind: "grammar-form", choices: choices(["내년에 한국에 갈 거예요.", "This is a future statement and does not emphasize internal planning as strongly."], ["내년에 한국에 가려고 해요.", "-(으)려고 해요 emphasizes intention."], ["내년에 한국에 간 적이 있어요.", "This describes a past experience."], ["내년에 한국에 가는 것 같아요.", "This gives an impression or opinion." ]), explanation: "Use -(으)려고 해요 for intention." }),
  base("intention-fill", "fillBlank", ["grammar", "intention", "future", "fillBlank"], [refs.review], { stem: "오늘 저녁은 건강하게 ___ 해요.", audioText: "오늘 저녁은 건강하게 먹으려고 해요.", stemEn: "I intend to eat healthily tonight." }, { answerPresentation: "phrase", acceptedAnswers: accepted("먹으려고", "오늘 저녁은 건강하게 먹으려고 해요"), modelAnswer: "먹으려고", explanation: "먹다 ends in a consonant, so use 먹으려고." }),
  base("intention-fix", "correction", ["grammar", "intention", "future", "correction"], [refs.advanced], { stem: "Fix the intention form." }, { incorrect: "이번 주말에는 집에서 쉴려고 해요.", corrected: "이번 주말에는 집에서 쉬려고 해요.", acceptedAnswers: accepted("이번 주말에는 집에서 쉬려고 해요"), explanation: "쉬다 has a vowel-ending stem: 쉬려고 해요." }),
  base("intention-dialogue", "dialogue", ["grammar", "intention", "interaction", "dialogue"], [refs.advanced], { stem: "Read the exchange and answer with the planned action." }, { turns: [{ speaker: "A", ko: "오늘 수업이 끝나고 뭐 하려고 해요?", en: "What do you intend to do after class?", audioText: "오늘 수업이 끝나고 뭐 하려고 해요?" }, { speaker: "B", ko: "친구를 만나려고 해요.", en: "I intend to meet a friend.", audioText: "친구를 만나려고 해요." }], question: "B는 뭐 하려고 해요?", acceptedAnswers: accepted("친구를 만나려고 해요"), modelAnswer: "친구를 만나려고 해요", explanation: "The answer repeats the intended action." }),

  base("seeming-form-mcq", "mcq", ["grammar", "seeming", "naturalness", "mcq"], [refs.advanced], { stem: "Choose the correctly formed present observation." }, { choiceKind: "grammar-form", choices: choices(["비가 온 것 같아요.", "This normally points to a past event: it seems it rained."], ["비가 오는 것 같아요.", "A present action verb takes -는 것 같아요."], ["비가 오은 것 같아요.", "오다 does not take -은 in this present observation."], ["비가 올 때 같아요.", "This combines unrelated time and similarity forms." ]), explanation: "Present action: 오는 것 같아요. Past inference: 온 것 같아요." }),
  base("seeming-adjective-fill", "fillBlank", ["grammar", "seeming", "naturalness", "fillBlank"], [refs.review], { stem: "이 옷은 저한테 조금 ___ 것 같아요.", audioText: "이 옷은 저한테 조금 작은 것 같아요.", stemEn: "I think these clothes are a little small for me." }, { answerPresentation: "word", acceptedAnswers: accepted("작은", "이 옷은 저한테 조금 작은 것 같아요"), modelAnswer: "작은", explanation: "A present descriptive verb uses -(으)ㄴ: 작다 → 작은." }),
  base("seeming-action-fix", "correction", ["grammar", "seeming", "naturalness", "correction"], [refs.advanced], { stem: "Fix the handwritten lesson example." }, { incorrect: "Ace 씨는 한국어를 정말 잘한 것 같아요.", corrected: "Ace 씨는 한국어를 정말 잘하는 것 같아요.", acceptedAnswers: accepted("Ace 씨는 한국어를 정말 잘하는 것 같아요"), explanation: "잘하다 is an action verb here, so the present form is 잘하는 것 같아요." }),
  base("seeming-listen", "listening", ["grammar", "seeming", "listening"], [refs.review], { stem: "Listen and type the Korean sentence.", audioText: "어제 비가 온 것 같아요.", stemEn: "I think it rained yesterday." }, { question: "What did you hear?", acceptedAnswers: accepted("어제 비가 온 것 같아요"), modelAnswer: "어제 비가 온 것 같아요", explanation: "Past action 오다 becomes 온 것 같아요." }),

  base("counter-context-mcq", "mcq", ["numbers", "counter", "native-numbers", "sino-numbers", "mcq"], [refs.numbers], { stem: "Which line uses the correct number systems for 2:15?" }, { choiceKind: "grammar-form", choices: choices(["이 시 열다섯 분", "The hour incorrectly uses Sino 이."], ["두 시 십오 분", "Hours use Native 두 and minutes use Sino 십오."], ["둘 시 십오 분", "둘 contracts to 두 before 시."], ["두 시 열다섯 분", "Minutes use Sino 십오, not Native 열다섯." ]), explanation: "Hours are Native Korean; minutes are Sino-Korean." }),
  base("counter-object-mcq", "mcq", ["numbers", "counter", "native-numbers", "shopping", "mcq"], [refs.numbers], { stem: "Ask for three apples naturally." }, { choiceKind: "grammar-form", choices: choices(["사과 삼 개 주세요.", "개 normally takes Native Korean numbers."], ["사과 세 개 주세요.", "셋 contracts to 세 before 개."], ["사과 셋 개 주세요.", "셋 must contract before a counter."], ["사과 세 명 주세요.", "명 counts people, not objects." ]), explanation: "Use 세 개 for three items." }),
  base("counter-age-fix", "correction", ["numbers", "counter", "native-numbers", "correction"], [refs.numbers], { stem: "Fix the age expression." }, { incorrect: "저는 스물 살이에요.", corrected: "저는 스무 살이에요.", acceptedAnswers: accepted("저는 스무 살이에요"), explanation: "스물 contracts to 스무 before the counter 살." }),
  base("counter-time-fix", "correction", ["numbers", "time", "native-numbers", "sino-numbers", "correction"], [refs.numbers], { stem: "Fix the time expression." }, { incorrect: "지금 오후 둘 시 열다섯 분이에요.", corrected: "지금 오후 두 시 십오 분이에요.", acceptedAnswers: accepted("지금 오후 두 시 십오 분이에요"), explanation: "Use contracted Native 두 for hours and Sino 십오 for minutes." }),
  base("calendar-irregular-mcq", "mcq", ["calendar", "dates", "months", "mcq"], [refs.numbers, refs.review], { stem: "Choose the natural names for June and October." }, { choiceKind: "grammar-form", choices: choices(["육월 / 십월", "Both keep a final consonant that is dropped in these month names."], ["유월 / 시월", "June is 유월 and October is 시월."], ["유월 / 십일월", "십일월 is November, not October."], ["오월 / 구월", "These are May and September." ]), explanation: "The irregular month names are 유월 and 시월." }),
  base("calendar-date-fill", "fillBlank", ["calendar", "dates", "fillBlank"], [refs.review], { stem: "오늘은 ___월 ___일이에요.", audioText: "오늘은 칠월 사일이에요.", stemEn: "Today is July 4." }, { answerPresentation: "phrase", acceptedAnswers: accepted("칠 사", "칠월 사일", "오늘은 칠월 사일이에요"), modelAnswer: "칠 사", explanation: "Dates use Sino-Korean numbers with 월 and 일." }),
  base("calendar-question-fix", "correction", ["calendar", "dates", "correction"], [refs.review], { stem: "Fix the date question." }, { incorrect: "몇 월 몇 일이에요?", corrected: "몇 월 며칠이에요?", acceptedAnswers: accepted("몇 월 며칠이에요"), explanation: "The natural question is 몇 월 며칠이에요?" }),
  base("time-dialogue", "dialogue", ["numbers", "time", "dialogue", "interaction"], [refs.routine, refs.review], { stem: "Read the exchange and answer with the exact time." }, { turns: [{ speaker: "A", ko: "지금 몇 시 몇 분이에요?", en: "What time is it now?", audioText: "지금 몇 시 몇 분이에요?" }, { speaker: "B", ko: "지금 오후 세 시 십오 분이에요.", en: "It is 3:15 PM.", audioText: "지금 오후 세 시 십오 분이에요." }], question: "지금 몇 시예요?", acceptedAnswers: accepted("오후 세 시 십오 분이에요", "지금 오후 세 시 십오 분이에요"), modelAnswer: "지금 오후 세 시 십오 분이에요", explanation: "세 시 is the Native hour and 십오 분 is the Sino minute." }),
  base("shopping-dialogue", "dialogue", ["numbers", "counter", "shopping", "dialogue"], [refs.numbers], { stem: "Read the shop exchange and give the requested quantity." }, { turns: [{ speaker: "A", ko: "사과 몇 개 드릴까요?", en: "How many apples would you like?", audioText: "사과 몇 개 드릴까요?" }, { speaker: "B", ko: "세 개 주세요.", en: "Three, please.", audioText: "세 개 주세요." }], question: "사과를 몇 개 달라고 했어요?", acceptedAnswers: accepted("세 개 주세요", "세 개"), modelAnswer: "세 개 주세요", explanation: "Use the contracted Native form 세 before 개." }),

  base("particle-topic-subject-object-mcq", "mcq", ["particles", "contrast", "mcq"], [refs.particles], { stem: "Complete the contrast: There is rice, but no kimchi.", stemKo: "밥___ 있어요, 김치___ 없어요." }, { choiceKind: "grammar-form", choices: choices(["이 / 를", "를 would mark an action target, but nothing is acting on kimchi."], ["은 / 는", "은/는 sets up the explicit contrast between rice and kimchi."], ["을 / 를", "Object particles do not mark simple existence."], ["이 / 가", "이/가 is possible for neutral existence, but it does not express the intended contrast as clearly." ]), explanation: "Contrast uses 밥은 있어요, 김치는 없어요." }),
  base("particle-existence-action-fill", "fillBlank", ["particles", "contrast", "fillBlank"], [refs.particles], { stem: "밥___ 있어요. 밥___ 먹어요.", audioText: "밥이 있어요. 밥을 먹어요.", stemEn: "There is rice. I eat rice." }, { answerPresentation: "particle", acceptedAnswers: accepted("이 을", "밥이 있어요 밥을 먹어요"), modelAnswer: "이 을", explanation: "이 marks neutral existence; 을 marks the thing receiving the action." }),
  base("particle-e-eseo-fix", "correction", ["particles", "places", "correction"], [refs.particles], { stem: "Fix the action-place particle." }, { incorrect: "저는 집에 한국어를 공부해요.", corrected: "저는 집에서 한국어를 공부해요.", acceptedAnswers: accepted("저는 집에서 한국어를 공부해요"), explanation: "공부하다 is an action, so the action place takes 에서." }),
  base("particle-time-place-mixed", "fillBlank", ["particles", "time", "places", "mixed", "fillBlank"], [refs.review], { stem: "저는 주말___ 오후 두 시___ 카페___ 친구___ 만나요.", audioText: "저는 주말에 오후 두 시에 카페에서 친구를 만나요.", stemEn: "On the weekend at 2 PM, I meet a friend at a cafe." }, { answerPresentation: "particle", acceptedAnswers: accepted("에 에 에서 를", "저는 주말에 오후 두 시에 카페에서 친구를 만나요"), modelAnswer: "에 에 에서 를", explanation: "Time points take 에, an action place takes 에서, and the person met takes 를." }),
  base("particle-recipient-source-mcq", "mcq", ["particles", "hante", "recipient", "source", "mcq"], [refs.particles], { stem: "Choose the pair that clearly marks a recipient and then a source." }, { choiceKind: "grammar-form", choices: choices(["에게서 / 에게", "These reverse source and recipient."], ["에게 / 에게서", "에게 marks the recipient; 에게서 clearly marks the person something came from."], ["에서 / 한테", "에서 is not used for a person in this contrast."], ["께서 / 께", "께서 is an honorific subject marker, not a source marker." ]), explanation: "친구에게 선물을 줘요, 친구에게서 편지를 받아요." }),
  base("particle-honorific-fix", "correction", ["particles", "honorific", "correction"], [refs.particles], { stem: "Fix the honorific recipient marker." }, { incorrect: "선생님한테 편지를 드렸어요.", corrected: "선생님께 편지를 드렸어요.", acceptedAnswers: accepted("선생님께 편지를 드렸어요"), explanation: "께 is the respectful recipient marker and matches 드렸어요." }),
  base("particle-direction-rieul", "mcq", ["particles", "direction", "mcq"], [refs.particles], { stem: "Which form follows the ㄹ-final noun 길?" }, { choiceKind: "particle", choices: choices(["길으로", "ㄹ-final nouns are the exception and do not take 으로."], ["길로", "After a ㄹ-final noun, use 로."], ["길에로", "Do not stack 에 and 로 here."], ["길에서", "에서 marks an action place or source, not direction along a route." ]), explanation: "받침 ㄹ is the exception: 길로." }),

  base("culture-lunchbox-mcq", "mcq", ["culture", "emotion", "scenario", "mcq"], [refs.advanced], { stem: "A manager blames you for food you did not throw away. Which reaction fits?" }, { choiceKind: "naturalness", choices: choices(["정이 들었어요.", "This means you grew attached."], ["너무 억울해요.", "억울하다 expresses being wrongly blamed or treated unfairly."], ["눈치가 빨라요.", "This means someone reads social cues quickly."], ["답답하지 않아요.", "This denies frustration and misses the injustice." ]), explanation: "Use 억울하다 for the burning feeling of being unfairly blamed." }),
  base("culture-office-mcq", "mcq", ["culture", "emotion", "scenario", "mcq"], [refs.advanced], { stem: "The office is tense and quiet, but someone enters singing loudly. Which description fits?" }, { choiceKind: "naturalness", choices: choices(["정이 많아요.", "This describes warmth or affection."], ["눈치가 없어요.", "The person is missing the mood and social cues."], ["억울해요.", "No one is being wrongly blamed in this situation."], ["눈치를 봐요.", "This would mean carefully watching reactions, which the person is not doing." ]), explanation: "눈치가 없다 means failing to read the room." }),
  base("culture-attachment-fill", "fillBlank", ["culture", "emotion", "fillBlank"], [refs.review], { stem: "이 오래된 가방은 ___ 들어서 버릴 수가 없어요.", audioText: "이 오래된 가방은 정이 들어서 버릴 수가 없어요.", stemEn: "I have grown attached to this old bag, so I cannot throw it away." }, { answerPresentation: "phrase", acceptedAnswers: accepted("정이", "정이 들어서", "이 오래된 가방은 정이 들어서 버릴 수가 없어요"), modelAnswer: "정이", explanation: "정이 들다 means to grow attached over time." }),
  base("culture-frustration-roleplay", "roleplay", ["culture", "emotion", "interaction", "roleplay"], [refs.advanced], { stem: "Respond naturally in Korean.", context: "You know what you want to say, but the Korean words will not come out." }, { acceptedAnswers: accepted("한국어로 말이 안 나와서 너무 답답해요", "정말 답답해요"), modelAnswer: "한국어로 말이 안 나와서 너무 답답해요", explanation: "답답하다 can describe psychological frustration or feeling trapped." }),

  base("pronunciation-tense-mcq", "minimalPair", ["pronunciation", "minimal-pair", "mcq"], [refs.pronunciation], { stem: "Which word begins with the tense ㅉ sound and means salty?" }, { contrast: "ㅈ / ㅊ / ㅉ", choiceKind: "naturalness", choices: choices(["자요", "자요 begins with plain ㅈ and means sleeps."], ["짜요", "짜요 begins with tense ㅉ and means salty."], ["차요", "차요 begins with aspirated ㅊ and has a different meaning."], ["싸요", "싸요 begins with tense ㅆ and means cheap." ]), explanation: "ㅉ is a tight tense consonant with little extra air." }),
  base("pronunciation-pp-mcq", "minimalPair", ["pronunciation", "minimal-pair", "mcq"], [refs.pronunciation], { stem: "Which syllable starts with tense ㅃ?" }, { contrast: "ㅂ / ㅍ / ㅃ", choiceKind: "naturalness", choices: choices(["분", "분 begins with plain ㅂ."], ["뿔", "뿔 begins with tense ㅃ."], ["풀", "풀 begins with aspirated ㅍ."], ["불", "불 begins with plain ㅂ." ]), explanation: "Tense ㅃ uses firm lip pressure and very little air." }),
  base("pronunciation-dictation", "dictation", ["pronunciation", "listening", "dictation"], [refs.pronunciation], { stem: "Listen for the tense consonant and type the sentence.", audioText: "이거 좀 짜요.", stemEn: "This is a little salty." }, { acceptedAnswers: accepted("이거 좀 짜요"), modelAnswer: "이거 좀 짜요", explanation: "짜요 starts with tense ㅉ." }),
  base("pronunciation-order", "ordering", ["pronunciation", "ordering", "fluency"], [refs.pronunciation], { stem: "Put the chunks in order, then read the result slowly." }, { chunks: ["오늘", "날씨가", "따뜻해요"], acceptedAnswers: accepted("오늘 날씨가 따뜻해요"), modelAnswer: "오늘 날씨가 따뜻해요", explanation: "Read accurately and keep the tense ㄸ controlled rather than loud." }),

  base("subakke-connectors-order", "ordering", ["grammar", "necessity", "connectors", "ordering"], [refs.subakke], { stem: "Put the consequence sentence in order.", stemEn: "The road is slippery, so I have no choice but to wear skates." }, { chunks: ["길이", "미끄러워서", "스케이트를", "신을", "수밖에", "없어요"], acceptedAnswers: accepted("길이 미끄러워서 스케이트를 신을 수밖에 없어요"), modelAnswer: "길이 미끄러워서 스케이트를 신을 수밖에 없어요", explanation: "-아서 gives the reason; -(으)ㄹ 수밖에 없어요 says there is no other choice." }),
  base("connectors-formal-mcq", "mcq", ["connectors", "register", "mcq"], [refs.subakke], { stem: "Which connector is the more formal equivalent of therefore?" }, { choiceKind: "connector", choices: choices(["하지만", "하지만 means but."], ["그러므로", "그러므로 means therefore in a formal style."], ["게다가", "게다가 means in addition."], ["그리고", "그리고 means and or and then." ]), explanation: "그러므로 is a formal therefore connector." }),

  base("foundation-present-past-fix", "correction", ["grammar", "conjugation", "past", "correction"], [refs.foundations], { stem: "Fix the past polite form of 만들다." }, { incorrect: "어제 차를 만들아요.", corrected: "어제 차를 만들었어요.", acceptedAnswers: accepted("어제 차를 만들었어요"), explanation: "만들다 becomes 만들었어요 in the polite past." }),
].filter(Boolean);

const pack = {
  schema: "kuiz-pack@1",
  pack: {
    packId: "lessons.2026.review.v1",
    version: "1.0.0",
    title: "2026 Lesson Notes, Handwriting, and Review",
    locale: "en-CA",
    createdAt: "2026-07-10",
    appMinVersion: "1.0.0",
    includes: ["vocab", "grammar", "particles", "numbers", "time", "calendar", "experience", "pronunciation", "culture", "mixed"],
  },
  sourceRefs,
  vocab,
  particles: [],
  grammar,
  distractorGroups: [],
  exercises,
};

writeFileSync(new URL("../content-packs/lessons.2026.review.v1.json", import.meta.url), `${JSON.stringify(pack, null, 2)}\n`);
console.log(`Wrote ${pack.pack.packId}: ${vocab.length} vocab, ${grammar.length} grammar, ${exercises.length} exercises.`);
