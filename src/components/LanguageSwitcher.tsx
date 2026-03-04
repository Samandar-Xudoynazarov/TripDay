import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const value = i18n.language?.split("-")[0] || "uz";

  const set = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  return (
    <select
      value={value}
      onChange={(e) => set(e.target.value)}
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "6px 10px",
        fontSize: 12,
        color: "var(--text)",
        outline: "none",
      }}
      aria-label="Language"
    >
      <option value="uz">UZ</option>
      <option value="ru">RU</option>
      <option value="en">EN</option>
    </select>
  );
}
