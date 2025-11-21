import i18n from "i18next"
import { initReactI18next } from "react-i18next"

// Import translation files
import enCommon from "../../public/locales/en/common.json"
import idCommon from "../../public/locales/id/common.json"

const resources = {
  en: {
    common: enCommon,
  },
  id: {
    common: idCommon,
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: typeof window !== "undefined" ? localStorage.getItem("language") || "en" : "en",
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
