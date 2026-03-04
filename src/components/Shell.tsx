import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2,
  LogOut,
  Ticket,
  Home,
  Settings,
  Hotel,
  Star,
  Shield,
  Menu,
  X,
} from "lucide-react";

export const ICONS: Record<string, any> = {
  home: Home,
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  users: Users,
  org: Building2,
  events: Ticket,
  hotel: Hotel,
  star: Star,
  settings: Settings,
  shield: Shield,
};

interface SItem {
  label: string;
  to: string;
  icon: string;
}
interface Props {
  items: SItem[];
  title: string;
  children: React.ReactNode;
}

export default function Shell({ items, title, children }: Props) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background:
                "linear-gradient(135deg,var(--accent),var(--accent2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ticket size={16} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "DM Sans,sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--text)",
              }}
            >
              TripDay
            </div>
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}
            >
              {title}
            </div>
          </div>
        </div>
        <button
          className="shell-close-btn"
          onClick={() => setOpen(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/" || !item.to.includes("?")}
              className={({ isActive }) => `sl ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div
          style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Language</div>
            <LanguageSwitcher />
          </div>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "var(--surface2)",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.fullName || user.email}
            </div>
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
            >
              {user.roles[0] || "User"}
            </div>
          </div>
          <button
            className="sl"
            style={{ width: "100%" }}
            onClick={() => {
              logout();
              nav("/");
            }}
          >
            <LogOut size={15} />
            <span>{t("common.logout")}</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Overlay (mobile) */}
      <div
        className={`shell-overlay${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`sidebar${open ? " open" : ""}`}
        style={{
          padding: 0,
          background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))",
          borderRight: "1px solid var(--border)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="main-content" style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile top bar */}
        <div className="shell-mobile-bar">
          <button
            onClick={() => setOpen(true)}
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "6px 8px",
              cursor: "pointer",
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Menu size={18} />
          </button>
          <div
            style={{
              fontFamily: "DM Sans,sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--text)",
            }}
          >
            {title}
          </div>

          <div style={{ marginLeft: "auto" }}>
            <LanguageSwitcher />
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
