import { expect, test } from "@playwright/test";

async function openNumberMcq(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.locator('[aria-label="Practice focus"]').getByRole("button").nth(2).click();
  await page.getByRole("tab", { name: "Multiple choice" }).click();
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
  await page.getByRole("tab", { name: "Fill blank" }).click();

  await expect(page.getByLabel("Your answer")).toBeVisible({ timeout: 20000 });
  const heading = await page.locator(".quiz-card h1").textContent();
  await page.getByLabel("Your answer").fill("테스트");
  await page.getByRole("button", { name: "Stats" }).click();
  await page.getByRole("button", { name: "Quiz", exact: true }).click();

  await expect(page.locator(".quiz-card h1")).toHaveText(heading ?? "");
  await expect(page.getByLabel("Your answer")).toHaveValue("테스트");
});

test("finishing a mini session advances to a fresh batch", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tab", { name: "Multiple choice" }).click();

  await expect(page.getByTestId("quiz-card")).toBeVisible({ timeout: 20000 });
  const firstSessionIds = new Set<string>();
  const sessionText = (await page.getByTestId("quiz-index").textContent()) ?? "1 / 10";
  const sessionTotal = Number(sessionText.split("/").at(1)?.trim() ?? "10");

  for (let count = 0; count < sessionTotal; count += 1) {
    firstSessionIds.add((await page.getByTestId("quiz-card").getAttribute("data-exercise-id")) ?? "");
    await page.getByRole("button", { name: "Skip" }).click();
  }

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
