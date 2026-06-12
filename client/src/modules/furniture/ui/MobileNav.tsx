import { useFurnitureStore, CATEGORIES, type Category } from "../store/furniture-store";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/app/providers/ThemeProvider";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Heart, LayoutDashboard, LogOut, Moon, Sun, User } from "lucide-react";

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen, activeCategory, setCategory } = useFurnitureStore();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleCategory = (cat: Category) => {
    setCategory(cat);
    setMobileNavOpen(false);
  };

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-72 flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="font-display text-xl font-bold tracking-tighter text-left">
            SPACE.
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu with shop categories, account settings, and theme toggle.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {user && (
            <div className="px-6 py-4 bg-secondary/20 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary uppercase">
                    {(user.name || user.username).charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name || user.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role} account</p>
                </div>
              </div>
            </div>
          )}

          <div className="px-3 py-4 space-y-1">
            <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Shop
            </p>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Separator />

          <div className="px-3 py-4 space-y-1">
            <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Account
            </p>
            <Link href="/account" onClick={() => setMobileNavOpen(false)}>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors">
                <User className="h-4 w-4" />
                My Account
              </button>
            </Link>
            <Link href="/wishlist" onClick={() => setMobileNavOpen(false)}>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors">
                <Heart className="h-4 w-4" />
                Wishlist
              </button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" onClick={() => setMobileNavOpen(false)}>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Dashboard
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="px-3 py-4 border-t space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={() => { logout(); setMobileNavOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
