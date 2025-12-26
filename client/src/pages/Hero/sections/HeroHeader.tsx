import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { LogOut, ShoppingBag, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HeroHeader() {
  const { user, logout } = useAuth();
  const { items, total } = useCart();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-display text-2xl font-bold tracking-tighter cursor-pointer">SPACE.</span>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Living</a>
            <a href="#" className="hover:text-primary transition-colors">Dining</a>
            <a href="#" className="hover:text-primary transition-colors">Bedroom</a>
            <a href="#" className="hover:text-primary transition-colors">Office</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PremiumButton variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </PremiumButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-4">
              <DropdownMenuLabel>Your Cart</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-4 max-h-60 overflow-y-auto py-2">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Your cart is empty.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4 text-sm">
                      <div className="h-12 w-12 rounded bg-secondary/50 overflow-hidden shrink-0">
                         <img src={item.product.image} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-mono">
                        ${(item.product.price / 100).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="flex justify-between font-bold py-2">
                <span>Total</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
              <PremiumButton className="w-full mt-2">Checkout</PremiumButton>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PremiumButton variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </PremiumButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p className="font-normal">Signed in as</p>
                <p className="font-bold">{user?.username}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
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
