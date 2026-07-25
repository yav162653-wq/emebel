import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PremiumButton } from "@/shared/components/PremiumButton";

const LANGUAGES = [
  { code: "en", flag: "🇺🇸" },
  { code: "uz", flag: "🇺🇿" },
  { code: "ru", flag: "🇷🇺" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PremiumButton
          variant="ghost"
          size={compact ? "icon" : "sm"}
          data-testid="button-language-switcher"
          aria-label="Change language"
          className="gap-1.5"
        >
          <Globe className="h-4 w-4" />
          {!compact && (
            <span className="text-xs font-mono uppercase">{current.code}</span>
          )}
        </PremiumButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            data-testid={`lang-option-${lang.code}`}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`cursor-pointer gap-2.5 ${
              i18n.language === lang.code ? "font-semibold text-accent" : ""
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span className="text-sm">{t(`lang.${lang.code}`)}</span>
            {i18n.language === lang.code && (
              <span className="ml-auto text-[10px] text-accent">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
