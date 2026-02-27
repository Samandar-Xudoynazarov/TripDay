import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { orgsSvc, adminSvc, usersSvc, eventsSvc } from "@/lib/api";
import { normalizeRoles } from "@/lib/auth";
import Shell from "@/components/Shell";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Building2,
  Users,
  Ticket,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Shield,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

function toArr(d: any) {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.content)) return d.content;
  return [];
}

type Tab = "overview" | "orgs" | "events" | "users";

export default function AdminPage() {
  const { user, isLoading, hasRole, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const isSuper = hasRole("SUPER_ADMIN");
  const base = isSuper ? "/super-admin" : "/admin";
  const label = isSuper ? "Super Admin" : "Admin";

  const tabFromUrl = (() => {
    const t = new URLSearchParams(loc.search).get("tab") as Tab;
    return ["overview", "orgs", "events", "users"].includes(t) ? t : "overview";
  })();

  const [tab, setTab] = useState<Tab>(tabFromUrl);
  useEffect(() => setTab(tabFromUrl), [tabFromUrl]);
  const goTab = (t: Tab) => nav(`${base}?tab=${t}`);

  const [orgs, setOrgs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // Reject modals
  const [rejectOrg, setRejectOrg] = useState<number | null>(null);
  const [rejectOrgReason, setRejectOrgReason] = useState("");
  const [rejectEv, setRejectEv] = useState<number | null>(null);
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
      const [o, u, ev, pEv] = await Promise.all([
        orgsSvc.getAll(),
        usersSvc.getAll(),
        eventsSvc.getAll(),
        pendingEventsPromise,
      ]);
      setOrgs(toArr(o));
      setUsers(toArr(u));
      setEvents(toArr(ev));
      setPendingEvents(toArr(pEv));
    } catch {
      toast.error("Ma'lumotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  const pendingOrgs = useMemo(() => orgs.filter((o) => !o.verified), [orgs]);
  const verifiedOrgs = useMemo(() => orgs.filter((o) => o.verified), [orgs]);

  const items = [
    {
      label: "Umumiy ko'rinish",
      to: `${base}?tab=overview`,
      icon: "dashboard",
    },
    { label: "Tashkilotlar", to: `${base}?tab=orgs`, icon: "org" },
    { label: "Tadbirlar", to: `${base}?tab=events`, icon: "events" },
    { label: "Foydalanuvchilar", to: `${base}?tab=users`, icon: "users" },
    { label: "Mehmonxonalar", to: `${base}/hotels`, icon: "hotel" },
    { label: "Bosh sahifa", to: "/", icon: "home" },
  ];

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
  const approveEv = async (id: number) => {
    await adminSvc.approveEvent(id);
    toast.success("Tasdiqlandi");
    load();
  };
  const doRejectEv = async () => {
    if (!rejectEv || !rejectEvReason.trim()) {
      toast.error("Sabab kiriting");
      return;
    }
    await adminSvc.rejectEvent(rejectEv, rejectEvReason);
    toast.success("Rad etildi");
    setRejectEv(null);
    setRejectEvReason("");
    load();
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
  const toggleUser = async (uid: number, enabled: boolean) => {
    await usersSvc.setEnabled(uid, !enabled);
    toast.success(enabled ? "O'chirildi" : "Yoqildi");
    load();
  };

  const SCard = ({ val, label, icon, accent, onClick, bg }: any) => (
    <div
      className="card"
      style={{
        padding: "20px 22px",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",

        // ✅ background shu yerda
        background: bg || "linear-gradient(135deg,#0b1220,#0f1a33)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
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
              fontFamily: "Syne,sans-serif",
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
      <div style={{ padding: "28px 28px", minHeight: "0" }}>
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
          {(["overview", "orgs", "events", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab-btn${tab === t ? " active" : ""}`}
              onClick={() => goTab(t)}
              style={{
                background: "blue",
                padding: "10px",
                borderRadius: "15px",
              }}
            >
              {t === "overview"
                ? "Umumiy"
                : t === "orgs"
                  ? "Tashkilotlar"
                  : t === "events"
                    ? "Tadbirlar"
                    : "Foydalanuvchilar"}
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
                accent="#fbbf24"
                bg="linear-gradient(135deg,#2a2110,#14100a)" // ✅ sariq theme
                onClick={() => goTab("orgs")}
              />

              <SCard
                val={pendingEvents.length}
                label="Kutilayotgan tadbirlar"
                icon={<Clock size={18} color="#f06292" />}
                accent="#f06292"
                bg="linear-gradient(135deg,#2a1020,#140a12)" // ✅ pink theme
                onClick={() => goTab("events")}
              />

              <SCard
                val={verifiedOrgs.length}
                label="Tasdiqlangan tashkilotlar"
                icon={<Building2 size={18} color="#4ade80" />}
                accent="#4ade80"
                bg="linear-gradient(135deg,#0f2a1a,#08150e)" // ✅ green theme
              />

              <SCard
                val={users.length}
                label="Jami foydalanuvchilar"
                icon={<Users size={18} color="var(--accent)" />}
                bg="linear-gradient(135deg,#0b1f2e,#07131c)" // ✅ blue theme
              />

              <SCard
                val={events.length}
                label="Jami tadbirlar"
                icon={<Ticket size={18} color="#67e8f9" />}
                accent="#67e8f9"
                bg="linear-gradient(135deg,#06212a,#041014)" // ✅ cyan theme
              />
            </div>

            {/* Pending orgs quick */}
            {pendingOrgs.length > 0 && (
              <div className="mb-5 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-sky-50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-black hover:from-black hover:via-black hover:to-black hover:shadow-2xl">
                {/* header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                  <Clock size={15} color="#fbbf24" />
                  <span className="font-bold text-[15px] text-sky-50">
                    Tasdiqlanmagan tashkilotlar
                  </span>

                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-yellow-400/15 text-yellow-200 border border-yellow-300/20 px-2.5 py-1 text-xs font-semibold">
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
            {pendingEvents.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-sky-50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-black hover:from-black hover:via-black hover:to-black hover:shadow-2xl">
                {/* header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                  <Clock size={15} color="#f06292" />
                  <span className="font-bold text-[15px] text-sky-50">
                    Tasdiqlanmagan tadbirlar
                  </span>

                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-rose-400/15 text-rose-100 border border-rose-300/20 px-2.5 py-1 text-xs font-semibold">
                    {pendingEvents.length}
                  </span>
                </div>

                {/* rows */}
                {pendingEvents.slice(0, 5).map((ev) => (
                  <div
                    key={ev.id}
                    className="px-5 py-3.5 border-b border-white/10 last:border-b-0 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-sky-50 truncate">
                        {ev.title}
                      </div>
                      <div className="text-[12px] text-sky-100/80 truncate">
                        {ev.locationName}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold
                           bg-emerald-400/15 text-emerald-100 border border-emerald-300/20
                           hover:bg-emerald-400/25 hover:border-emerald-200/40 transition"
                        onClick={() => approveEv(ev.id)}
                      >
                        <CheckCircle size={13} />
                        Tasdiqlash
                      </button>

                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold
                           bg-rose-400/15 text-rose-100 border border-rose-300/20
                           hover:bg-rose-400/25 hover:border-rose-200/40 transition"
                        onClick={() => {
                          setRejectEv(ev.id);
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
        {tab === "events" && (
          <div className="anim-in">
            {/* Stats */}
            <div className="mb-4">
              <div className="flex gap-3 mb-3">
                <span
                  className="inline-flex items-center rounded-full 
                         bg-rose-400/15 text-rose-200 
                         border border-rose-300/20 
                         px-3 py-1 text-xs font-semibold"
                >
                  {pendingEvents.length} kutilmoqda
                </span>

                <span
                  className="inline-flex items-center rounded-full 
                         bg-sky-400/15 text-sky-200 
                         border border-sky-300/20 
                         px-3 py-1 text-xs font-semibold"
                >
                  {events.length} jami
                </span>
              </div>
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
                  {/* Header */}
                  <thead className="bg-white/5 text-sky-100 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-5 py-4 text-left">Nomi</th>
                      <th className="px-5 py-4 text-left">Sana</th>
                      <th className="px-5 py-4 text-left">Manzil</th>
                      <th className="px-5 py-4 text-left">Holat</th>
                      <th className="px-5 py-4 text-left">Amallar</th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody className="divide-y divide-white/10">
                    {[
                      ...pendingEvents,
                      ...events.filter(
                        (ev) => !pendingEvents.some((p) => p.id === ev.id),
                      ),
                    ]
                      .slice(0, 30)
                      .map((ev) => {
                        const isPending = pendingEvents.some(
                          (p) => p.id === ev.id,
                        );
                        const d = new Date(ev.eventDateTime);

                        return (
                          <tr
                            key={ev.id}
                            className="hover:bg-white/5 transition"
                          >
                            <td className="px-5 py-3 font-semibold text-sky-50 max-w-[220px] truncate">
                              {ev.title}
                            </td>

                            <td className="px-5 py-3 text-xs text-sky-200/70 whitespace-nowrap">
                              {isNaN(d.getTime())
                                ? "—"
                                : format(d, "dd MMM yyyy")}
                            </td>

                            <td className="px-5 py-3 text-xs text-sky-200/70 max-w-[180px] truncate">
                              {ev.locationName}
                            </td>

                            <td className="px-5 py-3">
                              {isPending ? (
                                <span
                                  className="inline-flex items-center rounded-full 
                                         bg-yellow-400/15 text-yellow-200 
                                         border border-yellow-300/20 
                                         px-2.5 py-1 text-xs font-semibold"
                                >
                                  Kutilmoqda
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center rounded-full 
                                         bg-emerald-400/15 text-emerald-200 
                                         border border-emerald-300/20 
                                         px-2.5 py-1 text-xs font-semibold"
                                >
                                  Tasdiqlangan
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-3">
                              <div className="flex gap-2 items-center">
                                <Link
                                  to={`${base}/events/${ev.id}`}
                                  className="inline-flex items-center justify-center
                                     rounded-lg px-3 py-2 text-xs font-semibold
                                     bg-white/10 text-white
                                     border border-white/20
                                     hover:bg-white/20 transition"
                                >
                                  Ko'rish
                                </Link>

                                {isPending && (
                                  <>
                                    <button
                                      className="inline-flex items-center justify-center
                                         rounded-lg px-3 py-2 text-xs font-semibold
                                         bg-emerald-400/15 text-emerald-100
                                         border border-emerald-300/20
                                         hover:bg-emerald-400/25 transition"
                                      onClick={() => approveEv(ev.id)}
                                    >
                                      <CheckCircle size={12} />
                                    </button>

                                    <button
                                      className="inline-flex items-center justify-center
                                         rounded-lg px-3 py-2 text-xs font-semibold
                                         bg-rose-400/15 text-rose-100
                                         border border-rose-300/20
                                         hover:bg-rose-400/25 transition"
                                      onClick={() => {
                                        setRejectEv(ev.id);
                                        setRejectEvReason("");
                                      }}
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
        )}

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
      {rejectEv !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center
               bg-black/60 backdrop-blur-sm"
          onClick={() => setRejectEv(null)}
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
                onClick={() => setRejectEv(null)}
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
