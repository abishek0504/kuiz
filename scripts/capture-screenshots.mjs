import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "@playwright/test";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const screenshotDir = path.join(root, "docs", "screenshots");
const baseURL = "http://127.0.0.1:5173";

async function waitForApp(page) {
  await page.goto(baseURL);
  await page.getByLabel("Recommended next practice").waitFor({ timeout: 30_000 });
}

async function save(page, name, fullPage = false) {
  await page.screenshot({ path: path.join(screenshotDir, name), fullPage });
}

const importPack = {
  schema: "kuiz-pack@1",
  pack: {
    packId: "screenshot.preview.v1",
    version: "1.0.0",
    title: "Screenshot Preview Pack",
    locale: "en-CA",
    createdAt: "2026-06-22",
    appMinVersion: "1.0.0",
    includes: ["vocab"],
  },
  sourceRefs: [{ sourceId: "screenshot", label: "Screenshot fixture", inferred: true }],
  vocab: [
    {
      id: "vocab-screenshot-사과",
      dedupeKey: "vocab:screenshot:사과",
      kind: "vocab",
      ko: "사과",
      en: "apple",
      pos: "noun",
      tags: ["vocab", "food"],
      sourceRefIds: ["screenshot"],
      examples: [{ ko: "사과를 먹어요.", en: "I eat an apple.", audioText: "사과를 먹어요." }],
    },
  ],
  particles: [],
  grammar: [],
  distractorGroups: [],
  exercises: [
    {
      id: "exercise-screenshot-apple",
      dedupeKey: "exercise:screenshot:apple",
      type: "mcq",
      tags: ["mcq", "vocab", "food"],
      sourceRefIds: ["screenshot"],
      prompt: { stem: 'Choose the Korean for "apple".', audioText: "사과" },
      explanation: "사과 means apple.",
      choiceKind: "phrase-meaning",
      choices: [
        { id: "a", text: "학교", isCorrect: false, why: "학교 means school, not apple." },
        { id: "b", text: "사과", isCorrect: true, why: "Correct." },
        { id: "c", text: "시간", isCorrect: false, why: "시간 means time, not apple." },
        { id: "d", text: "사람", isCorrect: false, why: "사람 means person, not apple." },
      ],
    },
  ],
};

const server = await createServer({
  root,
  configFile: false,
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173 },
  logLevel: "error",
});

await server.listen();
const browser = await chromium.launch();

try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const desktopPage = await desktop.newPage();
  await waitForApp(desktopPage);
  await save(desktopPage, "home-desktop.png", true);
  await desktopPage.getByRole("button", { name: "Quiz", exact: true }).click();
  await desktopPage.locator('[aria-label="Practice focus"]').waitFor();
  await save(desktopPage, "quiz-focus-desktop.png", true);
  await desktopPage.getByRole("button", { name: "Packs" }).click();
  await desktopPage.getByRole("button", { name: "Paste JSON update" }).click();
  await desktopPage.locator("#import-json").fill(JSON.stringify(importPack, null, 2));
  await desktopPage.getByRole("button", { name: "Preview import" }).click();
  await desktopPage.getByTestId("import-preview").waitFor();
  await save(desktopPage, "library-import-desktop.png", true);
  await desktop.close();

  const mobile = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await mobile.newPage();
  await waitForApp(page);
  await save(page, "home-iphone.png");

  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.locator(".dialogue-card, .reading-card, .choice-grid").first().waitFor();
  await save(page, "dialogue-task-iphone.png");
  await save(page, "quiz-focus-iphone.png");
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByText("Why this answer?").click();
  await page.getByText("Sentence breakdown").waitFor();
  await save(page, "quiz-feedback-breakdown-iphone.png");

  await page.goto(baseURL);
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tab").nth(4).click();
  await page.getByRole("button", { name: "Listen" }).waitFor();
  await save(page, "listening-task-iphone.png");

  await page.goto(baseURL);
  await page.getByRole("button", { name: "Stats" }).click();
  await page.getByRole("heading", { name: "Focus diagnostics" }).waitFor();
  await save(page, "progress-diagnostics-iphone.png", true);
  await mobile.close();
} finally {
  await browser.close();
  await server.close();
}
