import { expect, test } from "@playwright/test";

async function completeCurrentSession(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await expect(page.getByTestId("quiz-card")).toBeVisible({ timeout: 20000 });

  const sessionText = (await page.getByTestId("quiz-index").textContent()) ?? "1 / 10";
  const sessionTotal = Number(sessionText.split("/").at(1)?.trim() ?? "10");

  for (let item = 0; item < sessionTotal; item += 1) {
    if (await page.getByTestId("session-complete-panel").isVisible()) break;
    await page.getByRole("button", { name: "Skip" }).click();
  }
}

test("continue next 10 starts a fresh batch", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await expect(page.getByTestId("quiz-card")).toBeVisible({ timeout: 20000 });

  const sessionText = (await page.getByTestId("quiz-index").textContent()) ?? "1 / 10";
  const sessionTotal = Number(sessionText.split("/").at(1)?.trim() ?? "10");
  const firstBatchIds: string[] = [];

  for (let item = 0; item < sessionTotal; item += 1) {
    if (await page.getByTestId("session-complete-panel").isVisible()) break;
    const id = await page.getByTestId("quiz-card").getAttribute("data-exercise-id");
    if (id) firstBatchIds.push(id);
    await page.getByRole("button", { name: "Skip" }).click();
  }

  await expect(page.getByTestId("session-complete-panel")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Continue next 10" }).click();

  await expect(page.getByTestId("quiz-card")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("quiz-index")).toHaveText(`1 / ${sessionTotal}`);
  const nextId = await page.getByTestId("quiz-card").getAttribute("data-exercise-id");
  expect(nextId).toBeTruthy();
  expect(firstBatchIds.includes(nextId ?? "")).toBe(false);
});

test("completing a mini-session shows the completion panel", async ({ page }) => {
  await completeCurrentSession(page);
  await expect(page.getByTestId("session-complete-panel")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();
});

test("review missed returns skipped items from the completed batch", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tablist", { name: "Format" }).getByRole("tab", { name: "MCQ" }).click();

  await expect(page.getByTestId("quiz-card")).toBeVisible({ timeout: 20000 });
  const firstId = (await page.getByTestId("quiz-card").getAttribute("data-exercise-id")) ?? "";

  const sessionText = (await page.getByTestId("quiz-index").textContent()) ?? "1 / 10";
  const sessionTotal = Number(sessionText.split("/").at(1)?.trim() ?? "10");

  for (let item = 0; item < sessionTotal; item += 1) {
    if (await page.getByTestId("session-complete-panel").isVisible()) break;
    await page.getByRole("button", { name: "Skip" }).click();
  }

  await expect(page.getByTestId("session-complete-panel")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Review missed" }).click();
  await expect(page.getByTestId("quiz-card")).toHaveAttribute("data-exercise-id", firstId);
});
