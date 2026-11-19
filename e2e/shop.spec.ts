import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function register(page: import("@playwright/test").Page) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const password = "Enterprise!123";
  await page.goto("/register");
  await page.getByTestId("input-name").fill(`Shop User ${suffix}`);
  await page.getByTestId("input-register-email").fill(`shop-${suffix}@example.test`);
  await page.getByTestId("input-username").fill(`shop_${suffix}`);
  await page.getByTestId("input-password").fill(password);
  await page.getByTestId("input-confirm-password").fill(password);
  await page.getByTestId("button-submit-register").click();
  await expect(page).toHaveURL(/\/shop$/);
  return password;
}

test("shop supports search, card wishlist and add-to-cart", async ({ page }) => {
  await register(page);

  const search = page.getByPlaceholder(/Search furniture|Mebel qidiring|Найти мебель/i);
  await search.fill("Cosimo");
  await expect(page.getByText("Cosimo Lounge Chair").first()).toBeVisible();

  const card = page.getByTestId("card-product-1");
  await card.hover();
  await card.getByTestId("button-wishlist-1").click();
  await card.getByTestId("button-add-to-cart-1").click();

  await expect(card.getByTestId("button-add-to-cart-1")).toBeVisible();

  await page.goto("/checkout");
  await expect(page.getByText(/Review Your Bag|Review Your/i).or(page.getByText("Bag"))).toBeVisible();
});

test("authenticated shop passes automated accessibility checks", async ({ page }) => {
  await register(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
