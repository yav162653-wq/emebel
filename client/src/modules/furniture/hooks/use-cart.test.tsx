import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCart } from "./use-cart";

const { fetchCartMock } = vi.hoisted(() => ({
  fetchCartMock: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/api/cart", () => ({
  addCartItem: vi.fn(),
  fetchCart: fetchCartMock,
  removeCartItem: vi.fn(),
  updateCartItem: vi.fn(),
}));

describe("useCart", () => {
  it("does not request the authenticated cart for a guest", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(fetchCartMock).not.toHaveBeenCalled();
    queryClient.clear();
  });
});
