import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { PremiumButton } from "@/shared/components/PremiumButton";

export default function AuthLinkPage({ kind }: { kind: "magic" | "account" }) {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (!token) {
      setError("This authentication link is incomplete.");
      return;
    }
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    const endpoint =
      kind === "magic"
        ? "/api/auth/magic-link/consume"
        : "/api/auth/account-link/consume";

    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "This link is invalid or expired.");
        queryClient.setQueryData(["/api/auth/me"], data);
        setLocation("/shop");
      })
      .catch((reason: Error) => setError(reason.message));
  }, [kind, queryClient, setLocation, location]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="font-display text-3xl font-bold">{t("auth.magicLinkExpired")}</h1>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/login">
            <PremiumButton variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("auth.backToSignIn")}
            </PremiumButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("auth.verifyingLink")}</span>
      </div>
    </div>
  );
}