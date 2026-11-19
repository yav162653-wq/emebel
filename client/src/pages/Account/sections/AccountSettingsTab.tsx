import { useTranslation } from "react-i18next";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { ExternalAuthButtons } from "@/shared/components/ExternalAuthButtons";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface AccountSettingsTabProps {
  name: string;
  fullName: string;
  username: string;
  email: string;
  emailVerified: boolean;
  isSaving: boolean;
  isSendingVerification: boolean;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onSave: () => void;
  onSendVerification: () => void;
}

export function AccountSettingsTab({
  name,
  fullName,
  username,
  email,
  emailVerified,
  isSaving,
  isSendingVerification,
  onNameChange,
  onEmailChange,
  onSave,
  onSendVerification,
}: AccountSettingsTabProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">{t("account.profile")}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("account.fullName")}</label>
            <Input
              className="mt-1.5 h-11 bg-secondary/30"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              data-testid="input-profile-name"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("account.username")}</label>
            <Input
              className="mt-1.5 h-11 bg-secondary/30 opacity-60 cursor-not-allowed"
              value={username}
              disabled
            />
          </div>
        </div>
        <PremiumButton
          size="sm"
          isLoading={isSaving}
          onClick={onSave}
          data-testid="button-save-profile"
          disabled={name === fullName || !name.trim()}
        >
          {t("account.saveChanges")}
        </PremiumButton>
      </div>
      <Separator />
      <ExternalAuthButtons mode="link" />
      <Separator />
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">{t("account.signInEmail")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {emailVerified
              ? t("account.emailVerified")
              : t("account.emailNotVerified")}
          </p>
        </div>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          className="h-11 bg-secondary/30"
          data-testid="input-account-email"
        />
        <PremiumButton
          size="sm"
          variant="outline"
          isLoading={isSendingVerification}
          disabled={!email.trim()}
          onClick={onSendVerification}
          data-testid="button-verify-account-email"
        >
          {t("account.sendVerification")}
        </PremiumButton>
      </div>
      <Separator />
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">{t("account.overview")}</h3>
        <div className="space-y-3">
          {[
            { label: t("account.orderConfirmationEmails"), checked: true },
            { label: t("account.newArrivalsNewsletter"), checked: false },
            { label: t("account.exclusiveMemberOffers"), checked: true },
          ].map((pref) => (
            <label key={pref.label} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                defaultChecked={pref.checked}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground group-hover:text-accent transition-colors">{pref.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
