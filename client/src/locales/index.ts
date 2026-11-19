import en from "./en/index";
import ru from "./ru/index";
import uz from "./uz/index";

export const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uz: { translation: uz },
};

export type { LocaleTranslations, SupportedLanguage } from "./types";
