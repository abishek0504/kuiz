import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const starter = JSON.parse(readFileSync(resolve("content-packs/starter.core.v1.json"), "utf8"));

test("duplicate starter import previews skips before merge", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Library" }).click();
  await page.getByRole("button", { name: "Paste JSON update" }).click();
  await page.getByRole("textbox", { name: "Content pack JSON" }).fill(JSON.stringify(starter, null, 2));
  await page.getByRole("button", { name: "Preview import" }).click();

  await expect(page.getByTestId("import-preview")).toBeVisible();
  await expect(page.getByTestId("import-preview").getByText("skips")).toBeVisible();
});
