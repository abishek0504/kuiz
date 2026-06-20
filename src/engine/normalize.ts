import type { Entry } from "../schemas/contentPack";

export function normalizeSpacing(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}

export function normalizeKorean(value: string): string {
  return normalizeSpacing(value).replace(/[.?!。！？]/g, "");
}

export function normalizeEnglish(value: string): string {
  return normalizeSpacing(value).toLowerCase().replace(/[.?!]/g, "");
}

export function fallbackFingerprint(item: Partial<Entry>): string {
  const kind = item.kind ?? "unknown";
  const korean =
    "ko" in item && item.ko
      ? item.ko
      : "form" in item && item.form
        ? item.form
        : "title" in item && item.title
          ? item.title
          : "";
  const english =
    "en" in item && item.en
      ? item.en
      : "meaning" in item && item.meaning
        ? item.meaning
        : "";

  return `${normalizeKorean(korean)}|${kind}|${normalizeEnglish(english)}`;
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function simpleHash(value: unknown): string {
  const input = stableJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
