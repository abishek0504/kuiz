import { expect, test } from "@playwright/test";

test("mcq selection reveals sticky feedback and Next", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tab", { name: "Multiple choice" }).click();

  await expect(page.getByText(/Smart order:/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
  await page.locator(".choice").first().click();

  await expect(page.getByTestId("feedback-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
});

test("mcq feedback explains Korean sentence roles", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tab", { name: "Multiple choice" }).click();

  await page.locator(".choice").first().click();
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
