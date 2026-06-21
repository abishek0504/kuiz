import { expect, test } from "@playwright/test";

test("mobile quiz shows prompt and core controls without long initial scrolling", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();

  await expect(page.locator(".quiz-card h1")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: "Listen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show answer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();

  const skipBox = await page.getByRole("button", { name: "Skip" }).boundingBox();
  expect(skipBox?.y ?? 9999).toBeLessThan(620);
});

test("mode chip highlighting follows selected state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tab", { name: "Fill blank" }).click();
  await expect(page.getByRole("tab", { name: "Fill blank" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Multiple choice" })).toHaveAttribute("aria-selected", "false");
});

test("home study focus uses Korean categories instead of raw tags", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Study focus" })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: /어휘/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /숫자·시간/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /조사/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /혼합/ })).toBeVisible();
  await expect(page.getByText("sino-numbers")).toHaveCount(0);
  await expect(page.getByText("native-numbers")).toHaveCount(0);
});
