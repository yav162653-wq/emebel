import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en";
import uz from "@/locales/uz";
import ru from "@/locales/ru";

const STORAGE_KEY = "space_lang";

const savedLang = localStorage.getItem(STORAGE_KEY) || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
