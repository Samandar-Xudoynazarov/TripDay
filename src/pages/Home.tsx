import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { eventsSvc } from "@/lib/api";
import Navbar from "@/components/Navbar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Globe,
  Users,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import useEmblaCarousel from "embla-carousel-react";

type CoversMap = Record<number, string>;

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const ORIGIN = import.meta.env.VITE_BACKEND_URL || "https://tripday.uz";
  const API_PREFIX = import.meta.env.VITE_API_BASE_URL || "/api";

  // ✅ API requestlar uchun: https://tripday.uz + /api + /...
  const apiUrl = (p: string) =>
    `${ORIGIN}${API_PREFIX}${p.startsWith("/") ? "" : "/"}${p}`;

  // ✅ file/img uchun: https://tripday.uz + /uploads/...
  // /api qo‘shilmaydi!
  const fileUrl = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${ORIGIN}${p.startsWith("/") ? "" : "/"}${p}`;
  };

  const [events, setEvents] = useState<any[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [covers, setCovers] = useState<CoversMap>({});

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
      logo: "/partners/2.png",
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
      logo: "/partners/5.png",
    },
  ];

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Sizning service’ingiz qanday yozilganini bilmayman,
        // shu sabab events listni o‘zingizdagi eventsSvc orqali olamiz
        const list = await eventsSvc.getUpcoming();
        if (!alive) return;

        const arr = Array.isArray(list) ? list : [];
        setEvents(arr);

        // ✅ Har event uchun cover: GET /api/events/:id/images
        const results = await Promise.all(
          arr.slice(0, 12).map(async (ev: any) => {
            const id = Number(ev?.id);
            if (!id) return [id, ""] as const;

            try {
              const r = await fetch(apiUrl(`/events/${id}/images`), {
                method: "GET",
                headers: {
                  Accept: "application/json",
                },
                // cookie auth bo‘lsa kerak bo‘lishi mumkin:
                // credentials: "include",
              });

              if (!r.ok) return [id, ""] as const;

              const imgs = await r.json();
              const first =
                Array.isArray(imgs) && imgs.length ? String(imgs[0]) : "";
              return [id, first] as const;
            } catch {
              return [id, ""] as const;
            }
          }),
        );

        if (!alive) return;

        const map: CoversMap = {};
        for (const [id, path] of results) {
          if (id && path) map[id] = path; // path masalan: /uploads/...
        }
        setCovers(map);
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [ORIGIN, API_PREFIX]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((p) => (p + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const top = events.slice(0, 6);

  // Partners slider
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  useEffect(() => {
    if (!emblaApi) return;
    const timer = setInterval(() => {
      try {
        emblaApi.scrollNext();
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [emblaApi]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f7f8ff,#eef2ff)",
      }}
    >
      <Navbar />

      {/* Translator (Language switcher) */}
      <div
        style={{
          position: "fixed",
          top: 18,
          right: 18,
          zIndex: 50,
        }}
      >
        <LanguageSwitcher />
      </div>

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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
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
              Konsertlar, forumlar, ko'rgazmalar — barchasi bir platformada.
              Ro'yxatdan o'ting va sevimli tadbirlaringizni qoldirmang.
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
                style={{
                  textDecoration: "none",
                  padding: "13px 30px",
                  fontSize: 18,
                }}
              >
                Tadbirlar <ArrowRight size={16} />
              </Link>

              {!user && (
                <Link
                  to="/register"
                  className="btn btn-ghost"
                  style={{
                    textDecoration: "none",
                    padding: "13px 30px",
                    fontSize: 18,
                  }}
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
                {
                  icon: <CalendarDays size={18} />,
                  val: `${events.length}+`,
                  label: "Tadbir",
                },
                {
                  icon: <Users size={18} />,
                  val: `${orgs.length}+`,
                  label: "Tashkilot",
                },
                {
                  icon: <Globe size={18} />,
                  val: "1000+",
                  label: "Foydalanuvchilar",
                },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ color: "#cbd5e1", marginBottom: 6 }}>
                    {s.icon}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 26, color: "#fff" }}>
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
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
      <section
        style={{ padding: "10px 24px 80px", maxWidth: 1200, margin: "0 auto" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
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
            <h2
              style={{
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 700,
                fontSize: "clamp(12px,2vw,22px)",
                color: "#0f172a",
                marginTop: 6,
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
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "rgba(15,23,42,0.7)",
            }}
          >
            <CalendarDays
              size={40}
              style={{ margin: "0 auto 12px", opacity: 0.25, color: "#0f172a" }}
            />
            <p
              style={{ margin: "0 auto 12px", opacity: 0.8, color: "#0f172a" }}
            >
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

              // cover path (backend qaytargan): /uploads/....
              const coverPath = covers[Number(ev.id)];
              const cover = coverPath ? fileUrl(coverPath) : "";

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
                    transition:
                      "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 16px 36px rgba(2,6,23,0.10)";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 26px rgba(2,6,23,0.06)";
                    e.currentTarget.style.borderColor = "rgba(15,23,42,0.08)";
                  }}
                >
                  {/* cover */}
                  <div
                    style={{
                      position: "relative",
                      height: 190,
                      background: "rgba(15,23,42,0.06)",
                    }}
                  >
                    {cover ? (
                      <img
                        src={cover} // ✅ /api qo‘shilmaydi
                        alt={ev.title}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          // fallback (optional)
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background:
                            "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.12))",
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
                        fontWeight: 800,
                        fontSize: 16,
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
                  fontWeight: 800,
                  fontSize: "clamp(20px,3vw,50px)",
                  color: "#0f172a",
                  marginTop: 8,
                }}
              >
                {t("home.trustedLinks")}
              </h2>
            </div>

            <div
              ref={emblaRef}
              style={{ overflow: "hidden", padding: "20px, 0" }}
            >
              <div style={{ display: "flex", gap: 16 }}>
                {orgs.map((org: any) => (
                  <div key={org.id} style={{ flex: "0 0 340px" }}>
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(15,23,42,0.10)",
                        borderRadius: 20,
                        padding: "22px",
                        textAlign: "center",
                        textDecoration: "none",
                        transition: "all 0.25s ease",
                        boxShadow: "0 12px 30px rgba(2,6,23,0.08)",
                        height: 170, // 🔹 hamma card bir xil balandlik
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 18px 44px rgba(2,6,23,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow =
                          "0 12px 30px rgba(2,6,23,0.08)";
                      }}
                    >
                      <img
                        src={org.logo}
                        alt={org.name}
                        loading="lazy"
                        style={{
                          width: 86,
                          height: 86,
                          objectFit: "contain",
                          marginBottom: 10,
                        }}
                      />

                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#0f172a",
                          fontFamily: "DM Sans, sans-serif",
                          lineHeight: 1.25,

                          display: "-webkit-box",
                          WebkitLineClamp: 2, // 🔹 faqat 2 qator
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          height: 38, // 🔹 text uchun fixed joy
                        }}
                      >
                        {org.name}
                      </div>
                    </a>
                  </div>
                ))}
              </div>
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
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
            🎫 TripDay
          </span>
          <span style={{ fontSize: 12, color: "rgba(15,23,42,0.70)" }}>
            © 2025 TripDay
          </span>
        </div>
      </footer>
    </div>
  );
}
