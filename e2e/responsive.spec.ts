import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing and language switcher remain usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30_000 });

  await expect(page.locator("body")).not.toContainText("Application rendering failed");
  await page.getByTestId("button-language-switcher").click();
  await expect(page.getByTestId("button-language-switcher")).toBeVisible();
});

test("public and auth pages pass automated accessibility checks", async ({ page }) => {
  for (const path of ["/", "/login", "/register"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations, `Accessibility violations on ${path}`).toEqual([]);
  }
});
