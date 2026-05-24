import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useFurnitureStore, CATEGORIES, type Category } from "@/modules/furniture/store/furniture-store";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { LogOut, Moon, Search, ShoppingBag, Sun, User, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const NAV_CATEGORIES: { label: string; value: Category }[] = [
  { label: "All", value: "All" },
  { label: "Seating", value: "Seating" },
  { label: "Tables", value: "Tables" },
  { label: "Lighting", value: "Lighting" },
  { label: "Storage", value: "Storage" },
  { label: "Bedroom", value: "Bedroom" },
];

export function HeroHeader() {
  const { user, logout } = useAuth();
  const { items, total, removeFromCart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { activeCategory, setCategory, searchQuery, setSearchQuery } = useFurnitureStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-8 shrink-0">
          <button
            data-testid="nav-logo"
            onClick={() => setCategory("All")}
            className="font-display text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity"
          >
            SPACE.
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex gap-1">
            {NAV_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                data-testid={`nav-${cat.value.toLowerCase()}`}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search Bar (expandable) */}
        <div className="flex-1 max-w-xs hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              data-testid="input-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search furniture..."
              className="w-full h-9 pl-9 pr-8 text-sm bg-secondary/40 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:bg-background transition-all placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile Search Toggle */}
          <PremiumButton
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
            data-testid="button-mobile-search"
          >
            <Search className="h-4 w-4" />
          </PremiumButton>

          {/* Theme Toggle */}
          <PremiumButton
            variant="ghost"
            size="icon"
            data-testid="button-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </PremiumButton>

          {/* Cart */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PremiumButton variant="ghost" size="icon" className="relative" data-testid="button-cart">
                <ShoppingBag className="h-5 w-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </PremiumButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="p-4 border-b">
                <h3 className="font-display text-base font-medium">Your Bag</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cartCount === 0 ? "Empty" : `${cartCount} item${cartCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto scrollbar-thin p-4 space-y-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Your bag is empty.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start">
                      <div className="h-14 w-14 rounded-sm bg-secondary/50 overflow-hidden shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-sm font-medium">
                          ${(item.product.price / 100).toFixed(0)}
                        </span>
                        <button
                          data-testid={`button-remove-${item.id}`}
                          onClick={() => removeFromCart(item.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors font-medium uppercase tracking-wide"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {items.length > 0 && (
                <div className="p-4 border-t space-y-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span className="font-mono">${(total / 100).toFixed(2)}</span>
                  </div>
                  <PremiumButton className="w-full" data-testid="button-checkout">
                    Proceed to Checkout
                  </PremiumButton>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PremiumButton variant="ghost" size="icon" data-testid="button-user-menu">
                <User className="h-5 w-5" />
              </PremiumButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <p className="text-xs font-normal text-muted-foreground">Signed in as</p>
                <p className="font-semibold text-sm truncate">{user?.name || user?.username}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>My Orders</DropdownMenuItem>
              <DropdownMenuItem>Wishlist</DropdownMenuItem>
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="button-logout"
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t overflow-hidden md:hidden"
          >
            <div className="container py-3 relative">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search furniture..."
                className="w-full h-10 pl-9 pr-4 text-sm bg-secondary/40 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Category Scroll */}
      <div className="lg:hidden border-t overflow-x-auto scrollbar-thin">
        <div className="container flex gap-2 py-2.5 w-max min-w-full">
          {NAV_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              data-testid={`mobile-nav-${cat.value.toLowerCase()}`}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeCategory === cat.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
