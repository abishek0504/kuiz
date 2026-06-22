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
  const tabs = page.getByRole("tab");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true", {
    timeout: 20000,
  });
  await tabs.nth(4).click();
  await expect(tabs.nth(4)).toHaveAttribute("aria-selected", "true");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "false");
});

test("recommended practice starts with scenario input", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();

  await expect(page.getByRole("tab").first()).toHaveAttribute("aria-selected", "true", {
    timeout: 20000,
  });
  await expect(page.locator(".dialogue-card, .reading-card, .choice-grid").first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByLabel("Your answer")).toBeVisible();
});

test("home study focus uses Korean categories instead of raw tags", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Recommended next practice")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: "Start recommended" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Study focus" })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: /어휘/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /숫자·시간/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /조사/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /혼합/ })).toBeVisible();
  await expect(page.getByText("sino-numbers")).toHaveCount(0);
  await expect(page.getByText("native-numbers")).toHaveCount(0);

  const studyFocus = page.locator(".category-grid");
  for (const rawTag of ["particles", "vocab", "sino-numbers", "native-numbers", "ayo", "bakke", "buteo", "an"]) {
    await expect(studyFocus.getByRole("button", { name: rawTag, exact: true })).toHaveCount(0);
  }
});

test("progress shows category diagnostics", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Stats" }).click();

  await expect(page.getByRole("heading", { name: "Focus diagnostics" })).toBeVisible({ timeout: 20000 });
  const diagnostics = page.locator(".plain-section").filter({ hasText: "Focus diagnostics" });
  await expect(diagnostics.getByText("Production").first()).toBeVisible();
  await expect(diagnostics.getByText("Weak").first()).toBeVisible();
  await expect(diagnostics.getByText("Misses").first()).toBeVisible();
  await expect(diagnostics.getByText("Output").first()).toBeVisible();
});

test("quiz focus uses learner categories, not raw internal tags", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();

  const focus = page.locator('[aria-label="Practice focus"]');
  await expect(focus.getByRole("button", { name: "숫자·시간" })).toBeVisible({ timeout: 20000 });
  await focus.getByRole("button", { name: "숫자·시간" }).click();

  await expect(focus.getByRole("button", { name: "숫자·시간" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("sino-numbers")).toHaveCount(0);
  await expect(page.getByText("native-numbers")).toHaveCount(0);
  for (const rawTag of ["particles", "vocab", "sino-numbers", "native-numbers", "ayo", "bakke", "buteo", "an"]) {
    await expect(focus.getByRole("button", { name: rawTag, exact: true })).toHaveCount(0);
  }
});

test("practice path opens mixed balanced production", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Practice path" })).toBeVisible({ timeout: 20000 });

  await page.locator(".path-card").filter({ hasText: "Produce" }).getByRole("button", { name: /Practice/ }).click();

  await expect(page.getByRole("tab").first()).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('[aria-label="Practice focus"]').getByRole("button", { name: /혼합/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("listening session renders Korean-only audio practice", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("tab").nth(4).click();

  await expect(page.getByRole("button", { name: "Listen" })).toBeVisible({ timeout: 20000 });
  await expect(page.getByLabel("Your answer")).toBeVisible();
  await expect(page.locator(".quiz-card")).not.toContainText(/[A-Za-z]+[ -][A-Za-z]+[ -][A-Za-z]+ audio/i);
});
