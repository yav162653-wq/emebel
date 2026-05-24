import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { useTheme } from "@/app/providers/ThemeProvider";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { LogOut, Moon, ShoppingBag, Sun, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export function HeroHeader() {
  const { user, logout } = useAuth();
  const { items, total, removeFromCart } = useCart();
  const { theme, toggleTheme } = useTheme();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <span className="font-display text-2xl font-bold tracking-tighter cursor-pointer select-none">
            SPACE.
          </span>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            {["Living", "Dining", "Bedroom", "Office"].map((item) => (
              <a
                key={item}
                href="#"
                data-testid={`nav-${item.toLowerCase()}`}
                className="hover:text-primary transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
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
              <PremiumButton
                variant="ghost"
                size="icon"
                className="relative"
                data-testid="button-cart"
              >
                <ShoppingBag className="h-5 w-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </PremiumButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-4">
              <DropdownMenuLabel className="font-display text-base font-medium">
                Your Bag
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-4 max-h-64 overflow-y-auto py-2">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Your bag is empty.
                  </p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm items-start">
                      <div className="h-14 w-14 rounded-sm bg-secondary/50 overflow-hidden shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product.name}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-xs font-medium">
                          ${(item.product.price / 100).toFixed(0)}
                        </span>
                        <button
                          data-testid={`button-remove-${item.id}`}
                          onClick={() => removeFromCart(item.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {items.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="flex justify-between font-semibold py-2 text-sm">
                    <span>Total</span>
                    <span className="font-mono">${(total / 100).toFixed(2)}</span>
                  </div>
                  <PremiumButton
                    className="w-full mt-2"
                    data-testid="button-checkout"
                  >
                    Proceed to Checkout
                  </PremiumButton>
                </>
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
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p className="text-xs font-normal text-muted-foreground">Signed in as</p>
                <p className="font-semibold">{user?.name || user?.username}</p>
              </DropdownMenuLabel>
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
    </header>
  );
}
