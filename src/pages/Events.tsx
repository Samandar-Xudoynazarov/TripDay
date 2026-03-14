import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { eventsSvc } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { CalendarDays, MapPin, Search, Clock } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { getEventDate, isUpcomingEvent, deduplicateEvents } from "@/lib/event-utils";

function statusOk(ev: any) {
  const s = String(ev?.status || "").toUpperCase();
  if (["APPROVED","PUBLISHED","ACTIVE","PUBLIC"].includes(s)) return true;
  if (ev?.approved === true || ev?.published === true) return true;
  if (!s) return true;
  return false;
}

export default function EventsPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();

  const ORIGIN     = import.meta.env.VITE_BACKEND_URL || "https://tripday.uz";
  const API_PREFIX = import.meta.env.VITE_API_BASE_URL || "/api";
  const apiUrl = (p: string) => `${ORIGIN}${API_PREFIX}${p.startsWith("/") ? "" : "/"}${p}`;
  const fileUrl = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${ORIGIN}${p.startsWith("/") ? "" : "/"}${p}`;
  };

  const [all, setAll]       = useState<any[]>([]);
  const [q, setQ]           = useState("");
  const [loading, setLoading] = useState(true);
  const [covers, setCovers] = useState<Record<number, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await eventsSvc.getAll();
        if (!alive) return;
        const list = Array.isArray(d) ? d : [];
        setAll(list);

        const results = await Promise.all(
          list.map(async (ev: any) => {
            const id = Number(ev?.id);
            if (!id) return [id, ""] as const;
            try {
              const r = await fetch(apiUrl(`/events/${id}/images`), {
                method: "GET", headers: { Accept: "application/json" },
              });
              const imgs = r.ok ? await r.json() : [];
              const first = Array.isArray(imgs) && imgs.length ? String(imgs[0]) : "";
              return [id, first] as const;
            } catch {
              return [id, ""] as const;
            }
          })
        );
        if (!alive) return;
        const map: Record<number, string> = {};
        for (const [id, path] of results) if (id && path) map[id] = path;
        setCovers(map);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [ORIGIN, API_PREFIX]);

  const isAdmin = hasRole("ADMIN") || hasRole("SUPER_ADMIN");
  const isOrg   = hasRole("TOUR_ORGANIZATION");

  const visible = useMemo(() => {
    const base = isAdmin || isOrg ? all : all.filter(statusOk);
    const now  = Date.now();
    const upcoming = base.filter((ev) => isUpcomingEvent(ev, now));
    return deduplicateEvents(upcoming);
  }, [all, isAdmin, isOrg]);

  const filtered = useMemo(() => {
    const x = q.trim().toLowerCase();
    if (!x) return visible;
    return visible.filter(
      (ev) =>
        ev.title?.toLowerCase().includes(x) ||
        ev.locationName?.toLowerCase().includes(x) ||
        ev.description?.toLowerCase().includes(x)
    );
  }, [visible, q]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f7f8ff,#eef2ff)" }}>
      <Navbar />

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(15,23,42,0.08)", padding: "32px 24px 28px", position: "relative", backgroundImage: "url('/slides/2.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", color: "#fff", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.55)", zIndex: 0 }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "clamp(26px,4vw,40px)", marginBottom: 6, letterSpacing: "-0.5px" }}>
            {t("eventsPage.title")}
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, marginBottom: 24, opacity: 0.9 }}>
            {t("eventsPage.available", { count: filtered.length })}
          </p>
          <div style={{ position: "relative", maxWidth: 480 }}>
            <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#cbd5e1" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("eventsPage.searchPlaceholder")}
              className="inp"
              style={{ paddingLeft: 38, fontFamily: "Inter, sans-serif", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", color: "#fff", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" style={{ height: 240, borderRadius: 18, background: "rgba(255,255,255,0.85)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 10px 26px rgba(2,6,23,0.06)" }}>
                <div style={{ height: 3, background: "rgba(15,23,42,0.12)" }} />
                <div style={{ padding: 20 }}>
                  <div style={{ height: 14, borderRadius: 6, background: "rgba(15,23,42,0.08)", marginBottom: 10 }} />
                  <div style={{ height: 14, borderRadius: 6, background: "rgba(15,23,42,0.08)", width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(15,23,42,0.65)" }}>
            <CalendarDays size={48} style={{ margin: "0 auto 16px", opacity: 0.25 }} />
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: 18, color: "#0f172a", marginBottom: 8 }}>
              {t("eventsPage.emptyTitle")}
            </h3>
            <p style={{ fontSize: 14 }}>{t("eventsPage.emptyText")}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
            {filtered.map((ev, i) => {
              const d          = getEventDate(ev) || new Date();
              const coverPath  = covers[Number(ev.id)];
              const coverUrl   = coverPath ? fileUrl(coverPath) : "";
              const isMultiDay = Array.isArray(ev._siblings) && ev._siblings.length > 1;

              return (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="card-hover anim-up"
                  style={{ textDecoration: "none", display: "block", animationDelay: `${Math.min(i, 8) * 0.04}s`, borderRadius: 18, overflow: "hidden", background: "rgba(255,255,255,0.92)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 10px 26px rgba(2,6,23,0.06)", backdropFilter: "blur(6px)", transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease" }}
                >
                  {/* cover */}
                  <div style={{ position: "relative", height: 160, background: "rgba(15,23,42,0.06)" }}>
                    {coverUrl ? (
                      <img src={coverUrl} alt={ev.title} loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.12))" }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(2,6,23,0.35) 0%, rgba(2,6,23,0.05) 55%, rgba(255,255,255,0) 100%)" }} />

                    {/* Date pill */}
                    <div style={{ position: "absolute", left: 12, top: 12 }}>
                      <div style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(15,23,42,0.08)", backdropFilter: "blur(10px)", borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
                        {isMultiDay ? (
                          <div style={{ fontWeight: 800, fontSize: 11, color: "#4f46e5", lineHeight: 1.3, whiteSpace: "nowrap" }}>
                            {ev._dateRange}
                          </div>
                        ) : (
                          <>
                            <div style={{ fontWeight: 800, fontSize: 18, color: "#4f46e5", lineHeight: 1 }}>{isNaN(d.getTime()) ? "—" : format(d, "dd")}</div>
                            <div style={{ fontSize: 9, color: "rgba(15,23,42,0.65)", textTransform: "uppercase", marginTop: 2, fontWeight: 700 }}>{isNaN(d.getTime()) ? "" : format(d, "MMM")}</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tag */}
                    <div style={{ position: "absolute", right: 12, top: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#065f46", background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.25)", padding: "6px 10px", borderRadius: 999, backdropFilter: "blur(10px)" }}>
                        {isMultiDay ? `${ev._siblings.length} kun` : "Upcoming"}
                      </span>
                    </div>
                  </div>

                  {/* content */}
                  <div style={{ padding: "16px 18px 18px" }}>
                    <h3 style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 8, lineHeight: 1.3 }}>{ev.title}</h3>
                    <p style={{ fontSize: 12, color: "rgba(15,23,42,0.65)", lineHeight: 1.6, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {ev.description}
                    </p>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={11} color="rgba(15,23,42,0.55)" />
                        <span style={{ fontSize: 11, color: "rgba(15,23,42,0.65)", maxWidth: 160, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.locationName}
                        </span>
                      </div>
                      {!isMultiDay && !isNaN(d.getTime()) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Clock size={11} color="rgba(15,23,42,0.55)" />
                          <span style={{ fontSize: 11, color: "rgba(15,23,42,0.65)", fontWeight: 600 }}>{format(d, "HH:mm")}</span>
                        </div>
                      )}
                      {isMultiDay && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <CalendarDays size={11} color="rgba(15,23,42,0.55)" />
                          <span style={{ fontSize: 11, color: "rgba(99,102,241,0.85)", fontWeight: 700 }}>{ev._dateRange}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}