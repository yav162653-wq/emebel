import { I18nextProvider } from "react-i18next";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import Login from "./Login";

const auth = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    login: auth.login,
    isLoggingIn: false,
    requestMagicLink: vi.fn(),
    isRequestingMagicLink: false,
  }),
}));
vi.mock("@/app/providers/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));
vi.mock("@/shared/components/ExternalAuthButtons", () => ({
  ExternalAuthButtons: () => null,
}));
vi.mock("@/shared/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => null,
}));
vi.mock("wouter", () => ({ Link: "a" }));

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  auth.login.mockClear();
});

describe("Login page", () => {
  it("submits username and password to the authentication hook", async () => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <Login />
      </I18nextProvider>,
    );

    await user.type(screen.getByTestId("input-username"), "member@example.test");
    await user.type(screen.getByTestId("input-password"), "test-password");
    await user.click(screen.getByTestId("button-submit-login"));

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith({
        username: "member@example.test",
        password: "test-password",
      });
    });
  });
});
