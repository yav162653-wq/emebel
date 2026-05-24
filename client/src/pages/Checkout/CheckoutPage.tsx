import { useState } from "react";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, ShoppingBag, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Step = "cart" | "shipping" | "payment" | "success";

const STEPS: { key: Step; label: string; icon: typeof ShoppingBag }[] = [
  { key: "cart", label: "Review", icon: ShoppingBag },
  { key: "shipping", label: "Shipping", icon: MapPin },
  { key: "payment", label: "Payment", icon: CreditCard },
];

const stepIndex = (s: Step) => ["cart", "shipping", "payment", "success"].indexOf(s);

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("cart");
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, total } = useCart();
  const [, setLocation] = useLocation();

  const shipping = total > 50000 ? 0 : 2900;
  const tax = Math.round(total * 0.08);
  const grandTotal = total + shipping + tax;

  const [shippingData, setShippingData] = useState({
    fullName: "", email: "", address: "", city: "", state: "", zip: "", country: "United States",
  });
  const [paymentData, setPaymentData] = useState({
    cardName: "", cardNumber: "", expiry: "", cvv: "",
  });

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsProcessing(false);
    setStep("success");
  };

  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <h2 className="font-display text-3xl font-medium">Your bag is empty</h2>
          <p className="text-muted-foreground">Add some items before checking out.</p>
          <Link href="/shop"><PremiumButton>Browse Shop</PremiumButton></Link>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
          </motion.div>
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Order Confirmed</p>
            <h1 className="font-display text-4xl font-medium">Thank you!</h1>
            <p className="text-muted-foreground leading-relaxed">
              Your order has been placed successfully. You'll receive a confirmation email shortly.
            </p>
            <p className="font-mono text-sm text-muted-foreground mt-2">
              Order #SP-{Math.floor(Math.random() * 90000) + 10000}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-secondary/40 rounded-sm px-4 py-3 text-sm text-muted-foreground">
            <Truck className="h-4 w-4 shrink-0 text-accent" />
            <span>Estimated delivery: 5–7 business days with white-glove service.</span>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/shop">
              <PremiumButton>Continue Shopping</PremiumButton>
            </Link>
            <Link href="/account">
              <PremiumButton variant="outline">View Orders</PremiumButton>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/shop">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </button>
          </Link>
          <span className="font-display text-xl font-bold tracking-tighter">SPACE.</span>
          <div className="w-24" />
        </div>
      </header>

      <div className="container py-10">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const current = stepIndex(step);
              const isCompleted = i < current;
              const isActive = s.key === step;
              return (
                <div key={s.key} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted ? "bg-primary border-primary" :
                      isActive ? "bg-background border-primary" :
                      "bg-background border-border"
                    }`}>
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <s.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-24 h-0.5 mx-2 mb-5 transition-colors duration-300 ${
                      i < current ? "bg-primary" : "bg-border"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {step === "cart" && (
                <motion.div key="cart" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  <h2 className="font-display text-2xl font-medium">Review Your Bag</h2>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 rounded-sm border border-border bg-card">
                        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-secondary/30">
                          <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.product.category}</p>
                          <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-mono text-sm font-semibold shrink-0">
                          ${((item.product.price * item.quantity) / 100).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <PremiumButton className="w-full" size="lg" onClick={() => setStep("shipping")}>
                    Continue to Shipping <ArrowRight className="ml-2 h-4 w-4" />
                  </PremiumButton>
                </motion.div>
              )}

              {step === "shipping" && (
                <motion.div key="shipping" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  <h2 className="font-display text-2xl font-medium">Shipping Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "fullName", label: "Full Name", placeholder: "John Doe", col: 2 },
                      { key: "email", label: "Email", placeholder: "john@example.com", col: 2 },
                      { key: "address", label: "Street Address", placeholder: "123 Main St", col: 2 },
                      { key: "city", label: "City", placeholder: "New York", col: 1 },
                      { key: "state", label: "State", placeholder: "NY", col: 1 },
                      { key: "zip", label: "ZIP Code", placeholder: "10001", col: 1 },
                      { key: "country", label: "Country", placeholder: "United States", col: 1 },
                    ].map((field) => (
                      <div key={field.key} className={field.col === 2 ? "sm:col-span-2" : ""}>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {field.label}
                        </Label>
                        <Input
                          className="mt-1.5 h-11 bg-secondary/20 rounded-sm"
                          placeholder={field.placeholder}
                          value={(shippingData as any)[field.key]}
                          onChange={(e) => setShippingData((d) => ({ ...d, [field.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <PremiumButton variant="outline" onClick={() => setStep("cart")}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </PremiumButton>
                    <PremiumButton className="flex-1" size="lg" onClick={() => setStep("payment")}>
                      Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
                    </PremiumButton>
                  </div>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  <h2 className="font-display text-2xl font-medium">Payment Details</h2>
                  <div className="p-4 rounded-sm border border-border bg-secondary/20 text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 shrink-0" />
                    This is a demo. No real payment is processed.
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name on Card</Label>
                      <Input className="mt-1.5 h-11 bg-secondary/20 rounded-sm" placeholder="John Doe"
                        value={paymentData.cardName} onChange={(e) => setPaymentData(d => ({ ...d, cardName: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card Number</Label>
                      <Input className="mt-1.5 h-11 bg-secondary/20 rounded-sm font-mono" placeholder="4242 4242 4242 4242"
                        value={paymentData.cardNumber} onChange={(e) => setPaymentData(d => ({ ...d, cardNumber: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry</Label>
                        <Input className="mt-1.5 h-11 bg-secondary/20 rounded-sm font-mono" placeholder="MM / YY"
                          value={paymentData.expiry} onChange={(e) => setPaymentData(d => ({ ...d, expiry: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVV</Label>
                        <Input className="mt-1.5 h-11 bg-secondary/20 rounded-sm font-mono" placeholder="•••"
                          value={paymentData.cvv} onChange={(e) => setPaymentData(d => ({ ...d, cvv: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <PremiumButton variant="outline" onClick={() => setStep("shipping")}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </PremiumButton>
                    <PremiumButton className="flex-1" size="lg" isLoading={isProcessing} onClick={handlePlaceOrder}>
                      Place Order · ${(grandTotal / 100).toFixed(2)}
                    </PremiumButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 rounded-sm border border-border bg-card p-6 space-y-5">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground font-mono">
                Order Summary
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground truncate">
                      {item.product.name} <span className="text-muted-foreground/60">×{item.quantity}</span>
                    </span>
                    <span className="font-mono shrink-0">${((item.product.price * item.quantity) / 100).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">${(total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-mono">{shipping === 0 ? "Free" : `$${(shipping / 100).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (8%)</span>
                  <span className="font-mono">${(tax / 100).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-foreground">
                  <span>Total</span>
                  <span className="font-mono text-lg">${(grandTotal / 100).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-sm px-3 py-2">
                <Truck className="h-3.5 w-3.5 shrink-0" />
                White-glove delivery included
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
