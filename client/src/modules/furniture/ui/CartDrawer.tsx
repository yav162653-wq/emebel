import { useCart } from "../hooks/use-cart";
import { useFurnitureStore } from "../store/furniture-store";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ShoppingBag, X, Minus, Plus, ArrowRight, Package } from "lucide-react";
import { useState } from "react";

export function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen } = useFurnitureStore();
  const { items, total, removeFromCart, isRemoving } = useCart();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = total > 50000 ? 0 : 2900;
  const grandTotal = total + shipping;

  return (
    <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-xl font-medium flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Your Bag
              {cartCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full py-20 gap-5 px-6 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Package className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Your bag is empty</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Discover our curated furniture collection.
                  </p>
                </div>
                <PremiumButton
                  size="sm"
                  onClick={() => setCartDrawerOpen(false)}
                >
                  Continue Shopping
                </PremiumButton>
              </motion.div>
            ) : (
              <div className="p-6 space-y-5">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-4"
                    data-testid={`cart-item-${item.id}`}
                  >
                    {/* Thumbnail */}
                    <Link href={`/product/${item.product.id}`} onClick={() => setCartDrawerOpen(false)}>
                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-secondary/30 cursor-pointer">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <Link href={`/product/${item.product.id}`} onClick={() => setCartDrawerOpen(false)}>
                        <p className="text-sm font-medium text-foreground truncate hover:text-accent transition-colors cursor-pointer">
                          {item.product.name}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.product.category}</p>
                      <div className="flex items-center justify-between mt-auto">
                        {/* Quantity control */}
                        <div className="flex items-center border border-border rounded-sm">
                          <button
                            className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeFromCart(item.id);
                              }
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="h-7 w-8 flex items-center justify-center text-xs font-semibold border-x border-border">
                            {item.quantity}
                          </span>
                          <button className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-mono text-sm font-semibold">
                          ${((item.product.price * item.quantity) / 100).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      data-testid={`button-remove-${item.id}`}
                      onClick={() => removeFromCart(item.id)}
                      className="shrink-0 self-start p-1 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({cartCount} items)</span>
                <span className="font-mono">${(total / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span className="font-mono">
                  {shipping === 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                  ) : (
                    `$${(shipping / 100).toFixed(2)}`
                  )}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-[10px] text-muted-foreground/70">
                  Free shipping on orders over $500
                </p>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-foreground">
                <span>Total</span>
                <span className="font-mono text-lg">${(grandTotal / 100).toFixed(2)}</span>
              </div>
            </div>

            <Link href="/checkout" onClick={() => setCartDrawerOpen(false)}>
              <PremiumButton className="w-full" size="lg" data-testid="button-checkout">
                Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </PremiumButton>
            </Link>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
