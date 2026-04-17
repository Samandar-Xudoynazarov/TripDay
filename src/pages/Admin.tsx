import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { orgsSvc, adminSvc, usersSvc, eventsSvc } from "@/lib/api";
import { normalizeRoles } from "@/lib/auth";
import Shell from "@/components/Shell";
import EditEventDialog from "@/components/EditEventDialog";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Ticket,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Shield,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";

function toArr(d: any) {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.content)) return d.content;
  return [];
}

type Tab = "overview" | "orgs" | "events" | "users" | "tour" | "admins";

export default function AdminPage() {
  const { user, isLoading, hasRole } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const { t } = useTranslation();

  const isSuper = hasRole("SUPER_ADMIN");
  const base = isSuper ? "/super-admin" : "/admin";
  const label = isSuper ? t("common.superAdmin") : t("common.admin");

  const tabFromUrl = (() => {
    const t = new URLSearchParams(loc.search).get("tab") as Tab;
    return ["overview", "orgs", "events", "users", "tour", "admins"].includes(t)
      ? t
      : "overview";
  })();

  const [tab, setTab] = useState<Tab>(tabFromUrl);
  useEffect(() => setTab(tabFromUrl), [tabFromUrl]);
  const goTab = (t: Tab) => nav(`${base}?tab=${t}`);

  const [orgs, setOrgs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [tourOrgs, setTourOrgs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // Reject modals
  const [rejectOrg, setRejectOrg] = useState<number | null>(null);
  const [rejectOrgReason, setRejectOrgReason] = useState("");
  const [rejectEv, setRejectEv] = useState<number[]>([]);
  const [rejectEvReason, setRejectEvReason] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user || (!hasRole("ADMIN") && !hasRole("SUPER_ADMIN"))) {
      nav("/login");
      return;
    }
    load();
  }, [user, isLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const pendingEventsPromise = isSuper
        ? Promise.resolve([])
        : adminSvc.pendingEvents();
      // Management endpoints (role-based):
      // - /management/tour-organizations  → ADMIN + SUPER_ADMIN
      // - /management/admins              → SUPER_ADMIN only
      const tourPromise = (async () => {
        try {
          // lazy import to avoid circular
          const { mgmtSvc } = await import("@/lib/api");
          return mgmtSvc.getTour();
        } catch {
          return [];
        }
      })();
      const adminsPromise = (async () => {
        if (!isSuper) return [];
        try {
          const { mgmtSvc } = await import("@/lib/api");
          return mgmtSvc.getAdmins();
        } catch {
          return [];
        }
      })();

      const [o, u, ev, pEv, tOrgs, adms] = await Promise.all([
        orgsSvc.getAll(),
        usersSvc.getAll(),
        eventsSvc.getAll(),
        pendingEventsPromise,
        tourPromise,
        adminsPromise,
      ]);
      setOrgs(toArr(o));
      setUsers(toArr(u).filter((x: any) => x?.enabled !== false));
      setEvents(toArr(ev));
      setPendingEvents(toArr(pEv));
      setTourOrgs(toArr(tOrgs).filter((x: any) => x?.enabled !== false));
      setAdmins(toArr(adms).filter((x: any) => x?.enabled !== false));
    } catch {
      toast.error("Ma'lumotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  const pendingOrgs = useMemo(() => orgs.filter((o) => !o.verified), [orgs]);
  const verifiedOrgs = useMemo(() => orgs.filter((o) => o.verified), [orgs]);

  // Ko'p kunlik tadbirlarni bitta guruhga birlashtirish
  const pendingEventGroups = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const ev of pendingEvents) {
      const key = `${String(ev.title || "").trim()}__${String(ev.organizationId || "")}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ev);
    }
    return [...groups.values()].map((siblings) => ({
      representative: siblings[0],
      allIds: siblings.map((s) => s.id),
      count: siblings.length,
    }));
  }, [pendingEvents]);

  const items = [
    {
      label: t("common.dashboard"),
      to: `${base}?tab=overview`,
      icon: "dashboard",
    },
    { label: t("common.organizations"), to: `${base}?tab=orgs`, icon: "org" },
    { label: t("common.tourismers"), to: `${base}?tab=tour`, icon: "shield" },
    { label: t("common.events"), to: `${base}?tab=events`, icon: "events" },
    { label: t("common.users"), to: `${base}?tab=users`, icon: "users" },
    ...(isSuper
      ? [{ label: t("common.admins"), to: `${base}?tab=admins`, icon: "users" }]
      : []),
    { label: t("common.hotels"), to: `${base}/hotels`, icon: "hotel" },
    { label: t("common.home"), to: "/", icon: "home" },
  ];

  const countryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of users) {
      const c = String(u?.country ?? "Unknown").trim() || "Unknown";
      map.set(c, (map.get(c) || 0) + 1);
    }
    return [...map.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [users]);

  const roleData = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of users) {
      const roles = normalizeRoles(u?.roles ?? u?.authorities);
      const r = roles[0] || "USER";
      map.set(r, (map.get(r) || 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const x = q.toLowerCase();
    if (!x) return users;
    return users.filter((u) =>
      `${u.fullName}${u.email}${u.phone}`.toLowerCase().includes(x),
    );
  }, [users, q]);

  const filteredOrgs = useMemo(() => {
    const x = q.toLowerCase();
    if (!x) return orgs;
    return orgs.filter((o) => o.name?.toLowerCase().includes(x));
  }, [orgs, q]);

  const approveOrg = async (id: number) => {
    await adminSvc.approveOrg(id);
    toast.success("Tasdiqlandi");
    load();
  };
  const doRejectOrg = async () => {
    if (!rejectOrg || !rejectOrgReason.trim()) {
      toast.error("Sabab kiriting");
      return;
    }
    await adminSvc.rejectOrg(rejectOrg, rejectOrgReason);
    toast.success("Rad etildi");
    setRejectOrg(null);
    setRejectOrgReason("");
    load();
  };
  const approveEv = async (ids: number[]) => {
    await Promise.all(ids.map((id) => adminSvc.approveEvent(id)));
    toast.success(ids.length > 1 ? `${ids.length} ta kun tasdiqlandi ✅` : "Tasdiqlandi ✅");
    load();
  };
  const doRejectEv = async () => {
    if (!rejectEv.length || !rejectEvReason.trim()) {
      toast.error("Sabab kiriting");
      return;
    }
    await Promise.all(rejectEv.map((id) => adminSvc.rejectEvent(id, rejectEvReason)));
    toast.success(rejectEv.length > 1 ? `${rejectEv.length} ta kun rad etildi` : "Rad etildi");
    setRejectEv([]);
    setRejectEvReason("");
    load();
  };

  const deleteEv = async (id: number) => {
    if (!confirm("Eventni butunlay o‘chirishni xohlaysizmi?")) return;
    try {
      await eventsSvc.delete(id);
      toast.success("Event o‘chirildi");
      load();
    } catch {
      toast.error("Eventni o‘chirib bo‘lmadi");
    }
  };
  const makeAdmin = async (uid: number) => {
    if (!confirm("Admin qilish?")) return;
    await adminSvc.makeAdmin(uid);
    toast.success("Admin qilindi");
    load();
  };
  const makeTour = async (uid: number) => {
    if (!confirm("Tashkilotchi qilish?")) return;
    await adminSvc.makeTour(uid);
    toast.success("Tashkilotchi qilindi");
    load();
  };

  const updateEvent = async (eventId: number, payload: any) => {
    try {
      await eventsSvc.update(eventId, payload);
      toast.success("Event yangilandi");
      await load();
    } catch {
      toast.error("Eventni yangilab bo'lmadi");
      throw new Error("Event update failed");
    }
  };
  const toggleUser = async (uid: number, enabled: boolean) => {
    try {
      if (enabled) {
        if (!confirm("Userni butunlay o'chirasizmi?")) return;
        await usersSvc.delete(uid);
        toast.success("User o'chirildi");
      } else {
        await usersSvc.setEnabled(uid, true);
        toast.success("User yoqildi");
      }
      load();
    } catch {
      toast.error("Userni yangilab bo'lmadi");
    }
  };

  const SCard = ({ val, label, icon, accent, onClick, bg }: any) => (
    <div
      className="card"
      style={{
        padding: "20px 22px",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",

        background:
          bg ||
          "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(56,189,248,0.10))",
        border: "1px solid var(--border)",
        boxShadow: "0 12px 30px rgba(2,6,23,0.08)",
      }}
      onClick={onClick}
    >
      <div className="stat-top" />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontFamily: "DM Sans,sans-serif",
              fontWeight: 800,
              fontSize: 32,
              color: accent || "var(--text)",
            }}
          >
            {val}
          </div>
        </div>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${accent || "var(--accent)"}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <Shell items={items} title={label}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <div className="spinner" />
        </div>
      </Shell>
    );

  return (
    <Shell items={items} title={label}>
      <div style={{ padding: "16px", minHeight: "0" }} className="sm:p-7">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: "blue",
                marginBottom: 4,
              }}
            >
              {label} Panel
            </h1>
            <p style={{ fontSize: 18, color: "blue" }}>
              Barcha ma'lumotlarni boshqaring
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "blue",
              borderRadius: "15px",
            }}
          >
            <button className="btn btn-ghost btn-sm " onClick={load}>
              <RefreshCw size={14} style={{ color: "white" }} />
              Yangilash
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="tabs-list"
          style={{
            marginBottom: 28,
            maxWidth: 500,
            display: "flex",
            gap: "15px",
          }}
        >
          {(
            ([
              "overview",
              "orgs",
              "tour",
              "events",
              "users",
              ...(isSuper ? (["admins"] as Tab[]) : []),
            ] as Tab[])
          ).map((t) => (
            <button
              key={t}
              className={`tab-btn${tab === t ? " active" : ""}`}
              onClick={() => goTab(t)}
              style={{
                background:
                  tab === t
                    ? "linear-gradient(135deg,var(--accent),var(--accent2))"
                    : "rgba(255,255,255,0.7)",
                color: tab === t ? "#fff" : "var(--text)",
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid var(--border)",
                fontWeight: 700,
              }}
            >
              {t === "overview"
                ? "Umumiy"
                : t === "orgs"
                  ? "Tashkilotlar"
                  : t === "tour"
                    ? "Turizmchilar"
                  : t === "events"
                    ? "Tadbirlar"
                    : t === "users"
                      ? "Foydalanuvchilar"
                      : "Adminlar"}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="anim-in">
            <div className="grid gap-4 mb-7 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
              <SCard
                val={pendingOrgs.length}
                label="Kutilayotgan tashkilotlar"
                icon={<Clock size={18} color="#fbbf24" />}
                accent="#f59e0b"
                bg="linear-gradient(135deg, rgba(245,158,11,0.18), rgba(56,189,248,0.08))"
                onClick={() => goTab("orgs")}
              />

              <SCard
                val={pendingEvents.length}
                label="Kutilayotgan tadbirlar"
                icon={<Clock size={18} color="#f06292" />}
                accent="#ec4899"
                bg="linear-gradient(135deg, rgba(236,72,153,0.14), rgba(37,99,235,0.08))"
                onClick={() => goTab("events")}
              />

              <SCard
                val={verifiedOrgs.length}
                label="Tasdiqlangan tashkilotlar"
                icon={<Building2 size={18} color="#4ade80" />}
                accent="#16a34a"
                bg="linear-gradient(135deg, rgba(34,197,94,0.14), rgba(56,189,248,0.08))"
              />

              <SCard
                val={users.length}
                label="Jami foydalanuvchilar"
                icon={<Users size={18} color="var(--accent)" />}
                bg="linear-gradient(135deg, rgba(37,99,235,0.14), rgba(56,189,248,0.10))"
              />

              <SCard
                val={events.length}
                label="Jami tadbirlar"
                icon={<Ticket size={18} color="#67e8f9" />}
                accent="#0284c7"
                bg="linear-gradient(135deg, rgba(56,189,248,0.16), rgba(37,99,235,0.08))"
              />
            </div>

            {/* STATISTICS (charts) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
                gap: 16,
                marginBottom: 18,
              }}
            >
              <div
                className="card"
                style={{
                  padding: 18,
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  boxShadow: "0 14px 34px rgba(2,6,23,0.08)",
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 10 }}>
                  Foydalanuvchilar: davlatlar bo'yicha
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={countryData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={55} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="rgba(37,99,235,0.75)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                className="card"
                style={{
                  padding: 18,
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  boxShadow: "0 14px 34px rgba(2,6,23,0.08)",
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 10 }}>
                  Rollar taqsimoti
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={95}>
                        {roleData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={[
                              "rgba(37,99,235,0.85)",
                              "rgba(56,189,248,0.85)",
                              "rgba(34,197,94,0.75)",
                              "rgba(245,158,11,0.75)",
                              "rgba(236,72,153,0.75)",
                              "rgba(15,23,42,0.65)",
                            ][idx % 6]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pending orgs quick */}
            {pendingOrgs.length > 0 && (
              <div
                className="mb-5"
                style={{
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(56,189,248,0.08))",
                  boxShadow: "0 14px 34px rgba(2,6,23,0.08)",
                  overflow: "hidden",
                }}
              >
                {/* header */}
                <div
                  className="px-5 py-4"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Clock size={15} color="#fbbf24" />
                  <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>
                    Tasdiqlanmagan tashkilotlar
                  </span>

                  <span
                    style={{
                      marginLeft: "auto",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 999,
                      background: "rgba(245,158,11,0.14)",
                      border: "1px solid rgba(245,158,11,0.20)",
                      color: "#92400e",
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {pendingOrgs.length}
                  </span>
                </div>

                {/* rows */}
                {pendingOrgs.slice(0, 5).map((org) => (
                  <div
                    key={org.id}
                    className="px-5 py-3.5 border-b border-white/10 last:border-b-0 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-sky-50 truncate">
                        {org.name}
                      </div>
                      <div className="text-[12px] text-sky-100/80 truncate">
                        {org.address}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold
                           bg-emerald-400/15 text-emerald-100 border border-emerald-300/20
                           hover:bg-emerald-400/25 hover:border-emerald-200/40 transition"
                        onClick={() => approveOrg(org.id)}
                      >
                        <CheckCircle size={13} />
                        Tasdiqlash
                      </button>

                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold
                           bg-rose-400/15 text-rose-100 border border-rose-300/20
                           hover:bg-rose-400/25 hover:border-rose-200/40 transition"
                        onClick={() => {
                          setRejectOrg(org.id);
                          setRejectOrgReason("");
                        }}
                      >
                        <XCircle size={13} />
                        Rad
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending events quick */}
            {pendingEventGroups.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-sky-50 shadow-lg">
                {/* header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                  <Clock size={15} color="#f06292" />
                  <span className="font-bold text-[15px] text-sky-50">
                    Tasdiqlanmagan tadbirlar
                  </span>
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-rose-400/15 text-rose-100 border border-rose-300/20 px-2.5 py-1 text-xs font-semibold">
                    {pendingEventGroups.length}
                  </span>
                </div>

                {/* rows — guruhlangan */}
                {pendingEventGroups.slice(0, 5).map((group) => (
                  <div
                    key={group.representative.id}
                    className="px-5 py-3.5 border-b border-white/10 last:border-b-0 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-sky-50 truncate flex items-center gap-2">
                        {group.representative.title}
                        {group.count > 1 && (
                          <span className="inline-flex items-center rounded-full bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                            {group.count} kun
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-sky-100/80 truncate">
                        {group.representative.locationName}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold
                           bg-emerald-400/15 text-emerald-100 border border-emerald-300/20
                           hover:bg-emerald-400/25 hover:border-emerald-200/40 transition"
                        onClick={() => approveEv(group.allIds)}
                      >
                        <CheckCircle size={13} />
                        Tasdiqlash
                      </button>

                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold
                           bg-rose-400/15 text-rose-100 border border-rose-300/20
                           hover:bg-rose-400/25 hover:border-rose-200/40 transition"
                        onClick={() => {
                          setRejectEv(group.allIds);
                          setRejectEvReason("");
                        }}
                      >
                        <XCircle size={13} />
                        Rad
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TOUR ORGS (ADMIN + SUPER_ADMIN) */}
        {tab === "tour" && (
          <div className="anim-in">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Shield size={18} color="var(--accent)" />
              <div style={{ fontWeight: 900, fontSize: 16 }}>Turizmchilar ro'yxati</div>
            </div>

            <div style={{ maxWidth: 520, marginBottom: 14 }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Qidirish (nom, email, tel...)"
                className="inp"
              />
            </div>

            <div
              className="card"
              style={{
                background: "rgba(255,255,255,0.86)",
                border: "1px solid var(--border)",
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nomi</th>
                      <th>Manzil</th>
                      <th>Email</th>
                      <th>Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(q
                      ? tourOrgs.filter((o) =>
                          `${o?.name ?? ""}${o?.email ?? ""}${o?.phone ?? ""}${o?.address ?? ""}`
                            .toLowerCase()
                            .includes(q.toLowerCase()),
                        )
                      : tourOrgs
                    ).map((o: any) => (
                      <tr key={o?.id ?? Math.random()}>
                        <td>{o?.id ?? "—"}</td>
                        <td style={{ fontWeight: 700 }}>{o?.name ?? "—"}</td>
                        <td>{o?.address ?? "—"}</td>
                        <td>{o?.email ?? "—"}</td>
                        <td>
                          {o?.verified ? (
                            <span className="tag tag-green">Verified</span>
                          ) : (
                            <span className="tag tag-yellow">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ADMINS (SUPER_ADMIN only) */}
        {tab === "admins" && isSuper && (
          <div className="anim-in">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Users size={18} color="var(--accent)" />
              <div style={{ fontWeight: 900, fontSize: 16 }}>Adminlar ro'yxati</div>
            </div>

            <div
              className="card"
              style={{
                background: "rgba(255,255,255,0.86)",
                border: "1px solid var(--border)",
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ism</th>
                      <th>Email</th>
                      <th>Telefon</th>
                      <th>Davlat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a: any) => (
                      <tr key={a?.id ?? Math.random()}>
                        <td>{a?.id ?? "—"}</td>
                        <td style={{ fontWeight: 800 }}>{a?.fullName ?? a?.name ?? "—"}</td>
                        <td>{a?.email ?? "—"}</td>
                        <td>{a?.phone ?? "—"}</td>
                        <td>{a?.country ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORGS */}
        {tab === "orgs" && (
          <div className="anim-in">
            {/* Search */}
            <div className="relative mb-4 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tashkilot nomi..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Table Card */}
            <div
              className="overflow-hidden rounded-2xl border border-white/10 
                    bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 
                    text-sky-50 shadow-lg
                    transition-all duration-300 
                    hover:-translate-y-1 
                    hover:bg-black hover:from-black hover:via-black hover:to-black 
                    hover:shadow-2xl"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  {/* Head */}
                  <thead className="bg-white/5 text-sky-100 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-5 py-4 text-left">ID</th>
                      <th className="px-5 py-4 text-left">Nomi</th>
                      <th className="px-5 py-4 text-left">Manzil</th>
                      <th className="px-5 py-4 text-left">Holat</th>
                      <th className="px-5 py-4 text-left">Amallar</th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody className="divide-y divide-white/10">
                    {filteredOrgs.map((org) => (
                      <tr key={org.id} className="hover:bg-white/5 transition">
                        <td className="px-5 py-3 text-xs text-sky-200/70">
                          {org.id}
                        </td>

                        <td className="px-5 py-3 font-semibold text-sky-50">
                          {org.name}
                        </td>

                        <td className="px-5 py-3 text-xs text-sky-200/70">
                          {org.address || "—"}
                        </td>

                        <td className="px-5 py-3">
                          {org.verified ? (
                            <span
                              className="inline-flex items-center rounded-full 
                                     bg-emerald-400/15 text-emerald-200 
                                     border border-emerald-300/20 
                                     px-2.5 py-1 text-xs font-semibold"
                            >
                              Tasdiqlangan
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center rounded-full 
                                     bg-yellow-400/15 text-yellow-200 
                                     border border-yellow-300/20 
                                     px-2.5 py-1 text-xs font-semibold"
                            >
                              Kutilmoqda
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3">
                          {!org.verified && (
                            <div className="flex gap-2">
                              <button
                                className="inline-flex items-center justify-center
                                   rounded-lg px-3 py-2 text-xs font-semibold
                                   bg-emerald-400/15 text-emerald-100 
                                   border border-emerald-300/20
                                   hover:bg-emerald-400/25 
                                   transition"
                                onClick={() => approveOrg(org.id)}
                              >
                                <CheckCircle size={12} />
                              </button>

                              <button
                                className="inline-flex items-center justify-center
                                   rounded-lg px-3 py-2 text-xs font-semibold
                                   bg-rose-400/15 text-rose-100 
                                   border border-rose-300/20
                                   hover:bg-rose-400/25 
                                   transition"
                                onClick={() => {
                                  setRejectOrg(org.id);
                                  setRejectOrgReason("");
                                }}
                              >
                                <XCircle size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EVENTS */}
        {tab === "events" && (() => {
          // Barcha eventlarni title+organizationId bo'yicha guruhlaymiz
          const allEventsMap = new Map<string, any[]>();
          const combined = [
            ...pendingEvents,
            ...events.filter((ev) => !pendingEvents.some((p) => p.id === ev.id)),
          ];
          for (const ev of combined) {
            const key = `${String(ev.title || "").trim()}__${String(ev.organizationId || "")}`;
            if (!allEventsMap.has(key)) allEventsMap.set(key, []);
            allEventsMap.get(key)!.push(ev);
          }
          const groupedEvents = [...allEventsMap.values()].map((siblings) => {
            const rep = siblings[0];
            const pendingIds = siblings
              .filter((s) => pendingEvents.some((p) => p.id === s.id))
              .map((s) => s.id);
            const isPending = pendingIds.length > 0;
            const allIds = siblings.map((s) => s.id);
            return { rep, siblings, pendingIds, allIds, isPending, count: siblings.length };
          });

          return (
            <div className="anim-in">
              {/* Stats */}
              <div className="mb-4 flex gap-3">
                <span className="inline-flex items-center rounded-full bg-rose-400/15 text-rose-200 border border-rose-300/20 px-3 py-1 text-xs font-semibold">
                  {pendingEventGroups.length} kutilmoqda
                </span>
                <span className="inline-flex items-center rounded-full bg-sky-400/15 text-sky-200 border border-sky-300/20 px-3 py-1 text-xs font-semibold">
                  {groupedEvents.length} jami
                </span>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-sky-50 shadow-lg">
                <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                  <table className="min-w-[600px] w-full text-sm">
                    <thead className="bg-white/5 text-sky-100 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Nomi</th>
                        <th className="px-4 py-3 text-left">Sana</th>
                        <th className="px-4 py-3 text-left hidden sm:table-cell">Manzil</th>
                        <th className="px-4 py-3 text-left">Holat</th>
                        <th className="px-4 py-3 text-left">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {groupedEvents.slice(0, 30).map((group) => {
                        const d = new Date(group.rep.eventDateTime);
                        return (
                          <tr key={group.rep.id} className="hover:bg-white/5 transition">
                            {/* Nomi + kun badge */}
                            <td className="px-4 py-3 font-semibold text-sky-50 max-w-[160px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="truncate max-w-[120px]">{group.rep.title}</span>
                                {group.count > 1 && (
                                  <span className="inline-flex items-center rounded-full bg-amber-400/20 border border-amber-300/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-200 whitespace-nowrap">
                                    {group.count} kun
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Sana */}
                            <td className="px-4 py-3 text-xs text-sky-200/70 whitespace-nowrap">
                              {isNaN(d.getTime()) ? "—" : format(d, "dd MMM yy")}
                            </td>

                            {/* Manzil — kichik ekranda yashiriladi */}
                            <td className="px-4 py-3 text-xs text-sky-200/70 max-w-[130px] truncate hidden sm:table-cell">
                              {group.rep.locationName}
                            </td>

                            {/* Holat */}
                            <td className="px-4 py-3">
                              {group.isPending ? (
                                <span className="inline-flex items-center rounded-full bg-yellow-400/15 text-yellow-200 border border-yellow-300/20 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                                  Kutilmoqda
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-emerald-400/15 text-emerald-200 border border-emerald-300/20 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                                  Tasdiqlangan
                                </span>
                              )}
                            </td>

                            {/* Amallar */}
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5 items-center flex-wrap">
                                <Link
                                  to={`${base}/events/${group.rep.id}`}
                                  className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition"
                                >
                                  Ko'rish
                                </Link>

                                <EditEventDialog
                                  event={group.rep}
                                  onSave={updateEvent}
                                  triggerVariant="icon"
                                />

                                <button
                                  className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-rose-400/15 text-rose-100 border border-rose-300/20 hover:bg-rose-400/25 transition"
                                  onClick={() => deleteEv(group.rep.id)}
                                  title="O'chirish"
                                >
                                  <Trash2 size={12} />
                                </button>

                                {group.isPending && (
                                  <>
                                    <button
                                      className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-emerald-400/15 text-emerald-100 border border-emerald-300/20 hover:bg-emerald-400/25 transition"
                                      onClick={() => approveEv(group.pendingIds)}
                                      title={group.count > 1 ? `${group.count} kunni tasdiqlash` : "Tasdiqlash"}
                                    >
                                      <CheckCircle size={12} />
                                    </button>

                                    <button
                                      className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-rose-400/15 text-rose-100 border border-rose-300/20 hover:bg-rose-400/25 transition"
                                      onClick={() => { setRejectEv(group.pendingIds); setRejectEvReason(""); }}
                                      title={group.count > 1 ? `${group.count} kunni rad etish` : "Rad etish"}
                                    >
                                      <XCircle size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* USERS */}
        {tab === "users" && (
          <div className="anim-in">
            {/* Search */}
            <div className="relative mb-4 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ism, email, telefon..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl 
                   bg-slate-900 text-white 
                   border border-slate-700
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   transition"
              />
            </div>

            {/* Card */}
            <div
              className="overflow-hidden rounded-2xl border border-white/10
                    bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600
                    text-sky-50 shadow-lg
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:bg-black hover:from-black hover:via-black hover:to-black
                    hover:shadow-2xl"
            >
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full text-sm">
                  {/* Header */}
                  <thead className="bg-white/5 text-sky-100 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-5 py-4 text-left">ID</th>
                      <th className="px-5 py-4 text-left">Ism</th>
                      <th className="px-5 py-4 text-left">Email</th>
                      <th className="px-5 py-4 text-left">Rollar</th>
                      <th className="px-5 py-4 text-left">Holat</th>
                      <th className="px-5 py-4 text-left">Amallar</th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody className="divide-y divide-white/10">
                    {filteredUsers.map((u) => {
                      const roles = normalizeRoles(u.roles);

                      return (
                        <tr key={u.id} className="hover:bg-white/5 transition">
                          <td className="px-5 py-3 text-xs text-sky-200/70">
                            {u.id}
                          </td>

                          <td className="px-5 py-3 font-semibold text-sky-50">
                            {u.fullName || "—"}
                          </td>

                          <td className="px-5 py-3 text-xs text-sky-200/70">
                            {u.email}
                          </td>

                          {/* Roles */}
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {roles.length === 0 ? (
                                <span
                                  className="inline-flex items-center rounded-full
                                         bg-white/10 text-white
                                         border border-white/20
                                         px-2 py-0.5 text-[10px] font-semibold"
                                >
                                  User
                                </span>
                              ) : (
                                roles.map((r) => (
                                  <span
                                    key={r}
                                    className="inline-flex items-center rounded-full
                                       bg-sky-400/15 text-sky-200
                                       border border-sky-300/20
                                       px-2 py-0.5 text-[10px] font-semibold"
                                  >
                                    {r}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3">
                            <span
                              className={`inline-block w-2.5 h-2.5 rounded-full ${
                                u.enabled === false
                                  ? "bg-rose-400"
                                  : "bg-emerald-400"
                              }`}
                            />
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-2">
                              {isSuper &&
                                !roles.includes("ADMIN") &&
                                !roles.includes("SUPER_ADMIN") && (
                                  <button
                                    className="inline-flex items-center gap-1
                                       rounded-lg px-3 py-1.5 text-xs font-semibold
                                       bg-white/10 text-white
                                       border border-white/20
                                       hover:bg-white/20 transition"
                                    onClick={() => makeAdmin(u.id)}
                                  >
                                    <Shield size={11} />
                                    Admin
                                  </button>
                                )}

                              {!roles.includes("TOUR_ORGANIZATION") &&
                                !roles.includes("ADMIN") &&
                                !roles.includes("SUPER_ADMIN") && (
                                  <button
                                    className="inline-flex items-center gap-1
                                       rounded-lg px-3 py-1.5 text-xs font-semibold
                                       bg-white/10 text-white
                                       border border-white/20
                                       hover:bg-white/20 transition"
                                    onClick={() => makeTour(u.id)}
                                  >
                                    <Building2 size={11} />
                                    Tour
                                  </button>
                                )}

                              <button
                                className="inline-flex items-center justify-center
                                   rounded-lg px-3 py-1.5 text-xs font-semibold
                                   bg-yellow-400/15 text-yellow-200
                                   border border-yellow-300/20
                                   hover:bg-yellow-400/25 transition"
                                onClick={() =>
                                  toggleUser(u.id, u.enabled !== false)
                                }
                              >
                                {u.enabled === false ? "Yoqish" : "O'chirish"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Org Modal */}
      {rejectOrg !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center
               bg-black/60 backdrop-blur-sm"
          onClick={() => setRejectOrg(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl
                 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600
                 text-sky-50 border border-white/10
                 shadow-2xl p-6
                 transition-all duration-300"
          >
            <h3 className="font-bold text-lg mb-4">Rad etish sababi</h3>

            <textarea
              value={rejectOrgReason}
              onChange={(e) => setRejectOrgReason(e.target.value)}
              placeholder="Sabab kiriting..."
              rows={4}
              className="w-full rounded-xl bg-white/10
                   border border-white/20
                   text-white placeholder-sky-200/60
                   px-3 py-2 resize-y
                   focus:outline-none focus:ring-2 focus:ring-blue-400
                   mb-4 transition"
            />

            <div className="flex gap-3">
              <button
                onClick={doRejectOrg}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold
                     bg-rose-500/80 text-white
                     hover:bg-rose-500 transition"
              >
                Rad etish
              </button>

              <button
                onClick={() => setRejectOrg(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold
                     bg-white/10 text-white
                     border border-white/20
                     hover:bg-white/20 transition"
              >
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Event Modal */}
      {rejectEv.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center
               bg-black/60 backdrop-blur-sm"
          onClick={() => setRejectEv([])}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl
                 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600
                 text-sky-50 border border-white/10
                 shadow-2xl p-6
                 transition-all duration-300"
          >
            <h3 className="font-bold text-lg mb-4">Tadbirni rad etish</h3>

            <textarea
              value={rejectEvReason}
              onChange={(e) => setRejectEvReason(e.target.value)}
              placeholder="Sabab kiriting..."
              rows={4}
              className="w-full rounded-xl bg-white/10
                   border border-white/20
                   text-white placeholder-sky-200/60
                   px-3 py-2 resize-y
                   focus:outline-none focus:ring-2 focus:ring-blue-400
                   mb-4 transition"
            />

            <div className="flex gap-3">
              <button
                onClick={doRejectEv}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold
                     bg-rose-500/80 text-white
                     hover:bg-rose-500 transition"
              >
                Rad etish
              </button>

              <button
                onClick={() => setRejectEv([])}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold
                     bg-white/10 text-white
                     border border-white/20
                     hover:bg-white/20 transition"
              >
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
