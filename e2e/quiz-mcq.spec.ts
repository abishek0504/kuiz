import { expect, test } from "@playwright/test";

test("mcq selection reveals sticky feedback and Next", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tab", { name: "Multiple choice" }).click();

  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
  await page.getByRole("button", { name: "저는 지금 한국어를 공부하고 있어요." }).click();

  await expect(page.getByTestId("feedback-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
});

test("skip advances without grading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  const before = await page.getByTestId("quiz-index").textContent();
  await page.getByRole("button", { name: "Skip" }).click();
  const after = await page.getByTestId("quiz-index").textContent();
  expect(after).not.toBe(before);
});
