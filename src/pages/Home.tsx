import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { eventsSvc, orgsSvc } from "@/lib/api";
import Navbar from "@/components/Navbar";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Zap,
  Globe,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export default function HomePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);

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
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    eventsSvc
      .getUpcoming()
      .then(setEvents)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIdx((p) => (p + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);
  const top = events.slice(0, 6);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(124,106,247,0.1),transparent 70%)",
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
            background:
              "radial-gradient(circle,rgba(240,98,146,0.07),transparent 70%)",
            bottom: -100,
            left: -50,
            pointerEvents: "none",
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
              alignItems: "flex-start", // ⬅ chapga
              textAlign: "left", // ⬅ chapga
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
                justifyContent: "flex-start", // ⬅ chapga
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
                  <div
                    style={{
                      fontFamily: "Arel",
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              
              <span
                style={{
                  fontSize: 20,
                  color: "blue",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
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
                fontWeight: 600,
                fontSize: "clamp(12px,2vw,22px)",
                color: "blue",
              }}
            >
              Nima bo'lyapti
            </h2>
          </div>
          <Link
            to="/events"
            className="btn btn-ghost btn-sm"
            style={{ textDecoration: "none", color: "blue" }}
          >
            Hammasi <ArrowRight size={13} />
          </Link>
        </div>

        {top.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--text-muted)",
            }}
          >
            <CalendarDays
              size={40}
              style={{ margin: "0 auto 12px", opacity: 0.25, color: "blue" }}
            />
            <p style={{ margin: "0 auto 12px", opacity: 0.25, color: "blue" }}>
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
              return (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="card card-hover anim-up"
                  style={{
                    textDecoration: "none",
                    display: "block",
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <div
                    style={{
                      height: 3,
                      background:
                        "linear-gradient(90deg,var(--accent),var(--accent2))",
                      opacity: 0.65,
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
                          borderRadius: 9,
                          padding: "6px 11px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "Syne,sans-serif",
                            fontWeight: 700,
                            fontSize: 20,
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
                            marginTop: 1,
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
                        marginBottom: 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {ev.description}
                    </p>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          color: "var(--text-muted)",
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
                            color: "var(--text-muted)",
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
            background: "none",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <span
                style={{
                  fontSize: 18,
                  color: "blue",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Hamkor tashkilotlar
              </span>

              <h2
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(20px,3vw,50px)",
                  color: "blue",
                  marginTop: 8,
                }}
              >
                Ishonchli havolalar
              </h2>
            </div>

            {/* Slider */}
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
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: "18px 20px",
                    textAlign: "center",
                    textDecoration: "none",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* LOGO (blue tint) */}
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

                      // hamma rasmni ko‘k rangga o‘tkazish (tint)
                      filter:
                        "brightness(0) saturate(100%) invert(27%) sepia(92%) saturate(3800%) hue-rotate(205deg) brightness(95%) contrast(105%)",
                    }}
                  />

                  <div
                    style={{
                      width: 300,
                      margin: "0 auto",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text)",
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

      {/* CTA */}
      {/* {!user && (
        <section
          style={{
            padding: "70px 24px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center,rgba(124,106,247,0.06),transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              className="tag tag-accent anim-up"
              style={{ margin: "0 auto 18px" }}
            >
              <TrendingUp size={10} /> Hoziroq boshlang
            </div>
            <h2
              className="anim-up s1"
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 800,
                fontSize: "clamp(22px,4vw,42px)",
                marginBottom: 14,
              }}
            >
              Tadbirlaringizni <span className="gradient-text">yarating</span>
            </h2>
            <p
              className="anim-up s2"
              style={{
                fontSize: 15,
                color: "var(--text-muted)",
                marginBottom: 28,
                maxWidth: 440,
                margin: "0 auto 28px",
              }}
            >
              Tashkilot sifatida ro'yxatdan o'ting va o'z tadbirlaringizni e'lon
              qiling
            </p>
            <div className="anim-up s3">
              <Link
                to="/register"
                className="btn btn-primary"
                style={{
                  textDecoration: "none",
                  padding: "14px 32px",
                  fontSize: 15,
                }}
              >
                Bepul boshlash <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )} */}

      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px",
          background: "var(--surface)",
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
              color: "var(--text)",
            }}
          >
            🎫 TripDay
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            © 2025 TripDay
          </span>
        </div>
      </footer>
    </div>
  );
}
