import { expect, test } from "@playwright/test";

const smallPack = {
  schema: "kuiz-pack@1",
  pack: {
    packId: "e2e.small-pack",
    title: "E2E Small Pack",
    version: "1.0.0",
    locale: "en-CA",
    createdAt: "2026-06-19",
    appMinVersion: "1.0.0",
    includes: ["vocab", "food"]
  },
  sourceRefs: [{ sourceId: "e2e", label: "E2E", locator: "local", inferred: false }],
  vocab: [
    {
      id: "e2e.vocab.apple",
      dedupeKey: "vocab:e2e:apple",
      kind: "vocab",
      ko: "sagwa",
      en: "apple",
      pos: "noun",
      romanization: "sagwa",
      tags: ["vocab", "food"],
      sourceRefIds: ["e2e"],
      inferred: false,
      examples: [{ ko: "sagwa", en: "apple", audioText: "sagwa" }]
    }
  ],
  particles: [],
  grammar: [],
  distractorGroups: [],
  exercises: [
    {
      id: "e2e.mcq.apple",
      dedupeKey: "exercise:e2e:apple",
      type: "mcq",
      tags: ["vocab", "food"],
      sourceRefIds: ["e2e"],
      inferred: false,
      prompt: { stem: "Choose the Korean for apple.", audioText: "sagwa" },
      explanation: "sagwa means apple.",
      choiceKind: "phrase-meaning",
      choices: [
        { id: "correct", text: "sagwa", isCorrect: true, why: "Correct." },
        { id: "school", text: "hakgyo", isCorrect: false, why: "hakgyo means school." },
        { id: "time", text: "sigan", isCorrect: false, why: "sigan means time." },
        { id: "person", text: "saram", isCorrect: false, why: "saram means person." }
      ]
    }
  ]
};

test("duplicate content import previews skips before merge", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Packs" }).click();
  await page.getByRole("button", { name: "Paste JSON update" }).click();

  await page.getByRole("textbox", { name: "Content pack JSON" }).fill(JSON.stringify(smallPack));
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(page.getByTestId("import-preview")).toBeVisible();
  await page.getByRole("button", { name: "Confirm import" }).click();

  await page.getByRole("button", { name: "Paste JSON update" }).click();
  await page.getByRole("textbox", { name: "Content pack JSON" }).fill(JSON.stringify(smallPack));
  await page.getByRole("button", { name: "Preview import" }).click();

  await expect(page.getByTestId("import-preview")).toBeVisible();
  await expect(page.getByTestId("import-preview").getByText("skips")).toBeVisible();
});
