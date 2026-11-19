import { useTranslation } from "react-i18next";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { cn } from "@/lib/utils";

interface QueryErrorStateProps {
  onRetry?: () => unknown;
  className?: string;
}

export function QueryErrorState({ onRetry, className }: QueryErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 text-center", className)}
    >
      <p className="text-sm text-destructive">{t("common.error")}</p>
      {onRetry && (
        <PremiumButton
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void onRetry()}
        >
          {t("common.retry")}
        </PremiumButton>
      )}
    </div>
  );
}
