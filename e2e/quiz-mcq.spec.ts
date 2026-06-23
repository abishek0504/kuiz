import { expect, test } from "@playwright/test";

async function openNumberMcq(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.locator('[aria-label="Practice focus"]').getByRole("button").nth(2).click();
  await page.getByRole("tablist", { name: "Format" }).getByRole("tab", { name: "MCQ" }).click();
  await expect(page.locator(".choice").first()).toBeVisible({ timeout: 20000 });
}

test("mcq selection reveals sticky feedback and Next", async ({ page }) => {
  await openNumberMcq(page);

  await expect(page.getByText(/Smart order:/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
  await page.locator(".choice").first().click();

  await expect(page.getByTestId("feedback-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try similar one" })).toBeVisible();
});

test("feedback explains Korean sentence roles", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();

  await expect(page.locator(".quiz-card h1")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByText("Why this answer?").click();

  await expect(page.getByText("Sentence breakdown")).toBeVisible();
  await expect(page.getByTestId("feedback-panel").locator(".sentence-breakdown")).toContainText(
    /topic|subject|object|time|predicate|action place/,
  );
});

test("skip advances without grading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  const before = await page.getByTestId("quiz-index").textContent();
  await page.getByRole("button", { name: "Skip" }).click();
  const after = await page.getByTestId("quiz-index").textContent();
  expect(after).not.toBe(before);
});

test("quiz state survives switching bottom tabs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tablist", { name: "Format" }).getByRole("tab", { name: "Blank" }).click();

  await expect(page.getByLabel("Your answer")).toBeVisible({ timeout: 20000 });
  const heading = await page.locator(".quiz-card h1").textContent();
  await page.getByLabel("Your answer").fill("테스트");
  await page.getByRole("button", { name: "Stats" }).click();
  await page.getByRole("button", { name: "Quiz", exact: true }).click();

  await expect(page.locator(".quiz-card h1")).toHaveText(heading ?? "");
  await expect(page.getByLabel("Your answer")).toHaveValue("테스트");
});

async function skipUntilSessionComplete(page: import("@playwright/test").Page, maxSkips = 20) {
  const skippedIds = new Set<string>();
  for (let count = 0; count < maxSkips; count += 1) {
    if (await page.getByTestId("session-complete-panel").isVisible()) return skippedIds;
    await expect(page.getByTestId("quiz-card")).toBeVisible({ timeout: 20000 });
    skippedIds.add((await page.getByTestId("quiz-card").getAttribute("data-exercise-id")) ?? "");
    await page.getByRole("button", { name: "Skip" }).click();
  }
  await expect(page.getByTestId("session-complete-panel")).toBeVisible();
  return skippedIds;
}

test("finishing a mini session shows completion and can continue fresh", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tablist", { name: "Format" }).getByRole("tab", { name: "MCQ" }).click();

  await expect(page.getByTestId("quiz-card")).toBeVisible({ timeout: 20000 });
  const firstSessionIds = await skipUntilSessionComplete(page);

  await expect(page.getByTestId("session-complete-panel")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review missed" })).toBeEnabled();
  await page.getByRole("button", { name: "Continue next 10" }).click();

  const nextSessionFirstId = (await page.getByTestId("quiz-card").getAttribute("data-exercise-id")) ?? "";
  expect(firstSessionIds.has(nextSessionFirstId)).toBe(false);
  await expect(page.getByTestId("quiz-index")).toContainText("/");
});

test("try similar moves to a different exercise", async ({ page }) => {
  await openNumberMcq(page);

  const initialId = (await page.getByTestId("quiz-card").getAttribute("data-exercise-id")) ?? "";
  await page.locator(".choice").first().click();
  await page.getByRole("button", { name: "Try similar one" }).click();

  await expect(page.getByTestId("quiz-card")).not.toHaveAttribute("data-exercise-id", initialId);
});

test("vocab focus with vocab cards shows word translation practice", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.locator('[aria-label="Practice focus"]').getByRole("button", { name: /Vocab/ }).click();
  await page.getByRole("tablist", { name: "Format" }).getByRole("tab", { name: "Vocab" }).click();

  await expect(page.locator(".choice").first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".quiz-card h1")).toContainText(/Choose the Korean/i);
  await expect(page.locator(".quiz-card h1")).not.toContainText(/What does|fix the Korean sentence|Build:/i);
});

test("vocab focus with all types stays word translation shaped", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.locator('[aria-label="Practice focus"]').getByRole("button", { name: /Vocab/ }).click();

  await expect(page.locator(".choice").first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".quiz-card h1")).toContainText(/Choose the Korean/i);
  await expect(page.locator(".quiz-card h1")).not.toContainText(/What does/i);
});

test("feedback can reveal translation after showing an answer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tab", { name: "Build" }).click();

  await expect(page.locator(".quiz-card h1")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Show answer" }).click();

  await expect(page.getByText("Show translation")).toBeVisible();
  await page.getByText("Show translation").click();
  await expect(page.getByTestId("feedback-panel")).toContainText(/[A-Za-z]/);
});

test("multi blank particle fill accepts blank only answer and similar variant changes sentence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.locator('[aria-label="Practice focus"]').getByRole("button", { name: "Numbers · time" }).click();
  await page.getByRole("tablist", { name: "Format" }).getByRole("tab", { name: "Blank" }).click();

  await expect(page.getByLabel("Your answer")).toBeVisible({ timeout: 20000 });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const heading = (await page.locator(".quiz-card h1").textContent()) ?? "";
    if (heading.includes("아침") && heading.includes("저녁")) break;
    await page.getByRole("button", { name: "Skip" }).click();
  }

  const originalHeading = (await page.locator(".quiz-card h1").textContent()) ?? "";
  await page.getByLabel("Your answer").fill("부터 까지");
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.getByTestId("feedback-panel")).toContainText("Correct");
  await expect(page.getByTestId("feedback-panel")).toContainText("부터 까지");
  await page.getByRole("button", { name: "Try similar one" }).click();

  await expect(page.locator(".quiz-card h1")).not.toHaveText(originalHeading);
  await expect(page.getByTestId("quiz-card")).toHaveAttribute("data-exercise-id", /^variant:/);
});
