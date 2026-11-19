import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryErrorState } from "./QueryErrorState";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("QueryErrorState", () => {
  it("announces the error and retries when requested", () => {
    const onRetry = vi.fn();

    render(<QueryErrorState onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("common.error");
    fireEvent.click(screen.getByRole("button", { name: "common.retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("omits the retry button when no retry action is available", () => {
    render(<QueryErrorState />);

    expect(screen.getByRole("alert")).toHaveTextContent("common.error");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
