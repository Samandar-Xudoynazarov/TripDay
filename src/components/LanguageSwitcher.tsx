import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  compact?: boolean;
  className?: string;
};

export default function LanguageSwitcher({ compact = false, className = "" }: Props) {
  const { i18n } = useTranslation();
  const value = i18n.language?.split("-")[0] || "uz";

  const set = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-slate-700 shadow-sm backdrop-blur ${className}`.trim()}
      aria-label="Language switcher"
    >
      <Languages className={compact ? "h-4 w-4" : "h-4 w-4 text-blue-600"} />
      <select
        value={value}
        onChange={(e) => set(e.target.value)}
        className={`bg-transparent outline-none ${compact ? "text-xs font-semibold" : "text-sm font-medium"}`}
        aria-label="Language"
      >
        <option value="uz">O'zбекча</option>
        <option value="ru">Русский</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
