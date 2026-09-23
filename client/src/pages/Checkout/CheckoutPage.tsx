import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, ShoppingBag, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type Step = "cart" | "shipping" | "payment";

const stepIndex = (s: Step) => ["cart", "shipping", "payment"].indexOf(s);

export default function CheckoutPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("cart");
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, total } = useCart();
  const { toast } = useToast();

  const shipping = total > 50000 ? 0 : 2900;
  const tax      = Math.round(total * 0.08);
  const grandTotal = total + shipping + tax;

  const [shippingData, setShippingData] = useState({ email: "" });

  const STEPS: { key: Step; labelKey: string; icon: typeof ShoppingBag }[] = [
    { key: "cart",     labelKey: "checkout.review",   icon: ShoppingBag },
    { key: "shipping", labelKey: "checkout.shipping",  icon: MapPin      },
    { key: "payment",  labelKey: "checkout.payment",   icon: CreditCard  },
  ];

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    const checkoutWindow = window.open("about:blank", "_blank");
    try {
      if (!checkoutWindow) {
        throw new Error("Please allow popups to continue to secure checkout");
      }
      checkoutWindow.opener = null;

      const res = await fetch("/api/shopify/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(shippingData.email ? { email: shippingData.email } : {}),
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.checkoutUrl) {
        throw new Error(payload.error ?? "Checkout failed");
      }

      checkoutWindow.location.replace(payload.checkoutUrl);
    } catch {
      checkoutWindow?.close();
      toast({ variant: "destructive", title: t("checkout.orderFailed"), description: t("checkout.tryAgain") });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <h2 className="font-display text-3xl font-medium">{t("checkout.emptyBag")}</h2>
          <p className="text-muted-foreground">{t("checkout.emptyBagDesc")}</p>
          <Link href="/shop"><PremiumButton>{t("checkout.browseShop")}</PremiumButton></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/shop">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> {t("checkout.backToShop")}
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
                      isActive    ? "bg-background border-primary" :
                                    "bg-background border-border"
                    }`}>
                      {isCompleted
                        ? <Check className="h-4 w-4 text-primary-foreground" />
                        : <s.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      }
                    </div>
                    <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {t(s.labelKey)}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-24 h-0.5 mx-2 mb-5 transition-colors duration-300 ${i < current ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {step === "cart" && (
                <motion.div key="cart" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  <h2 className="font-display text-2xl font-medium">{t("checkout.reviewYourBag")}</h2>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 rounded-sm border border-border bg-card">
                        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-secondary/30">
                          <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.product.category}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t("checkout.qty")}: {item.quantity}</p>
                        </div>
                        <span className="font-mono text-sm font-semibold shrink-0">
                          ${((item.product.price * item.quantity) / 100).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <PremiumButton className="w-full" size="lg" onClick={() => setStep("shipping")} data-testid="button-continue-shipping">
                    {t("checkout.continueToShipping")} <ArrowRight className="ml-2 h-4 w-4" />
                  </PremiumButton>
                </motion.div>
              )}

              {step === "shipping" && (
                <motion.div key="shipping" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  <h2 className="font-display text-2xl font-medium">{t("checkout.shippingInformation")}</h2>
                  <div className="rounded-sm border border-border bg-secondary/20 p-4 text-sm text-muted-foreground leading-relaxed">
                    {t("checkout.secureCheckoutNotice")}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("checkout.email")}</Label>
                    <Input
                      type="email"
                      className="mt-1.5 h-11 bg-secondary/20 rounded-sm"
                      placeholder="john@example.com"
                      value={shippingData.email}
                      onChange={(e) => setShippingData({ email: e.target.value })}
                      data-testid="input-email"
                    />
                  </div>
                  <div className="flex gap-3">
                    <PremiumButton variant="outline" onClick={() => setStep("cart")}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> {t("checkout.back")}
                    </PremiumButton>
                    <PremiumButton className="flex-1" size="lg" onClick={() => setStep("payment")} data-testid="button-continue-payment">
                      {t("checkout.continueToPayment")} <ArrowRight className="ml-2 h-4 w-4" />
                    </PremiumButton>
                  </div>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  <h2 className="font-display text-2xl font-medium">{t("checkout.paymentDetails")}</h2>
                  <div className="p-4 rounded-sm border border-border bg-secondary/20 text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 shrink-0" />
                    {t("checkout.securePaymentNotice")}
                  </div>
                  <div className="flex gap-3">
                    <PremiumButton variant="outline" onClick={() => setStep("shipping")}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> {t("checkout.back")}
                    </PremiumButton>
                    <PremiumButton
                      className="flex-1" size="lg"
                      isLoading={isProcessing}
                      onClick={handlePlaceOrder}
                      data-testid="button-place-order"
                    >
                      {t("checkout.placeOrder")} · ${(grandTotal / 100).toFixed(2)}
                    </PremiumButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 rounded-sm border border-border bg-card p-6 space-y-5">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground font-mono">{t("checkout.orderSummary")}</h3>
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
                  <span>{t("checkout.subtotal")}</span><span className="font-mono">${(total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("checkout.shipping_label")}</span>
                  <span className="font-mono">
                    {shipping === 0
                      ? <span className="text-green-600 dark:text-green-400">{t("checkout.free")}</span>
                      : `$${(shipping / 100).toFixed(2)}`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("checkout.tax")}</span><span className="font-mono">${(tax / 100).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-foreground">
                  <span>{t("checkout.total")}</span>
                  <span className="font-mono text-lg">${(grandTotal / 100).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-sm px-3 py-2">
                <Truck className="h-3.5 w-3.5 shrink-0" /> {t("checkout.whiteGlove")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
