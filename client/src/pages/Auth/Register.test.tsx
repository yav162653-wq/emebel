import { I18nextProvider } from "react-i18next";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import Register from "./Register";

const auth = vi.hoisted(() => ({ register: vi.fn() }));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ register: auth.register, isRegistering: false }),
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
  auth.register.mockClear();
});

describe("Register page", () => {
  it("does not register when password confirmation does not match", async () => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <Register />
      </I18nextProvider>,
    );

    await user.type(screen.getByTestId("input-name"), "Test Member");
    await user.type(screen.getByTestId("input-register-email"), "member@example.test");
    await user.type(screen.getByTestId("input-username"), "test-member");
    await user.type(screen.getByTestId("input-password"), "test-password");
    await user.type(screen.getByTestId("input-confirm-password"), "different-password");
    await user.click(screen.getByTestId("button-submit-register"));

    await waitFor(() => expect(screen.getByText("Passwords don't match")).toBeInTheDocument());
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("registers without forwarding the confirmation field", async () => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <Register />
      </I18nextProvider>,
    );

    await user.type(screen.getByTestId("input-name"), "Test Member");
    await user.type(screen.getByTestId("input-register-email"), "member@example.test");
    await user.type(screen.getByTestId("input-username"), "test-member");
    await user.type(screen.getByTestId("input-password"), "test-password");
    await user.type(screen.getByTestId("input-confirm-password"), "test-password");
    await user.click(screen.getByTestId("button-submit-register"));

    await waitFor(() => {
      expect(auth.register).toHaveBeenCalledWith({
        name: "Test Member",
        email: "member@example.test",
        username: "test-member",
        password: "test-password",
      });
    });
  });
});
