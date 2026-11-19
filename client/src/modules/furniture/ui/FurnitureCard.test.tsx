import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "@shared/schema";
import { FurnitureCardView } from "./FurnitureCard";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options?.count !== undefined ? `${key}:${options.count}` : key,
  }),
}));

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    <a href={href}>{children}</a>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileInView, viewport, initial, animate, transition, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) =>
      <div {...props}>{children}</div>,
  },
}));

const product: Product = {
  id: 42,
  name: "Test Chair",
  description: "A resilient chair",
  price: 189000,
  category: "Seating",
  image: "https://example.com/chair.jpg",
  stock: 3,
  material: "Oak",
  warranty: "Lifetime",
  origin: "Studio",
  assembly: "White Glove",
  colors: [],
};

function renderCard(overrides: Partial<React.ComponentProps<typeof FurnitureCardView>> = {}) {
  const props: React.ComponentProps<typeof FurnitureCardView> = {
    product,
    isWishlisted: false,
    isAddingToCart: false,
    onAddToCart: vi.fn(),
    onToggleWishlist: vi.fn(),
    onQuickView: vi.fn(),
    ...overrides,
  };
  return { ...render(<FurnitureCardView {...props} />), props };
}

describe("FurnitureCardView", () => {
  it("renders the product name, category, and formatted price", () => {
    renderCard();

    expect(screen.getByText("Test Chair")).toBeInTheDocument();
    expect(screen.getByText("nav.seating")).toBeInTheDocument();
    expect(screen.getByText("$1,890")).toBeInTheDocument();
  });

  it("emits add, wishlist, and quick-view actions", () => {
    const onAddToCart = vi.fn();
    const onToggleWishlist = vi.fn();
    const onQuickView = vi.fn();
    renderCard({ onAddToCart, onToggleWishlist, onQuickView });

    fireEvent.click(screen.getByTestId("button-add-to-cart-42"));
    fireEvent.click(screen.getByTestId("button-wishlist-42"));
    fireEvent.click(screen.getByTestId("button-quick-view-42"));

    expect(onAddToCart).toHaveBeenCalledOnce();
    expect(onToggleWishlist).toHaveBeenCalledOnce();
    expect(onQuickView).toHaveBeenCalledOnce();
  });

  it("renders out-of-stock state and hides cart actions", () => {
    renderCard({ product: { ...product, stock: 0 } });

    expect(screen.getByText("product.soldOut")).toBeInTheDocument();
    expect(screen.queryByTestId("button-add-to-cart-42")).not.toBeInTheDocument();
    expect(screen.queryByTestId("button-quick-view-42")).not.toBeInTheDocument();
  });

  it("renders an accessible fallback after image failure", () => {
    renderCard();

    const image = screen.getByAltText("Test Chair");
    fireEvent.error(image);

    expect(screen.getByRole("img", { name: "Test Chair" })).toBeInTheDocument();
  });
});
