import { describe, expect, test } from "vitest";
import { intervalDays, review, type ReviewState } from "./scheduler";

describe("scheduler", () => {
  test("again, hard, good, and easy due times are ordered", () => {
    const seed: ReviewState = {
      cardId: "x",
      stability: 10,
      difficulty: 5,
      retrievability: 0.9,
      dueAt: "2026-06-18T12:00:00.000Z",
      lastReviewedAt: "2026-06-12T12:00:00.000Z",
      reps: 20,
      lapses: 1,
    };
    const now = new Date("2026-06-18T12:00:00.000Z");
    const again = review({ ...seed }, "again", now);
    const hard = review({ ...seed }, "hard", now);
    const good = review({ ...seed }, "good", now);
    const easy = review({ ...seed }, "easy", now);
    expect(intervalDays(again, now)).toBeLessThan(intervalDays(hard, now));
    expect(intervalDays(hard, now)).toBeLessThanOrEqual(intervalDays(good, now));
    expect(intervalDays(good, now)).toBeLessThan(intervalDays(easy, now));
  });
});
