export type SentenceBreakdownPart = {
  text: string;
  role: string;
  note: string;
};

const timeWords = new Set([
  "오늘",
  "내일",
  "어제",
  "아침",
  "점심",
  "저녁",
  "밤",
  "오전",
  "오후",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
  "일요일",
]);

function hasHangul(text: string): boolean {
  return /[가-힣]/u.test(text);
}

function stripPunctuation(text: string): string {
  return text.replace(/[.,!?。！？"“”]/gu, "");
}

function isTimeBase(base: string): boolean {
  return timeWords.has(base) || /([0-9영공일이삼사오육칠팔구십백천]+)?(시|분|월|일|요일)$/u.test(base);
}

function isPredicateLike(text: string): boolean {
  return /(요|니다|다|예요|이에요|했어요|해요|가요|와요|있어요|없어요)$/u.test(text);
}

function previousCanJoinTime(previous: string | undefined): boolean {
  return Boolean(previous && !/[은는이가을를에에서부터까지도만]$/u.test(previous));
}

export function sentenceBreakdown(sentence: string): SentenceBreakdownPart[] {
  if (!hasHangul(sentence)) return [];

  const tokens = sentence
    .trim()
    .split(/\s+/u)
    .map(stripPunctuation)
    .filter(Boolean);
  const parts: SentenceBreakdownPart[] = [];
  const consumed = new Set<number>();

  for (let index = 0; index < tokens.length; index += 1) {
    if (consumed.has(index)) continue;
    const token = tokens[index];
    const previous = tokens[index - 1];

    if (token.endsWith("한테서") || token.endsWith("에게서")) {
      parts.push({
        text: token,
        role: "source",
        note: "한테서/에게서 marks the person something comes from.",
      });
    } else if (token.endsWith("에게") || token.endsWith("한테")) {
      parts.push({
        text: token,
        role: "recipient",
        note: "에게/한테 marks the person receiving or being affected by the action.",
      });
    } else if (token.endsWith("에서")) {
      parts.push({
        text: token,
        role: "action place",
        note: "에서 marks where an action happens, not just a static location.",
      });
    } else if (token.endsWith("부터")) {
      parts.push({
        text: token,
        role: "starting point",
        note: "부터 marks where a time or range begins.",
      });
    } else if (token.endsWith("까지")) {
      parts.push({
        text: token,
        role: "endpoint",
        note: "까지 marks where a time, place, or range ends.",
      });
    } else if (token.endsWith("밖에")) {
      parts.push({
        text: token,
        role: "restriction",
        note: "밖에 works with a negative predicate to mean 'nothing but / only'.",
      });
    } else if (token.endsWith("보다")) {
      parts.push({
        text: token,
        role: "comparison standard",
        note: "보다 marks the standard used for comparison.",
      });
    } else if (token.endsWith("만큼")) {
      parts.push({
        text: token,
        role: "equal comparison",
        note: "만큼 means 'as much as' or 'to the same extent as'.",
      });
    } else if (token.endsWith("처럼")) {
      parts.push({
        text: token,
        role: "similarity",
        note: "처럼 means 'like' or 'as if similar to'.",
      });
    } else if (token.endsWith("으로") || token.endsWith("로")) {
      parts.push({
        text: token,
        role: "direction or means",
        note: "(으)로 can mark direction, route, tool, material, or method.",
      });
    } else if (token.endsWith("은") || token.endsWith("는")) {
      parts.push({
        text: token,
        role: "topic",
        note: "은/는 sets the topic or contrast frame for the sentence.",
      });
    } else if (token.endsWith("이") || token.endsWith("가")) {
      parts.push({
        text: token,
        role: "subject",
        note: "이/가 marks the subject or the focused thing being identified.",
      });
    } else if (token.endsWith("을") || token.endsWith("를")) {
      parts.push({
        text: token,
        role: "object",
        note: "을/를 marks the direct object affected by the verb.",
      });
    } else if (token.endsWith("에")) {
      const base = token.slice(0, -1);
      const text = isTimeBase(base) && previousCanJoinTime(previous) ? `${previous} ${token}` : token;
      if (text !== token) consumed.add(index - 1);
      parts.push({
        text,
        role: isTimeBase(base) ? "time" : "destination or location",
        note: isTimeBase(base)
          ? "에 marks the time when the action happens."
          : "에 can mark a destination, existence location, or time depending on the predicate.",
      });
    } else if (token.endsWith("도")) {
      parts.push({
        text: token,
        role: "also/even",
        note: "도 adds 'also', 'too', or sometimes 'even' to the marked word.",
      });
    } else if (token.endsWith("만")) {
      parts.push({
        text: token,
        role: "only",
        note: "만 limits the meaning to 'only' the marked word.",
      });
    } else if (token.endsWith("으러") || token.endsWith("러")) {
      parts.push({
        text: token,
        role: "purpose",
        note: "(으)러 marks the purpose of going or coming.",
      });
    } else if (token.endsWith("고") && token.length > 1) {
      parts.push({
        text: token,
        role: "connector",
        note: "고 connects actions or descriptions in sequence or addition.",
      });
    } else if (index === tokens.length - 1 && isPredicateLike(token)) {
      parts.push({
        text: token,
        role: "predicate",
        note: "The final predicate carries tense, politeness, negation, or sentence ending.",
      });
    }
  }

  return parts;
}
