import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { eventsSvc } from "@/lib/api";
import Navbar from "@/components/Navbar";
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
import { getEventDate, deduplicateEvents } from "@/lib/event-utils";
import { useSEO } from "@/hooks/useSEO";

type CoversMap = Record<number, string>;

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  useSEO({
    title: 'TripDay — Tadbirlar, Mehmonxonalar va Sayohatlar Platformasi',
    description: 'Konsertlar, forumlar, ko\'rgazmalar, mehmonxonalar — barchasi bir platformada. Ro\'yxatdan o\'ting va sevimli tadbirlaringizni o\'tkazib yubormang.',
    url: 'https://tripday.uz/',
    extraKeywords: [
      // O'zbek
      'O\'zbekistonda tadbirlar', 'sayohat platformasi', 'onlayn chipta', 'tadbir platformasi',
      // Rus
      'платформа мероприятий Узбекистан', 'онлайн регистрация на мероприятия', 'события сегодня Ташкент',
      // Ingliz
      'event platform Uzbekistan', 'online event registration', 'things to do in Tashkent', 'travel platform Uzbekistan',
    ],
  });

  const ORIGIN = (
    import.meta.env.VITE_BACKEND_URL || "https://tripday.uz"
  ).replace(/\/+$/, "");
  const API_PREFIX = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
    /\/+$/,
    "",
  );

  const apiUrl = (p: string) => {
    const path = p.startsWith("/") ? p : `/${p}`;
    return `${ORIGIN}${API_PREFIX}${path}`;
  };

  const fileUrl = (p?: string | null) => {
    if (!p) return "";

    let value = String(p).trim();
    if (!value) return "";

    value = value.replace("/uploads/events/", "/uploads/");

    if (/^https?:\/\//i.test(value)) return value;

    const normalizedPath = value.startsWith("/") ? value : `/${value}`;
    return `${ORIGIN}${normalizedPath}`;
  };

  const [events, setEvents] = useState<any[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [covers, setCovers] = useState<CoversMap>({});

  const heroImages = useMemo(
    () => [
      "/slides/01.png",
      "/slides/1.png",
      "/slides/2.png",
      "/slides/3.png",
      "/slides/4.png",
      "/slides/5.png",
      "/slides/6.png",
      "/slides/7.png",
      "/slides/8.png",
      "/slides/9.png",
    ],
    [],
  );

  const orgs = [
    {
      id: 1,
      name: "O'zbekiston Respublikasi Turizm qo'mitasi",
      website: "https://gov.uz/oz/uzbektourism",
      logo: "/partners/1.png",
    },
    {
      id: 2,
      name: "Samarqand viloyati hokimligi",
      website: "https://samarkand.uz/regional_government",
      logo: "/partners/hokimlik.png",
    },
    {
      id: 3,
      name: "Samarqand viloyati Turizm boshqarmasi",
      website: "https://samarkandtourism.uz/",
      logo: "/partners/turizim.png",
    },
  ];

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const list = await eventsSvc.getUpcoming();
        if (!alive) return;

        const arr = Array.isArray(list) ? list : [];
        const deduped = deduplicateEvents(arr);
        setEvents(deduped);

        const results = await Promise.all(
          deduped.slice(0, 12).map(async (ev: any) => {
            const id = Number(ev?.id);
            if (!id) return [0, ""] as const;

            try {
              const r = await fetch(apiUrl(`/events/${id}/images`), {
                method: "GET",
                headers: { Accept: "application/json" },
              });

              if (!r.ok) {
                console.log(`Image API failed for event ${id}:`, r.status);
                return [id, ""] as const;
              }

              const imgs = await r.json();
              const firstRaw =
                Array.isArray(imgs) && imgs.length ? String(imgs[0] ?? "") : "";
              const firstFullUrl = fileUrl(firstRaw);

              console.log("event id:", id);
              console.log("raw image path:", firstRaw);
              console.log("full image url:", firstFullUrl);

              return [id, firstFullUrl] as const;
            } catch (err) {
              console.log(`Image fetch error for event ${id}:`, err);
              return [id, ""] as const;
            }
          }),
        );

        if (!alive) return;

        const map: CoversMap = {};
        for (const [id, path] of results) {
          if (id && path) map[id] = path;
        }
        setCovers(map);
      } catch (err) {
        console.log("Home events fetch error:", err);
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
  }, [heroImages.length]);

  const top = useMemo(() => {
    const now = Date.now();
    return events
      .filter((ev) => {
        const d = getEventDate(ev);
        return d ? d.getTime() >= now : false;
      })
      .sort((a, b) => +(getEventDate(a) || 0) - +(getEventDate(b) || 0))
      .slice(0, 6);
  }, [events]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  useEffect(() => {
    if (!emblaApi) return;

    const timer = setInterval(() => {
      try {
        emblaApi.scrollNext();
      } catch {}
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
              <span className="gradient-text">{t("home.heroTitleTop")}</span>
              <br />
              {t("home.heroTitleBottom")}
            </h3>
            <p
              className="anim-up s2"
              style={{
                fontSize: "clamp(14px,2vw,17px)",
                color: "#e5e7eb",
                lineHeight: 1.75,
              }}
            >
              {t("home.heroDescription")}
            </p>
            <div
              className="anim-up s3"
              style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
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
              {t("home.nearbyEvents")}
            </span>
            
          </div>
          <Link
            to="/events"
            className="btn btn-ghost btn-sm"
            style={{ textDecoration: "none", color: "#0f172a" }}
          >
            {t("home.all")} <ArrowRight size={13} />
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
              {t("home.noUpcoming")}
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
              const d = getEventDate(ev) || new Date();
              const cover =
                covers[Number(ev.id)] ||
                (ev._siblings || []).map((s: any) => covers[Number(s.id)]).find(Boolean) ||
                "";
              const isMultiDay = (ev._siblings?.length ?? 1) > 1;

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
                  <div
                    style={{
                      position: "relative",
                      height: 190,
                      background: "rgba(15,23,42,0.06)",
                    }}
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={ev.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          console.log("Image load failed:", cover);
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

                    <div style={{ position: "absolute", left: 12, top: 12 }}>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.80)",
                          border: "1px solid rgba(15,23,42,0.08)",
                          backdropFilter: "blur(10px)",
                          borderRadius: 10,
                          padding: "6px 10px",
                          textAlign: "center",
                        }}
                      >
                        {isMultiDay ? (
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 11,
                              color: "#4f46e5",
                              lineHeight: 1.3,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ev._dateRange}
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>

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
                        {isMultiDay ? `${ev._siblings.length} kun` : "Upcoming"}
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
                        <MapPin size={10} /> {ev.locationName}
                      </span>
                      {!isMultiDay && !isNaN(d.getTime()) && (
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
                          <Clock size={10} /> {format(d, "HH:mm")}
                        </span>
                      )}
                      {isMultiDay && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            color: "rgba(99,102,241,0.85)",
                            fontWeight: 700,
                          }}
                        >
                          <CalendarDays size={10} /> {ev._dateRange}
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
              className="orgs-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 20,
              }}
            >
              {orgs.map((org) => (
                <a
                  key={org.id}
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
                    padding: "32px 24px",
                    textAlign: "center",
                    textDecoration: "none",
                    transition: "all 0.25s ease",
                    boxShadow: "0 12px 30px rgba(2,6,23,0.08)",
                    minHeight: 210,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 48px rgba(2,6,23,0.13)";
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
                      width: 100,
                      height: 100,
                      objectFit: "contain",
                      marginBottom: 16,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#0f172a",
                      fontFamily: "DM Sans, sans-serif",
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {org.name}
                  </div>
                </a>
              ))}
            </div>

            <div
              className="orgs-slider"
              ref={emblaRef}
              style={{ overflow: "hidden", padding: "8px 0", display: "none" }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                {orgs.map((org) => (
                  <div
                    key={org.id}
                    style={{ flex: "0 0 clamp(140px, 60vw, 220px)" }}
                  >
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
                        borderRadius: 16,
                        padding: "18px 12px",
                        textAlign: "center",
                        textDecoration: "none",
                        boxShadow: "0 12px 30px rgba(2,6,23,0.08)",
                        height: 155,
                      }}
                    >
                      <img
                        src={org.logo}
                        alt={org.name}
                        loading="lazy"
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "contain",
                          marginBottom: 10,
                        }}
                      />
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#0f172a",
                          fontFamily: "DM Sans, sans-serif",
                          lineHeight: 1.3,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {org.name}
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <style>{`
              @media (max-width: 600px) {
                .orgs-grid   { display: none !important; }
                .orgs-slider { display: block !important; }
              }
            `}</style>
          </div>
        </section>
      )}

      <footer
        style={{
          background: "#0f172a",
          color: "#fff",
          padding: "48px 24px 28px",
          marginTop: 0,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 36,
              marginBottom: 40,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <img
                  src="/png.png"
                  alt="TripDay"
                  style={{
                    height: 44,
                    width: "auto",
                    filter: "brightness(0) invert(1)",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  lineHeight: 1.7,
                  maxWidth: 240,
                }}
              >
                O'zbekistondagi tadbirlar, konsertlar va sayohat imkoniyatlari —
                barchasi bir platformada.
              </p>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#e2e8f0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 16,
                }}
              >
                Havolalar
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  { to: "/", label: "Bosh sahifa" },
                  { to: "/events", label: "Tadbirlar" },
                  { to: "/hotels", label: "Mehmonxonalar" },
                  { to: "/register", label: "Ro'yxatdan o'tish" },
                ].map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    style={{
                      color: "#94a3b8",
                      textDecoration: "none",
                      fontSize: 14,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#94a3b8")
                    }
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#e2e8f0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 16,
                }}
              >
                Aloqa
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontSize: 14,
                  color: "#94a3b8",
                }}
              >
                <span>📍 Samarqand, O'zbekiston</span>
                <a
                  href="mailto:tourismsamarkand@gmail.com"
                  style={{ color: "#94a3b8", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#94a3b8")
                  }
                >
                  ✉️ tourismsamarkand@gmail.com
                </a>
                <a
                  href="https://t.me/tripday_uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#94a3b8", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#94a3b8")
                  }
                >
                  💬 Telegram kanal
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 13, color: "#475569" }}>
              © {new Date().getFullYear()} TripDay. Barcha huquqlar
              himoyalangan.
            </span>
            <div style={{ display: "flex", gap: 16 }}>
              {["Maxfiylik siyosati", "Foydalanish shartlari"].map((txt) => (
                <span
                  key={txt}
                  style={{ fontSize: 12, color: "#475569", cursor: "pointer" }}
                >
                  {txt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
