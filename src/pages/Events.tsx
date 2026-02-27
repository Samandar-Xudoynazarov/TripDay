import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { eventsSvc } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { CalendarDays, MapPin, Search, Clock } from "lucide-react";
import { format } from "date-fns";

function statusOk(ev: any) {
  const s = String(ev?.status || "").toUpperCase();
  if (["APPROVED", "PUBLISHED", "ACTIVE", "PUBLIC"].includes(s)) return true;
  if (ev?.approved === true || ev?.published === true) return true;
  if (!s) return true;
  return false;
}

export default function EventsPage() {
  const { user, hasRole } = useAuth();
  const [all, setAll] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsSvc
      .getAll()
      .then((d) => {
        setAll(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isAdmin = hasRole("ADMIN") || hasRole("SUPER_ADMIN");
  const isOrg = hasRole("TOUR_ORGANIZATION");

  const visible = useMemo(() => {
    const base = isAdmin || isOrg ? all : all.filter(statusOk);
    const now = Date.now();
    return base.filter((ev) => {
      const d = +new Date(ev.eventDateTime);
      return isNaN(d) ? true : d >= now;
    });
  }, [all, isAdmin, isOrg]);

  const filtered = useMemo(() => {
    const x = q.trim().toLowerCase();
    if (!x) return visible;
    return visible.filter(
      (ev) =>
        ev.title?.toLowerCase().includes(x) ||
        ev.locationName?.toLowerCase().includes(x) ||
        ev.description?.toLowerCase().includes(x),
    );
  }, [visible, q]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "32px 24px 28px",
          position: "relative",
          backgroundImage: "url('../public/slides/2.png')", // ⬅ rasm yo‘li
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        {/* 🔥 Qoramtir overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 0,
          }}
        />

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(26px,4vw,40px)",
              marginBottom: 6,
              letterSpacing: "-0.5px",
            }}
          >
            Tadbirlar
          </h1>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 15,
              marginBottom: 24,
              opacity: 0.9,
            }}
          >
            {filtered.length} ta tadbir mavjud
          </p>

          <div style={{ position: "relative", maxWidth: 480 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Qidirish..."
              className="inp"
              style={{
                paddingLeft: 38,
                fontFamily: "Inter, sans-serif",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                color: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: 20,
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" style={{ height: 220 }}>
                <div style={{ height: 3, background: "var(--border)" }} />
                <div style={{ padding: 20 }}>
                  <div
                    style={{
                      height: 14,
                      borderRadius: 6,
                      background: "var(--surface2)",
                      marginBottom: 10,
                    }}
                    className="animate-shimmer"
                  />
                  <div
                    style={{
                      height: 14,
                      borderRadius: 6,
                      background: "var(--surface2)",
                      width: "60%",
                    }}
                    className="animate-shimmer"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "var(--text-muted)",
            }}
          >
            <CalendarDays
              size={48}
              style={{ margin: "0 auto 16px", opacity: 0.25 }}
            />
            <h3
              style={{
                fontFamily: "Syne,sans-serif",
                fontSize: 18,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              Tadbir topilmadi
            </h3>
            <p style={{ fontSize: 14 }}>Qidiruv so'zini o'zgartiring</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: 20,
            }}
          >
            {filtered.map((ev, i) => {
              const d = new Date(ev.eventDateTime);
              return (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="card card-hover anim-up"
                  style={{
                    textDecoration: "none",
                    display: "block",
                    animationDelay: `${Math.min(i, 8) * 0.04}s`,
                  }}
                >
                  <div
                    style={{
                      height: 3,
                      background:
                        "linear-gradient(90deg,var(--accent),var(--accent2))",
                      opacity: 0.6,
                    }}
                  />
                  <div style={{ padding: "18px 20px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(124,106,247,0.1)",
                          border: "1px solid rgba(124,106,247,0.2)",
                          borderRadius: 8,
                          padding: "6px 10px",
                          textAlign: "center",
                          minWidth: 48,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "Syne,sans-serif",
                            fontWeight: 700,
                            fontSize: 18,
                            color: "#a89af9",
                            lineHeight: 1,
                          }}
                        >
                          {isNaN(d.getTime()) ? "—" : format(d, "dd")}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            marginTop: 2,
                          }}
                        >
                          {isNaN(d.getTime()) ? "" : format(d, "MMM")}
                        </div>
                      </div>
                      <span className="tag tag-green" style={{ fontSize: 10 }}>
                        Upcoming
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: "Syne,sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "var(--text)",
                        marginBottom: 8,
                        lineHeight: 1.3,
                      }}
                    >
                      {ev.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        lineHeight: 1.6,
                        marginBottom: 14,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {ev.description}
                    </p>
                    <div style={{ display: "flex", gap: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <MapPin size={11} color="var(--text-muted)" />
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 120,
                          }}
                        >
                          {ev.locationName}
                        </span>
                      </div>
                      {!isNaN(d.getTime()) && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Clock size={11} color="var(--text-muted)" />
                          <span
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            {format(d, "HH:mm")}
                          </span>
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
