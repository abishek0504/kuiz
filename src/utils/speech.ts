import type { UserSettings } from "../db/schema";

export type VoiceOption = {
  name: string;
  lang: string;
  voiceURI: string;
};

export function koreanOnly(text: string): string {
  const koreanSegments = text.match(/[가-힣ㄱ-ㅎㅏ-ㅣ0-9\s.,?!]+/gu);
  return koreanSegments?.join(" ").replace(/\s+/g, " ").trim() || text;
}

export function getVoices(): VoiceOption[] {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices().map((voice) => ({
    name: voice.name,
    lang: voice.lang,
    voiceURI: voice.voiceURI,
  }));
}

export function chooseKoreanVoice(settings: UserSettings): SpeechSynthesisVoice | undefined {
  if (!("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const selected = settings.voiceURI ? voices.find((voice) => voice.voiceURI === settings.voiceURI) : undefined;
  return selected ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("ko")) ?? voices[0];
}

export function speakKorean(text: string | undefined, settings: UserSettings): void {
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(koreanOnly(text));
  utterance.lang = "ko-KR";
  utterance.rate = settings.speechRate;
  const voice = chooseKoreanVoice(settings);
  if (voice) {
    utterance.voice = voice;
  }
  window.speechSynthesis.speak(utterance);
}
