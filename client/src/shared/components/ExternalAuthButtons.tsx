import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Github, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ExternalProvider = "google" | "github" | "telegram";
type Mode = "sign-in" | "link";

interface ProviderResponse {
  providers: ExternalProvider[];
}

interface Identity {
  provider: string;
}

const PROVIDERS: Array<{
  id: ExternalProvider;
  label: string;
  icon: "google" | "github" | "telegram";
}> = [
  { id: "google", label: "Google", icon: "google" },
  { id: "github", label: "GitHub", icon: "github" },
  { id: "telegram", label: "Telegram", icon: "telegram" },
];

function ProviderIcon({ provider }: { provider: "google" | "github" | "telegram" }) {
  if (provider === "github") return <Github aria-hidden="true" className="h-4 w-4" />;
  if (provider === "telegram") return <Send aria-hidden="true" className="h-4 w-4" />;
  return (
    <span aria-hidden="true" className="font-semibold text-sm leading-none">
      G
    </span>
  );
}

export function ExternalAuthButtons({ mode = "sign-in" }: { mode?: Mode }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const providersQuery = useQuery<ProviderResponse>({
    queryKey: ["/api/auth/external/providers"],
    queryFn: async () => {
      const response = await fetch("/api/auth/external/providers");
      if (!response.ok) throw new Error("Provider configuration unavailable");
      return response.json();
    },
    staleTime: 60_000,
    retry: false,
  });
  const identitiesQuery = useQuery<Identity[]>({
    queryKey: ["/api/auth/identities"],
    queryFn: async () => {
      const response = await fetch("/api/auth/identities");
      if (!response.ok) throw new Error("Linked identities unavailable");
      return response.json();
    },
    enabled: mode === "link",
    retry: false,
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const authError = url.searchParams.get("auth_error");
    if (!authError) return;

    const messages: Record<string, string> = {
      link_required: t("auth.linkExistingFirst"),
      identity_in_use: t("auth.providerAlreadyLinked"),
      email_in_use: t("auth.providerEmailInUse"),
      cancelled: t("auth.providerCancelled"),
      provider_failed: t("auth.providerFailed"),
    };
    toast({
      variant: authError === "cancelled" ? "default" : "destructive",
      title: t("common.error"),
      description: messages[authError] ?? messages.provider_failed,
    });
    url.searchParams.delete("auth_error");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [t, toast]);

  const enabledProviders = providersQuery.data?.providers ?? [];
  const linkedProviders = new Set(
    mode === "link"
      ? identitiesQuery.data
          ?.map((identity) => identity.provider)
          .filter((provider): provider is ExternalProvider =>
            provider === "google" || provider === "github" || provider === "telegram")
        ?? []
      : [],
  );
  const providers = PROVIDERS.filter(
    (provider) => enabledProviders.includes(provider.id)
      && (mode !== "link" || !linkedProviders.has(provider.id)),
  );

  if (providersQuery.isLoading || providers.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={t("auth.externalProviders")}>
      <div className="relative flex items-center">
        <div className="w-full border-t border-border" />
        <span className="absolute left-1/2 -translate-x-1/2 bg-background px-3 text-xs text-muted-foreground">
          {mode === "link" ? t("auth.connectProvider") : t("auth.continueWith")}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {providers.map((provider) => (
          <a
            key={provider.id}
            href={`/api/auth/external/${provider.id}${mode === "link" ? "/link" : ""}`}
            className="flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid={`button-${mode}-${provider.id}`}
          >
            <ProviderIcon provider={provider.icon} />
            <span>{provider.label}</span>
          </a>
        ))}
      </div>
      {mode === "link" && linkedProviders.size > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("auth.connectedProviders")}: {PROVIDERS.filter((provider) => linkedProviders.has(provider.id))
            .map((provider) => provider.label)
            .join(", ")}
        </p>
      )}
    </section>
  );
}
