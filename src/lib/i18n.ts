import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Minimal translations (safe to expand anytime).
// Default language: Uzbek (uz)
const resources = {
  uz: {
    translation: {
      common: {
        home: "Bosh sahifa",
        logout: "Chiqish",
        admin: "Admin",
        superAdmin: "Super Admin",
        dashboard: "Umumiy ko'rinish",
        organizations: "Tashkilotlar",
        tourismers: "Turizmchilar",
        events: "Tadbirlar",
        users: "Foydalanuvchilar",
        admins: "Adminlar",
        hotels: "Mehmonxonalar",
        search: "Qidirish",
        delete: "O'chirish",
        cancel: "Bekor qilish",
        confirmDelete: "O'chirishni tasdiqlaysizmi?",
        deleted: "O'chirildi",
        accessDenied: "Ruxsat yo'q",
      },
      home: {
        trustedLinks: "Ishonchli havolalar",
      },
    },
  },
  ru: {
    translation: {
      common: {
        home: "Главная",
        logout: "Выйти",
        admin: "Админ",
        superAdmin: "Супер-админ",
        dashboard: "Обзор",
        organizations: "Организации",
        tourismers: "Туризм",
        events: "События",
        users: "Пользователи",
        admins: "Админы",
        hotels: "Отели",
        search: "Поиск",
        delete: "Удалить",
        cancel: "Отмена",
        confirmDelete: "Подтвердить удаление?",
        deleted: "Удалено",
        accessDenied: "Нет доступа",
      },
      home: {
        trustedLinks: "Надёжные ссылки",
      },
    },
  },
  en: {
    translation: {
      common: {
        home: "Home",
        logout: "Logout",
        admin: "Admin",
        superAdmin: "Super Admin",
        dashboard: "Overview",
        organizations: "Organizations",
        tourismers: "Tour orgs",
        events: "Events",
        users: "Users",
        admins: "Admins",
        hotels: "Hotels",
        search: "Search",
        delete: "Delete",
        cancel: "Cancel",
        confirmDelete: "Confirm delete?",
        deleted: "Deleted",
        accessDenied: "Access denied",
      },
      home: {
        trustedLinks: "Trusted links",
      },
    },
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "uz",
    supportedLngs: ["uz", "ru", "en"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
  });

export default i18n;
