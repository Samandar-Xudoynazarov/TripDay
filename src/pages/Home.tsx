import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { eventsSvc } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { CalendarDays, MapPin, ArrowRight, Globe, Users, Clock } from "lucide-react";
import { format } from "date-fns";

export default function HomePage() {
  const { user } = useAuth();

  // ✅ ENV (prod/dev)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; // masalan: http://10.113.31.105:8081/api
  const FILES_BASE = import.meta.env.VITE_FILES_BASE || "http://10.113.31.105:8081"; // /uploads shu hostda

  const [events, setEvents] = useState<any[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);

  // ✅ eventId -> first image path (cover)
  const [covers, setCovers] = useState<Record<number, string>>({});

  // ✅ helper: /uploads/... -> http://host/uploads/...
  const toFileUrl = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${FILES_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
  };

  const heroImages = [
    "/slides/1.png",
    "/slides/2.png",
    "/slides/3.png",
    "/slides/4.png",
    "/slides/5.png",
    "/slides/6.png",
    "/slides/7.png",
    "/slides/8.png",
    "/slides/9.png",
  ];

  const orgs = [
    {
      id: 1,
      name: "O‘zbekiston Respublikasi Turizm qo‘mitasi",
      website: "https://gov.uz/oz/uzbektourism",
      logo: "/partners/1.png",
    },
    {
      id: 2,
      name: "Visit Samarkand",
      website: "https://samarkand.travel/",
      logo: "/partners/2.jpeg",
    },
    {
      id: 3,
      name: "Silk Road Samarkand",
      website: "https://www.silkroad-samarkand.com/",
      logo: "/partners/3.png",
    },
    {
      id: 4,
      name: "Silk Road Travel Academy",
      website: "https://www.silkroad.academy/",
      logo: "/partners/4.png",
    },
    {
      id: 5,
      name: "Silk Road Destinations",
      website: "https://silkroaddestinations.com/",
      logo: "/partners/5.jpeg",
    },
  ];

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const list = await eventsSvc.getUpcoming();
        if (!alive) return;

        const arr = Array.isArray(list) ? list : [];
        setEvents(arr);

        // ✅ har event uchun 1ta cover: GET /api/events/:id/images
        const results = await Promise.all(
          arr.slice(0, 12).map(async (ev: any) => {
            const id = Number(ev?.id);
            if (!id) return [id, ""] as const;

            try {
              const r = await fetch(`${API_BASE}/events/${id}/images`);
              const imgs = r.ok ? await r.json() : [];
              const first = Array.isArray(imgs) && imgs.length ? String(imgs[0]) : "";
              return [id, first] as const;
            } catch {
              return [id, ""] as const;
            }
          }),
        );

        if (!alive) return;

        const map: Record<number, string> = {};
        for (const [id, url] of results) {
          if (id && url) map[id] = url;
        }
        setCovers(map);
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [API_BASE]);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIdx((p) => (p + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const top = events.slice(0, 6);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f7f8ff,#eef2ff)",
      }}
    >
      <Navbar />

      {/* HERO */}
      <section
        style={{
          padding: "80px 24px 60px",
          position: "relative",
          overflow: "hidden",
          backgroundImage: `url(${heroImages[heroIdx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />

        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(124,106,247,0.1),transparent 70%)",
            top: -200,
            right: -100,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(240,98,146,0.07),transparent 70%)",
            bottom: -100,
            left: -50,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
              gap: 22,
              maxWidth: 700,
            }}
          >
            <h3
              className="anim-up s1"
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 800,
                fontSize: "clamp(25px,4vw,56px)",
                lineHeight: 1.05,
                color: "#fff",
              }}
            >
              <span className="gradient-text">Sayohatni</span>
              <br />
              Biz bilan kashf eting
            </h3>

            <p
              className="anim-up s2"
              style={{
                fontSize: "clamp(14px,2vw,17px)",
                color: "#e5e7eb",
                lineHeight: 1.75,
              }}
            >
              Konsertlar, forumlar, ko'rgazmalar — barchasi bir platformada. Ro'yxatdan o'ting va
              sevimli tadbirlaringizni qoldirmang.
            </p>

            <div
              className="anim-up s3"
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "flex-start",
              }}
            >
              <Link
                to="/events"
                className="btn btn-primary"
                style={{ textDecoration: "none", padding: "13px 30px", fontSize: 18 }}
              >
                Tadbirlar <ArrowRight size={16} />
              </Link>

              {!user && (
                <Link
                  to="/register"
                  className="btn btn-ghost"
                  style={{ textDecoration: "none", padding: "13px 30px", fontSize: 18 }}
                >
                  Ro'yxatdan o'tish
                </Link>
              )}
            </div>

            <div
              className="anim-up s4"
              style={{
                display: "flex",
                gap: 48,
                marginTop: 16,
                flexWrap: "wrap",
                justifyContent: "flex-start",
              }}
            >
              {[
                { icon: <CalendarDays size={18} />, val: `${events.length}+`, label: "Tadbir" },
                { icon: <Users size={18} />, val: `${orgs.length}+`, label: "Tashkilot" },
                { icon: <Globe size={18} />, val: "1000+", label: "Foydalanuvchilar" },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ color: "#cbd5e1", marginBottom: 6 }}>{s.icon}</div>
                  <div
                    style={{
                      fontFamily: "Arial, sans-serif",
                      fontWeight: 800,
                      fontSize: 26,
                      color: "#fff",
                    }}
                  >
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      fontFamily: "Arial, sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section style={{ padding: "10px 24px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 20,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                }}
              >
                Yaqin tadbirlar
              </span>
            </div>
            <h2
              style={{
                letterSpacing: "0.08em",
                fontFamily: "Arial, sans-serif",
                textTransform: "uppercase",
                fontWeight: 700,
                fontSize: "clamp(12px,2vw,22px)",
                color: "#0f172a",
              }}
            >
              Nima bo'lyapti
            </h2>
          </div>

          <Link
            to="/events"
            className="btn btn-ghost btn-sm"
            style={{ textDecoration: "none", color: "#0f172a" }}
          >
            Hammasi <ArrowRight size={13} />
          </Link>
        </div>

        {top.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(15,23,42,0.7)" }}>
            <CalendarDays size={40} style={{ margin: "0 auto 12px", opacity: 0.25, color: "#0f172a" }} />
            <p style={{ margin: "0 auto 12px", opacity: 0.8, color: "#0f172a" }}>
              Hozircha yaqin tadbirlar yo'q
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))",
              gap: 18,
            }}
          >
            {top.map((ev, i) => {
              const d = new Date(ev.eventDateTime);
              const coverPath = covers[Number(ev.id)];
              const coverUrl = coverPath ? toFileUrl(coverPath) : "";

              return (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="card-hover anim-up"
                  style={{
                    textDecoration: "none",
                    display: "block",
                    animationDelay: `${i * 0.05}s`,
                    borderRadius: 18,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 10px 26px rgba(2,6,23,0.06)",
                    backdropFilter: "blur(6px)",
                    transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 16px 36px rgba(2,6,23,0.10)";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.boxShadow = "0 10px 26px rgba(2,6,23,0.06)";
                    e.currentTarget.style.borderColor = "rgba(15,23,42,0.08)";
                  }}
                >
                  {/* cover */}
                  <div style={{ position: "relative", height: 150, background: "rgba(15,23,42,0.06)" }}>
                    {coverUrl ? (
                      <img
                        src={coverUrl} // ✅ FIX
                        alt={ev.title}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.12))",
                        }}
                      />
                    )}

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(2,6,23,0.35) 0%, rgba(2,6,23,0.05) 55%, rgba(255,255,255,0) 100%)",
                      }}
                    />

                    {/* date pill */}
                    <div style={{ position: "absolute", left: 12, top: 12 }}>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.80)",
                          border: "1px solid rgba(15,23,42,0.08)",
                          backdropFilter: "blur(10px)",
                          borderRadius: 10,
                          padding: "6px 10px",
                          textAlign: "center",
                          minWidth: 54,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "Arial, sans-serif",
                            fontWeight: 800,
                            fontSize: 18,
                            color: "#0f172a",
                            lineHeight: 1,
                          }}
                        >
                          {isNaN(d.getTime()) ? "—" : format(d, "dd")}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "rgba(15,23,42,0.70)",
                            textTransform: "uppercase",
                            marginTop: 2,
                            fontWeight: 700,
                          }}
                        >
                          {isNaN(d.getTime()) ? "" : format(d, "MMM")}
                        </div>
                      </div>
                    </div>

                    {/* tag */}
                    <div style={{ position: "absolute", right: 12, top: 12 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#064e3b",
                          background: "rgba(16,185,129,0.18)",
                          border: "1px solid rgba(16,185,129,0.25)",
                          padding: "6px 10px",
                          borderRadius: 999,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        Upcoming
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "16px 18px 18px" }}>
                    <h3
                      style={{
                        fontFamily: "Syne,sans-serif",
                        fontWeight: 800,
                        fontSize: 15,
                        color: "#0f172a",
                        marginBottom: 8,
                        lineHeight: 1.3,
                      }}
                    >
                      {ev.title}
                    </h3>

                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(15,23,42,0.70)",
                        lineHeight: 1.6,
                        marginBottom: 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {ev.description}
                    </p>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          color: "rgba(15,23,42,0.70)",
                          fontWeight: 600,
                        }}
                      >
                        <MapPin size={10} />
                        {ev.locationName}
                      </span>

                      {!isNaN(d.getTime()) && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            color: "rgba(15,23,42,0.70)",
                            fontWeight: 600,
                          }}
                        >
                          <Clock size={10} />
                          {format(d, "HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ORGS */}
      {orgs.length > 0 && (
        <section
          style={{
            padding: "40px 24px",
            background: "rgba(255,255,255,0.55)",
            borderTop: "1px solid rgba(15,23,42,0.08)",
            borderBottom: "1px solid rgba(15,23,42,0.08)",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <span
                style={{
                  fontSize: 18,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                }}
              >
                Hamkor tashkilotlar
              </span>

              <h2
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(20px,3vw,50px)",
                  color: "#0f172a",
                  marginTop: 8,
                }}
              >
                Ishonchli havolalar
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                scrollBehavior: "smooth",
                paddingBottom: 8,
              }}
            >
              {orgs.map((org: any) => (
                <a
                  key={org.id}
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: "0 0 auto",
                    minWidth: 180,
                    background: "rgba(255,255,255,0.88)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 16,
                    padding: "18px 20px",
                    textAlign: "center",
                    textDecoration: "none",
                    transition: "all 0.25s ease",
                    boxShadow: "0 10px 26px rgba(2,6,23,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 16px 36px rgba(2,6,23,0.10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 10px 26px rgba(2,6,23,0.06)";
                  }}
                >
                  <img
                    src={org.logo}
                    alt={org.name}
                    loading="lazy"
                    style={{
                      width: 52,
                      height: 52,
                      objectFit: "contain",
                      display: "block",
                      margin: "0 auto 10px",
                      filter:
                        "brightness(0) saturate(100%) invert(27%) sepia(92%) saturate(3800%) hue-rotate(205deg) brightness(95%) contrast(105%)",
                    }}
                  />

                  <div
                    style={{
                      width: 300,
                      margin: "0 auto",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0f172a",
                      textAlign: "center",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    {org.name}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer
        style={{
          borderTop: "1px solid rgba(15,23,42,0.08)",
          padding: "24px",
          background: "rgba(255,255,255,0.65)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: "#0f172a",
            }}
          >
            🎫 TripDay
          </span>
          <span style={{ fontSize: 12, color: "rgba(15,23,42,0.70)" }}>© 2025 TripDay</span>
        </div>
      </footer>
    </div>
  );
}