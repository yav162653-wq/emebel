import { expect, test } from "@playwright/test";

const locales = [
  { code: "en", login: "Welcome back", register: "Create account", emptyCart: "Your bag is empty" },
  { code: "uz", login: "Xush kelibsiz", register: "Hisob yaratish", emptyCart: "Savatingiz bo'sh" },
  { code: "ru", login: "С возвращением", register: "Создать аккаунт", emptyCart: "Корзина пуста" },
];

for (const locale of locales) {
  test(`smoke pages render in ${locale.code}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript((language) => {
      localStorage.setItem("space_lang", language);
    }, locale.code);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", locale.code);
    await expect(page.getByRole("heading").first()).toBeVisible();

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: locale.login })).toBeVisible();

    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: locale.register })).toBeVisible();

    const suffix = `${locale.code}${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const password = "Enterprise!123";
    await page.getByTestId("input-name").fill(`Smoke ${locale.code}`);
    await page.getByTestId("input-register-email").fill(`smoke-${suffix}@example.test`);
    await page.getByTestId("input-username").fill(`smoke_${suffix}`);
    await page.getByTestId("input-password").fill(password);
    await page.getByTestId("input-confirm-password").fill(password);
    await page.getByTestId("button-submit-register").click();

    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByTestId("card-product-1")).toBeVisible();

    await page.goto("/product/1", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Cosimo Lounge Chair").first()).toBeVisible();

    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: `Smoke ${locale.code}` })).toBeVisible();

    await page.goto("/wishlist", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading").first()).toBeVisible();

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: locale.emptyCart })).toBeVisible();

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Access Denied")).toBeVisible();
  });
}
