import { expect, test } from "@playwright/test";

test("mobile quiz shows prompt and core controls without long initial scrolling", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();

  await expect(page.getByRole("heading", { name: /Choose the best Korean/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Listen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show answer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();

  const skipBox = await page.getByRole("button", { name: "Skip" }).boundingBox();
  expect(skipBox?.y ?? 9999).toBeLessThan(520);
});

test("mode chip highlighting follows selected state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tab", { name: "Fill blank" }).click();
  await expect(page.getByRole("tab", { name: "Fill blank" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Multiple choice" })).toHaveAttribute("aria-selected", "false");
});
