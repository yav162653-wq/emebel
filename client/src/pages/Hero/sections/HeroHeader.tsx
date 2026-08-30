import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { useTheme } from "@/app/providers/ThemeProvider";
import {
  useFurnitureStore, CATEGORIES, type Category,
} from "@/modules/furniture/store/furniture-store";
import { useWishlist } from "@/modules/furniture/hooks/use-wishlist";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { CartDrawer } from "@/modules/furniture/ui/CartDrawer";
import { MobileNav } from "@/modules/furniture/ui/MobileNav";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import {
  Heart, LayoutDashboard, LogOut, Moon, Search, ShoppingBag, Sun, User, X, Menu,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";

const NAV_KEYS = ["all", "seating", "tables", "lighting", "storage", "bedroom", "outdoor", "decor"] as const;
const NAV_VALUES: Category[] = ["All", "Seating", "Tables", "Lighting", "Storage", "Bedroom", "Outdoor", "Decor"];

export function HeroHeader() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { theme, toggleTheme } = useTheme();
  const {
    activeCategory, setCategory,
    searchQuery, setSearchQuery,
    cartDrawerOpen, setCartDrawerOpen,
    mobileNavOpen, setMobileNavOpen,
  } = useFurnitureStore();
  const wishlist = useWishlist();

  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          searchRef.current?.focus();
        } else {
          setSearchOpen(true);
          setTimeout(() => mobileSearchRef.current?.focus(), 50);
        }
      }
      if (e.key === "Escape") {
        setCartDrawerOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCartDrawerOpen]);

  return (
    <>
      <CartDrawer />
      <MobileNav />

      <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">

          {/* Left: Hamburger + Logo + Desktop Nav */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              data-testid="button-mobile-menu"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              data-testid="nav-logo"
              onClick={() => setCategory("All")}
              className="font-display text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity shrink-0"
            >
              SPACE.
            </button>

            <nav className="hidden lg:flex items-center gap-0.5 ml-4 overflow-x-auto scrollbar-none max-w-[480px]">
              {NAV_KEYS.map((key, idx) => (
                <button
                  key={NAV_VALUES[idx]}
                  data-testid={`nav-${NAV_VALUES[idx].toLowerCase()}`}
                  onClick={() => setCategory(NAV_VALUES[idx])}
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeCategory === NAV_VALUES[idx]
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {t(`nav.${key}`)}
                </button>
              ))}
            </nav>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                data-testid="input-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search.placeholder")}
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

          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <PremiumButton
              variant="ghost" size="icon" className="md:hidden"
              onClick={() => setSearchOpen(!searchOpen)}
              data-testid="button-mobile-search"
            >
              <Search className="h-4 w-4" />
            </PremiumButton>

            {/* Language Switcher */}
            <LanguageSwitcher compact />

            {/* Theme Toggle */}
            <PremiumButton
              variant="ghost" size="icon"
              data-testid="button-theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                  <motion.span key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.18 }}>
                    <Sun className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.18 }}>
                    <Moon className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </PremiumButton>

            {/* Wishlist */}
            <Link href="/wishlist">
              <PremiumButton variant="ghost" size="icon" className="relative" data-testid="button-wishlist-nav">
                <Heart className="h-5 w-5" />
                <AnimatePresence>
                  {wishlist.count > 0 && (
                    <motion.span key="wb"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                      {wishlist.count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </PremiumButton>
            </Link>

            {/* Cart */}
            <PremiumButton
              variant="ghost" size="icon" className="relative"
              data-testid="button-cart"
              onClick={() => setCartDrawerOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span key="cb"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </PremiumButton>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PremiumButton variant="ghost" size="icon" data-testid="button-user-menu">
                  <User className="h-5 w-5" />
                </PremiumButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <p className="text-xs font-normal text-muted-foreground">{t("nav.signedInAs")}</p>
                  <p className="font-semibold text-sm truncate">{user?.name || user?.username}</p>
                  {user?.role === "admin" && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-bold uppercase tracking-wider">
                      {t("common.admin")}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/account">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> {t("nav.myAccount")}
                  </DropdownMenuItem>
                </Link>
                <Link href="/wishlist">
                  <DropdownMenuItem className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" /> {t("nav.wishlist")}
                    {wishlist.count > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">{wishlist.count}</span>
                    )}
                  </DropdownMenuItem>
                </Link>
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer text-accent focus:text-accent">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.adminDashboard")}
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid="button-logout"
                  onClick={() => logout()}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Search Expander */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t overflow-hidden md:hidden"
            >
              <div className="container py-3 relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={mobileSearchRef}
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search.placeholderMobile")}
                  className="w-full h-10 pl-9 pr-4 text-sm bg-secondary/40 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Category Scroll */}
        <div className="lg:hidden border-t overflow-x-auto scrollbar-none">
          <div className="container flex gap-2 py-2.5 w-max min-w-full">
            {NAV_KEYS.map((key, idx) => (
              <button
                key={NAV_VALUES[idx]}
                data-testid={`mobile-nav-${NAV_VALUES[idx].toLowerCase()}`}
                onClick={() => setCategory(NAV_VALUES[idx])}
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeCategory === NAV_VALUES[idx]
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t(`nav.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
