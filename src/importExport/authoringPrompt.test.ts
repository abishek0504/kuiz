import { describe, expect, it } from "vitest";
import { buildAuthoringPrompt } from "./authoringPrompt";

describe("buildAuthoringPrompt", () => {
  it("includes visual coverage, update, schema, and question-quality requirements", () => {
    const prompt = buildAuthoringPrompt({
      schema: "kuiz-snapshot@1",
      appVersion: "1.0.0",
      installedPackIds: ["starter.core.v1"],
      installedPacks: [{ packId: "starter.core.v1", version: "1.3.1", title: "Starter" }],
      dedupeKeys: ["vocab:친구"],
      tags: ["vocab"],
      settings: { particleCoverage: "all", particleStrictness: "strict", focusTags: [] },
    });

    expect(prompt).toContain("Inspect every supplied page or image visually");
    expect(prompt).toContain("handwritten additions, corrections");
    expect(prompt).toContain("reuse packId");
    expect(prompt).toContain('"acceptedAnswers"');
    expect(prompt).toContain("Do not create 100 nearly identical questions");
    expect(prompt).toContain("책을 마셔요 is not");
    expect(prompt).toContain("starter.core.v1");
    expect(prompt).toContain("vocab:친구");
  });
});
