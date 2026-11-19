import { expect, test } from "@playwright/test";

test("redirects protected pages to login", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("registers a unique local account and redirects to shop", async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const credentials = {
    name: `E2E User ${suffix}`,
    email: `e2e-${suffix}@example.test`,
    username: `e2e_${suffix}`,
    password: "Enterprise!123",
  };

  await page.goto("/register");
  await page.getByTestId("input-name").fill(credentials.name);
  await page.getByTestId("input-register-email").fill(credentials.email);
  await page.getByTestId("input-username").fill(credentials.username);
  await page.getByTestId("input-password").fill(credentials.password);
  await page.getByTestId("input-confirm-password").fill(credentials.password);
  await page.getByTestId("button-submit-register").click();

  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByText("Barcha mahsulotlar").or(page.getByText("All Products"))).toBeVisible();
});

test("login works for a newly registered account", async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const credentials = {
    name: `Login User ${suffix}`,
    email: `login-${suffix}@example.test`,
    username: `login_${suffix}`,
    password: "Enterprise!123",
  };

  await page.goto("/register");
  await page.getByTestId("input-name").fill(credentials.name);
  await page.getByTestId("input-register-email").fill(credentials.email);
  await page.getByTestId("input-username").fill(credentials.username);
  await page.getByTestId("input-password").fill(credentials.password);
  await page.getByTestId("input-confirm-password").fill(credentials.password);
  await page.getByTestId("button-submit-register").click();
  await expect(page).toHaveURL(/\/shop$/);

  await page.goto("/account");
  await page.getByRole("button", { name: /Log out|Chiqish|Выйти/i }).click();
  await page.goto("/login");
  await page.getByTestId("input-username").fill(credentials.username);
  await page.getByTestId("input-password").fill(credentials.password);
  await page.getByTestId("button-submit-login").click();

  await expect(page).toHaveURL(/\/shop$/);
});
