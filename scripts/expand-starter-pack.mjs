import fs from "node:fs";
import path from "node:path";

const packPath = path.resolve("content-packs/starter.core.v1.json");
const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
const sourceId = "kuiz-scenario-expansion";

function hasBatchim(value) {
  const char = [...value].reverse().find((item) => /[가-힣]/u.test(item));
  if (!char) return false;
  return (char.charCodeAt(0) - 0xac00) % 28 !== 0;
}

function subject(value) {
  return hasBatchim(value) ? "이" : "가";
}

function object(value) {
  return hasBatchim(value) ? "을" : "를";
}

function topic(value) {
  return hasBatchim(value) ? "은" : "는";
}

function accepted(model) {
  return { strict: [model], relaxed: [], regex: [] };
}

function addUnique(collection, item) {
  const existingIndex = collection.findIndex((existing) => existing.id === item.id || existing.dedupeKey === item.dedupeKey);
  if (existingIndex >= 0) {
    collection[existingIndex] = item;
    return;
  }
  collection.push(item);
}

pack.pack.version = "1.3.0";
for (const include of ["dialogue", "reading", "listening", "dictation", "ordering", "roleplay", "minimal-pair"]) {
  if (!pack.pack.includes.includes(include)) pack.pack.includes.push(include);
}

if (!pack.sourceRefs.some((source) => source.sourceId === sourceId)) {
  pack.sourceRefs.push({
    sourceId,
    label: "Kuiz scenario and beginner foundation expansion",
    locator: "Generated from the product learning-design handoff",
    inferred: true,
    note: "Adds practical beginner vocab, grammar functions, and scenario tasks for input, output, repair, and fluency.",
  });
}

const vocabGroups = {
  school: [
    ["학교", "school", "noun", "학교에 가요."],
    ["교실", "classroom", "noun", "교실이 조용해요."],
    ["선생님", "teacher", "noun", "선생님이 설명해요."],
    ["학생", "student", "noun", "학생이 질문해요."],
    ["숙제", "homework", "noun", "숙제를 해요."],
    ["시험", "test", "noun", "시험이 있어요."],
    ["질문", "question", "noun", "질문이 있어요."],
    ["대답", "answer", "noun", "대답을 써요."],
    ["책", "book", "noun", "책을 읽어요."],
    ["공책", "notebook", "noun", "공책에 써요."],
    ["연필", "pencil", "noun", "연필로 써요."],
    ["지우개", "eraser", "noun", "지우개가 필요해요."],
  ],
  cafe: [
    ["커피", "coffee", "noun", "커피를 마셔요."],
    ["물", "water", "noun", "물을 주세요."],
    ["차", "tea", "noun", "차가 따뜻해요."],
    ["우유", "milk", "noun", "우유를 마셔요."],
    ["빵", "bread", "noun", "빵을 먹어요."],
    ["케이크", "cake", "noun", "케이크가 달아요."],
    ["메뉴", "menu", "noun", "메뉴를 봐요."],
    ["주문", "order", "noun", "주문을 해요."],
    ["가격", "price", "noun", "가격이 얼마예요?"],
    ["카드", "card", "noun", "카드로 계산해요."],
    ["현금", "cash", "noun", "현금이 없어요."],
    ["영수증", "receipt", "noun", "영수증을 주세요."],
  ],
  family: [
    ["가족", "family", "noun", "가족이 많아요."],
    ["어머니", "mother", "noun", "어머니가 집에 계세요."],
    ["아버지", "father", "noun", "아버지가 일하세요."],
    ["언니", "older sister of a female", "noun", "언니가 전화해요."],
    ["누나", "older sister of a male", "noun", "누나가 와요."],
    ["형", "older brother of a male", "noun", "형이 운동해요."],
    ["오빠", "older brother of a female", "noun", "오빠가 공부해요."],
    ["동생", "younger sibling", "noun", "동생이 어려요."],
    ["할머니", "grandmother", "noun", "할머니를 만나요."],
    ["할아버지", "grandfather", "noun", "할아버지가 웃어요."],
  ],
  transport: [
    ["버스", "bus", "noun", "버스를 타요."],
    ["지하철", "subway", "noun", "지하철로 가요."],
    ["택시", "taxi", "noun", "택시를 불러요."],
    ["역", "station", "noun", "역에서 만나요."],
    ["정류장", "bus stop", "noun", "정류장에 있어요."],
    ["길", "road", "noun", "길이 복잡해요."],
    ["오른쪽", "right side", "noun", "오른쪽으로 가세요."],
    ["왼쪽", "left side", "noun", "왼쪽에 있어요."],
    ["앞", "front", "noun", "앞에 있어요."],
    ["뒤", "back", "noun", "뒤에 있어요."],
  ],
  shopping: [
    ["가게", "store", "noun", "가게에서 사요."],
    ["시장", "market", "noun", "시장에 가요."],
    ["옷", "clothes", "noun", "옷을 사요."],
    ["신발", "shoes", "noun", "신발이 작아요."],
    ["모자", "hat", "noun", "모자를 써요."],
    ["가방", "bag", "noun", "가방이 무거워요."],
    ["돈", "money", "noun", "돈이 필요해요."],
    ["할인", "discount", "noun", "할인이 있어요."],
    ["비싸다", "to be expensive", "adjective", "이 옷은 비싸요."],
    ["싸다", "to be cheap", "adjective", "이 가방은 싸요."],
  ],
  condition: [
    ["날씨", "weather", "noun", "날씨가 좋아요."],
    ["비", "rain", "noun", "비가 와요."],
    ["눈", "snow", "noun", "눈이 와요."],
    ["바람", "wind", "noun", "바람이 불어요."],
    ["덥다", "to be hot", "adjective", "오늘은 더워요."],
    ["춥다", "to be cold", "adjective", "오늘은 추워요."],
    ["아프다", "to be sick", "adjective", "머리가 아파요."],
    ["피곤하다", "to be tired", "adjective", "저는 피곤해요."],
    ["배고프다", "to be hungry", "adjective", "배가 고파요."],
    ["목마르다", "to be thirsty", "adjective", "목이 말라요."],
  ],
  routine: [
    ["아침", "morning", "noun", "아침에 일어나요."],
    ["점심", "lunch", "noun", "점심을 먹어요."],
    ["저녁", "evening; dinner", "noun", "저녁에 쉬어요."],
    ["운동", "exercise", "noun", "운동을 해요."],
    ["음악", "music", "noun", "음악을 들어요."],
    ["영화", "movie", "noun", "영화를 봐요."],
    ["게임", "game", "noun", "게임을 해요."],
    ["요리", "cooking", "noun", "요리를 해요."],
    ["산책", "walk", "noun", "산책을 해요."],
    ["공부", "study", "noun", "공부를 해요."],
    ["일하다", "to work", "verb", "회사에서 일해요."],
    ["쉬다", "to rest", "verb", "집에서 쉬어요."],
    ["자다", "to sleep", "verb", "밤에 자요."],
    ["먹다", "to eat", "verb", "밥을 먹어요."],
    ["마시다", "to drink", "verb", "물을 마셔요."],
    ["읽다", "to read", "verb", "책을 읽어요."],
    ["쓰다", "to write", "verb", "이름을 써요."],
    ["듣다", "to listen", "verb", "음악을 들어요."],
    ["보다", "to see; watch", "verb", "영화를 봐요."],
    ["만들다", "to make", "verb", "김밥을 만들어요."],
  ],
  places: [
    ["집", "home", "noun", "집에 있어요."],
    ["회사", "company; workplace", "noun", "회사에 가요."],
    ["병원", "hospital", "noun", "병원에 가야 해요."],
    ["은행", "bank", "noun", "은행에서 돈을 찾아요."],
    ["우체국", "post office", "noun", "우체국이 어디예요?"],
    ["공원", "park", "noun", "공원에서 걸어요."],
    ["도서관", "library", "noun", "도서관에서 공부해요."],
    ["식당", "restaurant", "noun", "식당에서 밥을 먹어요."],
    ["카페", "cafe", "noun", "카페에서 친구를 만나요."],
    ["화장실", "bathroom", "noun", "화장실이 어디예요?"],
  ],
  classroomCommands: [
    ["지금", "now", "adverb", "지금 공부해요."],
    ["오늘", "today", "adverb", "오늘은 바빠요."],
    ["내일", "tomorrow", "adverb", "내일 만나요."],
    ["어제", "yesterday", "adverb", "어제 공부했어요."],
    ["빨리", "quickly", "adverb", "빨리 오세요."],
    ["천천히", "slowly", "adverb", "천천히 말해 주세요."],
    ["많이", "a lot", "adverb", "많이 먹었어요."],
    ["조금", "a little", "adverb", "조금 쉬어요."],
    ["다시", "again", "adverb", "다시 말해 주세요."],
    ["여기", "here", "adverb", "여기에 앉으세요."],
    ["저기", "there", "adverb", "저기에 있어요."],
    ["들어 주세요", "please listen", "expression", "잘 들어 주세요."],
    ["따라 하세요", "please repeat after me", "expression", "따라 하세요."],
    ["읽어 주세요", "please read", "expression", "문장을 읽어 주세요."],
    ["써 주세요", "please write", "expression", "이름을 써 주세요."],
    ["말해 주세요", "please tell me", "expression", "천천히 말해 주세요."],
  ],
};

for (const [group, items] of Object.entries(vocabGroups)) {
  for (const [ko, en, pos, example] of items) {
    addUnique(pack.vocab, {
      id: `vocab-expansion-${ko.replace(/\s+/g, "-")}`,
      dedupeKey: `vocab:scenario:${ko}`,
      kind: "vocab",
      ko,
      en,
      pos,
      tags: ["vocab", group],
      sourceRefIds: [sourceId],
      inferred: true,
      examples: [{ ko: example, en: "", audioText: example }],
    });
  }
}

const particleEntries = [
  ["particle-expanded-wa-gwa", "와/과", ["와", "과"], "and; with", "Use 와/과 to connect nouns or mark doing something with someone.", ["하고", "랑"], "친구와 공부해요."],
  ["particle-expanded-hago", "하고", ["하고"], "and; with", "하고 is common in speech for connecting nouns or doing something with someone.", ["와/과", "랑"], "커피하고 빵을 주세요."],
  ["particle-expanded-rang", "(이)랑", ["이랑", "랑"], "and; with", "(이)랑 is casual spoken Korean for and/with.", ["와/과", "하고"], "동생이랑 가요."],
  ["particle-expanded-mankeum", "만큼", ["만큼"], "as much as", "만큼 marks an equal comparison.", ["보다"], "저는 친구만큼 먹어요."],
  ["particle-expanded-kke", "께", ["께"], "honorific recipient", "께 is the honorific recipient particle.", ["에게", "한테"], "선생님께 드려요."],
  ["particle-expanded-buro", "(으)로", ["으로", "로"], "means or direction", "Use (으)로 for a tool, route, direction, or method.", ["에", "에서"], "지하철로 가요."],
  ["particle-expanded-eseo-source", "에서", ["에서"], "from a place", "에서 can mark a source when the source is a place.", ["에게서", "한테서"], "한국에서 왔어요."],
  ["particle-expanded-na", "이나/나", ["이나", "나"], "or; about", "이나/나 can mean or, or mark an approximate choice.", ["거나"], "커피나 차를 마셔요."],
  ["particle-expanded-mada", "마다", ["마다"], "every", "마다 attaches to a time or noun to mean every.", ["에"], "아침마다 운동해요."],
  ["particle-expanded-buteo-kaji", "부터...까지", ["부터", "까지"], "from...to", "Use 부터 with a starting point and 까지 with an endpoint.", ["에", "에서"], "아홉 시부터 열 시까지 공부해요."],
];

for (const [id, form, forms, meaning, usage, contrastsWith, example] of particleEntries) {
  addUnique(pack.particles, {
    id,
    dedupeKey: `particle:scenario:${form}`,
    kind: "particle",
    form,
    forms,
    meaning,
    usage,
    contrastsWith,
    tags: ["particles", "particle"],
    sourceRefIds: [sourceId],
    inferred: true,
    examples: [{ ko: example, en: "", audioText: example }],
  });
}

const grammarEntries = [
  ["grammar-expanded-ieyo-yeyo", "이에요/예요", "이에요/예요", "polite noun sentence ending", ["학생이에요.", "친구예요."], ["Do not attach it to verbs."]],
  ["grammar-expanded-present-ayo", "아/어요", "아/어요", "polite present statement or question", ["학교에 가요.", "물을 마셔요."], ["The vowel of the stem decides 아요 or 어요."]],
  ["grammar-expanded-past", "았/었어요", "았/었어요", "polite past", ["어제 공부했어요.", "커피를 마셨어요."], ["Do not use past when the action is happening now."]],
  ["grammar-expanded-future", "(으)ㄹ 거예요", "(으)ㄹ 거예요", "future or intention", ["내일 갈 거예요.", "저녁에 공부할 거예요."], ["Use with an intended future action."]],
  ["grammar-expanded-progressive", "고 있어요", "고 있어요", "action in progress", ["지금 공부하고 있어요.", "친구를 기다리고 있어요."], ["Plain present can sound habitual instead."]],
  ["grammar-expanded-sequential-go", "고", "고", "sequence or additive connector", ["밥을 먹고 공부해요.", "커피를 마시고 가요."], ["고 does not itself mean because."]],
  ["grammar-expanded-jiman", "지만", "지만", "contrast", ["비싸지만 좋아요.", "피곤하지만 공부해요."], ["Use it when the second clause contrasts with the first."]],
  ["grammar-expanded-geuraeseo", "그래서", "그래서", "so; therefore", ["비가 와요. 그래서 집에 있어요.", "배고파요. 그래서 먹어요."], ["그래서 links cause to result."]],
  ["grammar-expanded-geureonikka", "그러니까", "그러니까", "so; therefore; that is why", ["늦었어요. 그러니까 택시를 타요.", "시험이 있어요. 그러니까 공부해요."], ["Often sounds like reasoning or insistence."]],
  ["grammar-expanded-ttaemune", "때문에", "때문에", "because of", ["비 때문에 늦었어요.", "시험 때문에 바빠요."], ["Attach to nouns or clauses with the right form."]],
  ["grammar-expanded-eureo", "(으)러", "(으)러", "purpose of movement", ["커피를 사러 가요.", "친구를 만나러 왔어요."], ["Use with movement verbs like 가다 and 오다."]],
  ["grammar-expanded-aya-haeyo", "아/어야 해요", "아/어야 해요", "must; have to", ["공부해야 해요.", "병원에 가야 해요."], ["This expresses necessity."]],
  ["grammar-expanded-ado-dwaeyo", "아/어도 돼요", "아/어도 돼요", "may; be allowed to", ["앉아도 돼요.", "사진을 찍어도 돼요?"], ["Do not confuse with necessity."]],
  ["grammar-expanded-an", "안", "안 + verb/adjective", "short negation", ["안 가요.", "안 비싸요."], ["안 comes before the verb or adjective."]],
  ["grammar-expanded-mot", "못", "못 + verb", "cannot because unable", ["못 가요.", "한국어를 아직 못 해요."], ["못 is inability, not simple choice."]],
  ["grammar-expanded-juseyo", "주세요", "아/어 주세요", "polite request", ["물 주세요.", "천천히 말해 주세요."], ["Use for asking someone to do something."]],
  ["grammar-expanded-seyo", "(으)세요", "(으)세요", "polite command or honorific", ["앉으세요.", "읽으세요."], ["Can be command or honorific depending on context."]],
  ["grammar-expanded-sipeoyo", "고 싶어요", "고 싶어요", "want to do", ["커피를 마시고 싶어요.", "영화를 보고 싶어요."], ["Use with verbs, not directly with nouns."]],
  ["grammar-expanded-su-isseoyo", "수 있어요/없어요", "수 있어요/없어요", "can or cannot", ["한국어를 읽을 수 있어요.", "오늘 갈 수 없어요."], ["Use before 있어요/없어요."]],
  ["grammar-expanded-subakke", "수밖에 없어요", "수밖에 없어요", "have no choice but to", ["기다릴 수밖에 없어요.", "택시를 탈 수밖에 없어요."], ["밖에 requires a negative expression."]],
  ["grammar-expanded-e-location", "에", "에", "destination, time, or existence location", ["학교에 가요.", "세 시에 만나요."], ["Do not use 에 for where an action happens."]],
  ["grammar-expanded-eseo-action", "에서", "에서", "action location", ["도서관에서 공부해요.", "카페에서 만나요."], ["Use 에 for destination, 에서 for action location."]],
  ["grammar-expanded-hante", "한테/에게", "한테/에게", "recipient", ["친구한테 줘요.", "선생님에게 물어봐요."], ["Do not use 에 for people receiving something."]],
  ["grammar-expanded-hanteseo", "한테서/에게서", "한테서/에게서", "source from a person", ["친구한테서 들었어요.", "선생님에게서 배웠어요."], ["Use 에서 for place sources."]],
  ["grammar-expanded-boda", "보다", "보다", "comparison standard", ["커피보다 차를 좋아해요.", "어제보다 추워요."], ["보다 marks the thing compared against."]],
  ["grammar-expanded-cheoreom", "처럼", "처럼", "like; as if", ["친구처럼 말해요.", "한국 사람처럼 먹어요."], ["처럼 marks similarity."]],
  ["grammar-expanded-mada", "마다", "마다", "every", ["날마다 공부해요.", "아침마다 운동해요."], ["마다 attaches directly to the repeated unit."]],
  ["grammar-expanded-geona", "거나", "거나", "or between verbs/adjectives", ["커피를 마시거나 차를 마셔요.", "집에서 쉬거나 공부해요."], ["Use noun connectors for noun lists."]],
  ["grammar-expanded-eumyeon", "(으)면", "(으)면", "if; when condition", ["시간이 있으면 가요.", "비가 오면 집에 있어요."], ["Use for conditional meaning."]],
  ["grammar-expanded-reason-nikka", "(으)니까", "(으)니까", "because; since", ["늦었으니까 택시를 타요.", "비가 오니까 우산을 써요."], ["Often gives a reason for suggestion or command."]],
];

for (const [id, title, pattern, meaning, examples, pitfalls] of grammarEntries) {
  addUnique(pack.grammar, {
    id,
    dedupeKey: `grammar:scenario:${pattern}:${meaning}`,
    kind: "grammar",
    title,
    pattern,
    meaning,
    formation: [],
    examples: examples.map((ko) => ({ ko, en: "", audioText: ko })),
    pitfalls,
    tags: ["grammar"],
    sourceRefIds: [sourceId],
    inferred: true,
  });
}

const allVocab = Object.entries(vocabGroups).flatMap(([group, items]) =>
  items.map(([ko, en, pos, example]) => ({ ko, en, pos, example, group })),
);

for (const [group, items] of Object.entries(vocabGroups)) {
  const groupItems = items.map(([ko, en]) => ({ ko, en }));
  groupItems.forEach((item, index) => {
    const wrong = [1, 2, 3].map((offset) => groupItems[(index + offset) % groupItems.length]);
    addUnique(pack.exercises, {
      id: `exercise-vocab-expansion-${item.ko.replace(/\s+/g, "-")}`,
      dedupeKey: `exercise:vocab:scenario:${item.ko}`,
      type: "mcq",
      tags: ["mcq", "vocab", group],
      sourceRefIds: [sourceId],
      inferred: true,
      skill: "reception",
      level: "A1",
      prompt: { stem: `Choose the Korean for "${item.en}".`, audioText: item.ko },
      explanation: `${item.ko}${topic(item.ko)} "${item.en}" means.`,
      choiceKind: "phrase-meaning",
      choices: [
        { id: "a", text: wrong[0].ko, isCorrect: false, why: `${wrong[0].ko} means ${wrong[0].en}, not ${item.en}.` },
        { id: "b", text: item.ko, isCorrect: true, why: "Correct." },
        { id: "c", text: wrong[1].ko, isCorrect: false, why: `${wrong[1].ko} means ${wrong[1].en}, not ${item.en}.` },
        { id: "d", text: wrong[2].ko, isCorrect: false, why: `${wrong[2].ko} means ${wrong[2].en}, not ${item.en}.` },
      ],
    });
  });
}

const scenarios = [
  ["cafe", "카페", "아이스 아메리카노 한 잔 주세요.", "아이스 아메리카노 한 잔 주세요.", "아이스 아메리카노 한 잔 줘요.", "커피를 주문해요.", ["food", "vocab", "particles"]],
  ["library", "도서관", "저는 도서관에서 한국어를 공부하고 있어요.", "도서관에서 한국어를 공부하고 있어요.", "저는 도서관에 한국어를 공부하고 있어요.", "도서관에서 공부해요.", ["places", "progressive", "particles"]],
  ["gift", "선물", "친구한테 책을 줘요.", "친구한테 책을 줘요.", "친구에 책을 줘요.", "친구에게 선물을 줘요.", ["hante", "particles"]],
  ["schedule", "일정", "내일 세 시에 친구를 만날 거예요.", "내일 세 시에 친구를 만날 거예요.", "내일 세 시에서 친구를 만날 거예요.", "약속 시간을 말해요.", ["time", "future"]],
  ["directions", "길찾기", "지하철역까지 오른쪽으로 가세요.", "오른쪽으로 가세요.", "오른쪽에 가세요.", "길을 물어봐요.", ["direction", "places"]],
  ["routine", "일과", "아침마다 운동하고 저녁에 쉬어요.", "아침마다 운동해요.", "아침마다 운동해서 저녁에 쉬어요.", "하루 일과를 말해요.", ["routine", "connectors"]],
  ["hobby", "취미", "저는 영화보다 음악을 더 좋아해요.", "음악을 더 좋아해요.", "저는 영화처럼 음악을 더 좋아해요.", "좋아하는 것을 비교해요.", ["comparison", "vocab"]],
  ["permission", "허락", "여기 앉아도 돼요?", "여기 앉아도 돼요?", "여기 앉아야 해요?", "허락을 물어봐요.", ["do-dwaeyo", "grammar"]],
  ["necessity", "필요", "오늘 병원에 가야 해요.", "병원에 가야 해요.", "오늘 병원에 가도 돼요.", "필요한 일을 말해요.", ["necessity", "grammar"]],
  ["shopping", "쇼핑", "이 가방은 비싸지만 좋아요.", "비싸지만 좋아요.", "이 가방은 비싸고 안 좋아요.", "물건에 대해 말해요.", ["shopping", "connectors"]],
  ["weather", "날씨", "비가 오니까 우산을 써요.", "우산을 써요.", "비가 오지만 우산을 써요.", "날씨 때문에 행동을 말해요.", ["weather", "connectors"]],
  ["transport", "교통", "버스로 회사에 가요.", "버스로 회사에 가요.", "버스에 회사로 가요.", "교통수단을 말해요.", ["transport", "direction"]],
  ["classroom", "교실", "천천히 말해 주세요.", "천천히 말해 주세요.", "천천히 말하세요 주세요.", "수업에서 부탁해요.", ["classroomCommands", "juseyo"]],
  ["restaurant", "식당", "물하고 김밥을 주세요.", "물하고 김밥을 주세요.", "물에서 김밥을 주세요.", "음식을 주문해요.", ["food", "hago"]],
  ["bank", "은행", "은행에서 돈을 찾아야 해요.", "돈을 찾아야 해요.", "은행에 돈을 찾아야 해요.", "은행에서 할 일을 말해요.", ["places", "necessity"]],
  ["post-office", "우체국", "우체국에서 편지를 보내고 싶어요.", "편지를 보내고 싶어요.", "우체국에 편지를 보내고 싶어요.", "원하는 일을 말해요.", ["places", "sipeoyo"]],
  ["park", "공원", "공원에서 친구랑 산책해요.", "친구랑 산책해요.", "공원에 친구랑 산책해요.", "함께 하는 활동을 말해요.", ["places", "rang"]],
  ["doctor", "병원", "머리가 아파서 병원에 가요.", "병원에 가요.", "머리가 아프지만 병원에 가요.", "아픈 이유와 행동을 말해요.", ["condition", "connectors"]],
  ["phone", "전화", "친구한테서 전화를 받았어요.", "전화를 받았어요.", "친구한테 전화를 받았어요.", "받은 출처를 말해요.", ["hanteseo", "particles"]],
  ["review", "복습", "어제보다 오늘 더 잘해요.", "오늘 더 잘해요.", "어제처럼 오늘 더 잘해요.", "비교해서 말해요.", ["comparison", "fluency"]],
];

scenarios.forEach(([id, title, sentence, modelLine, incorrect, goal, extraTags], index) => {
  const baseTags = ["mixed", "scenario", ...extraTags];
  addUnique(pack.exercises, {
    id: `exercise-dialogue-${id}`,
    dedupeKey: `exercise:dialogue:${id}`,
    type: "dialogue",
    tags: ["dialogue", ...baseTags],
    sourceRefIds: [sourceId],
    inferred: true,
    skill: "interaction",
    level: "A1",
    scenario: id,
    register: "polite",
    communicativeGoal: goal,
    prompt: { stem: `${title}: type the useful Korean line from the exchange.`, audioText: sentence },
    turns: [
      { speaker: "A", ko: sentence, en: "", audioText: sentence },
      { speaker: "B", ko: "네, 좋아요.", en: "Yes, sounds good.", audioText: "네, 좋아요." },
    ],
    question: "Type the key Korean sentence.",
    acceptedAnswers: accepted(modelLine),
    modelAnswer: modelLine,
    explanation: "This task practices using a sentence from a short interaction, not just recognizing a word.",
  });

  if (index < 10) {
    addUnique(pack.exercises, {
      id: `exercise-reading-${id}`,
      dedupeKey: `exercise:reading:${id}`,
      type: "reading",
      tags: ["reading", ...baseTags],
      sourceRefIds: [sourceId],
      inferred: true,
      skill: "reception",
      level: "A1",
      scenario: id,
      communicativeGoal: goal,
      prompt: { stem: `${title}: read the mini note and answer in Korean.`, audioText: sentence },
      passage: { title: `${title} 메모`, ko: `${sentence} 그래서 괜찮아요.`, en: "" },
      question: "What is the main Korean action or request?",
      acceptedAnswers: accepted(modelLine),
      modelAnswer: modelLine,
      explanation: "Read for the useful action, then answer with the Korean phrase.",
    });

    addUnique(pack.exercises, {
      id: `exercise-listening-${id}`,
      dedupeKey: `exercise:listening:${id}`,
      type: "listening",
      tags: ["listening", ...baseTags],
      sourceRefIds: [sourceId],
      inferred: true,
      skill: "reception",
      level: "A1",
      scenario: id,
      communicativeGoal: goal,
      prompt: { stem: `${title}: listen and type the key Korean phrase.`, audioText: sentence },
      question: "What did you hear?",
      acceptedAnswers: accepted(modelLine),
      modelAnswer: modelLine,
      explanation: "Audio practice uses Korean-only text.",
    });

    addUnique(pack.exercises, {
      id: `exercise-dictation-${id}`,
      dedupeKey: `exercise:dictation:${id}`,
      type: "dictation",
      tags: ["dictation", "listening", ...baseTags],
      sourceRefIds: [sourceId],
      inferred: true,
      skill: "production",
      level: "A1",
      scenario: id,
      communicativeGoal: goal,
      prompt: { stem: `${title}: type the sentence you hear.`, audioText: sentence },
      acceptedAnswers: accepted(sentence),
      modelAnswer: sentence,
      explanation: "Dictation checks Hangul sentence production from Korean audio.",
    });

    addUnique(pack.exercises, {
      id: `exercise-ordering-${id}`,
      dedupeKey: `exercise:ordering:${id}`,
      type: "ordering",
      tags: ["ordering", ...baseTags],
      sourceRefIds: [sourceId],
      inferred: true,
      skill: "production",
      level: "A1",
      scenario: id,
      communicativeGoal: goal,
      prompt: { stem: `${title}: build the Korean sentence.`, audioText: sentence },
      chunks: sentence.replace(/[.?]/gu, "").split(" ").reverse(),
      acceptedAnswers: accepted(sentence),
      modelAnswer: sentence,
      explanation: "Ordering keeps the full Korean sentence shape visible.",
    });

    addUnique(pack.exercises, {
      id: `exercise-correction-${id}`,
      dedupeKey: `exercise:correction:${id}`,
      type: "correction",
      tags: ["correction", ...baseTags],
      sourceRefIds: [sourceId],
      inferred: true,
      skill: "production",
      level: "A1",
      scenario: id,
      communicativeGoal: goal,
      prompt: { stem: `${title}: fix the Korean sentence.`, audioText: sentence },
      incorrect,
      corrected: sentence,
      acceptedAnswers: accepted(sentence),
      explanation: "Repair the particle, connector, or ending that changes the meaning.",
    });

    addUnique(pack.exercises, {
      id: `exercise-roleplay-${id}`,
      dedupeKey: `exercise:roleplay:${id}`,
      type: "roleplay",
      tags: ["roleplay", ...baseTags],
      sourceRefIds: [sourceId],
      inferred: true,
      skill: "interaction",
      level: "A1",
      scenario: id,
      register: "polite",
      communicativeGoal: goal,
      prompt: { stem: `${title}: produce one polite Korean line.`, context: goal, audioText: sentence },
      acceptedAnswers: accepted(modelLine),
      modelAnswer: modelLine,
      rubric: ["Use a complete Korean phrase.", "Keep the polite ending where the model uses it."],
      explanation: "Roleplay asks for a usable line in context.",
    });
  }
});

const minimalPairs = [
  ["eseo-e", "에서 vs 에", "naturalness", "도서관에서 공부해요.", ["도서관에 공부해요.", "도서관에서 공부해요.", "도서관을 공부해요.", "도서관으로 공부해요."], "Action location needs 에서."],
  ["hante-e", "한테 vs 에", "naturalness", "친구한테 책을 줘요.", ["친구에 책을 줘요.", "친구한테 책을 줘요.", "친구에서 책을 줘요.", "친구보다 책을 줘요."], "A person receiving something takes 한테/에게."],
  ["boda-cheoreom", "보다 vs 처럼", "naturalness", "커피보다 차를 좋아해요.", ["커피처럼 차를 좋아해요.", "커피보다 차를 좋아해요.", "커피까지 차를 좋아해요.", "커피부터 차를 좋아해요."], "Comparison standard needs 보다."],
  ["aya-ado", "아/어야 해요 vs 아/어도 돼요", "grammar-form", "공부해야 해요.", ["공부해도 돼요.", "공부해야 해요.", "공부하고 있어요.", "공부하고 싶어요."], "Necessity needs 아/어야 해요."],
  ["go-jiman", "고 vs 지만", "connector", "비싸지만 좋아요.", ["비싸고 좋아요.", "비싸지만 좋아요.", "비싸러 좋아요.", "비싸니까 좋아요."], "Contrast needs 지만."],
];

for (const [id, contrast, choiceKind, correct, choices, why] of minimalPairs) {
  addUnique(pack.exercises, {
    id: `exercise-minimal-pair-${id}`,
    dedupeKey: `exercise:minimal-pair:${id}`,
    type: "minimalPair",
    tags: ["minimalPair", "mixed", "scenario", "particles", "grammar"],
    sourceRefIds: [sourceId],
    inferred: true,
    skill: "languageFocus",
    level: "A1",
    contrast,
    prompt: { stem: `Choose the natural Korean sentence for ${contrast}.`, audioText: correct },
    explanation: why,
    choiceKind,
    choices: choices.map((text, index) => ({
      id: String.fromCharCode(97 + index),
      text,
      isCorrect: text === correct,
      why: text === correct ? "Correct." : why,
    })),
  });
}

fs.writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
