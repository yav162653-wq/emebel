import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

vi.mock("@/lib/i18n", () => ({
  default: {
    t: (key: string) => key,
  },
}));

describe("AppErrorBoundary", () => {
  it("renders a localized recovery UI instead of crashing the app", () => {
    const ThrowingChild = (): React.ReactNode => {
      throw new Error("render failure");
    };

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <AppErrorBoundary>
        <ThrowingChild />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("common.unexpectedErrorTitle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "common.retry" })).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it("allows the failed section to retry", () => {
    let shouldThrow = true;
    const RecoverableChild = () => {
      if (shouldThrow) throw new Error("temporary failure");
      return <p>Recovered content</p>;
    };

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const view = render(
      <AppErrorBoundary>
        <RecoverableChild />
      </AppErrorBoundary>,
    );

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "common.retry" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(view.container).toHaveTextContent("Recovered content");

    consoleError.mockRestore();
  });

  it("resets automatically when resetKey changes", () => {
    const view = render(
      <AppErrorBoundary resetKey="/shop">
        <p>Safe content</p>
      </AppErrorBoundary>,
    );

    view.rerender(
      <AppErrorBoundary resetKey="/account">
        <p>Safe content</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });
});
