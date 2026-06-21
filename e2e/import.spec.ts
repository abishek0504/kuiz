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
      ko: "사과",
      en: "apple",
      pos: "noun",
      romanization: "sagwa",
      tags: ["vocab", "food"],
      sourceRefIds: ["e2e"],
      inferred: false,
      examples: [{ ko: "사과를 먹어요.", en: "I eat an apple.", audioText: "사과를 먹어요." }]
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
      prompt: { stem: "Choose the Korean for apple.", audioText: "사과" },
      explanation: "사과 means apple.",
      choiceKind: "phrase-meaning",
      choices: [
        { id: "school", text: "학교", isCorrect: false, why: "학교 means school." },
        { id: "correct", text: "사과", isCorrect: true, why: "Correct." },
        { id: "time", text: "시간", isCorrect: false, why: "시간 means time." },
        { id: "person", text: "사람", isCorrect: false, why: "사람 means person." }
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
