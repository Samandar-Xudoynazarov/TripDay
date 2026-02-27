import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { eventsSvc, regsSvc, likesSvc, commentsSvc } from "@/lib/api";
import Navbar from "@/components/Navbar";
import {
  MapPin,
  Clock,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Users,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { format } from "date-fns";

export default function EventDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, hasRole } = useAuth();
  const eventId = Number(id);

  // ✅ ENV (prod/dev uchun)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; // masalan: http://10.113.31.105:8081/api
  const FILES_BASE = import.meta.env.VITE_FILES_BASE || "http://10.113.31.105:8081"; // uploads shu yerda

  const [ev, setEv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [likes, setLikes] = useState(0);
  const [regsCount, setRegsCount] = useState(0);

  const [comments, setComments] = useState<any[]>([]);
  const [registered, setRegistered] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // ✅ images
  const [images, setImages] = useState<string[]>([]);

  // helper: /uploads/... -> http://host/uploads/...
  const toFileUrl = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${FILES_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
  };

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);

    Promise.all([
      eventsSvc.getById(eventId),
      likesSvc.count(eventId).catch(() => 0),
      regsSvc.getCountByEvent(eventId).catch(() => 0),
      commentsSvc.getAll(eventId).catch(() => []),

      // ✅ images API:
      fetch(`${API_BASE}/events/${eventId}/images`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([evData, lk, rc, cm, imgs]) => {
        setEv(evData);
        setLikes(Number(lk) || 0);
        setRegsCount(Number(rc) || 0);
        setComments(Array.isArray(cm) ? cm : []);
        setImages(Array.isArray(imgs) ? imgs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId, API_BASE]);

  useEffect(() => {
    if (!user || !eventId) return;
    regsSvc
      .getByUser(user.id)
      .then((list) => {
        setRegistered(
          Array.isArray(list) &&
            list.some(
              (r: any) => r.eventId === eventId || r.event?.id === eventId,
            ),
        );
      })
      .catch(() => {});
  }, [user, eventId]);

  const doLike = async () => {
    if (!user) {
      nav("/login");
      return;
    }
    try {
      await likesSvc.toggle(eventId);
      // toggle bo‘lsa, count endpointni qayta olish yaxshiroq.
      const c = await likesSvc.count(eventId).catch(() => null);
      if (c !== null) setLikes(Number(c) || 0);
      else setLikes((l) => l + 1);
    } catch {}
  };

  const doRegister = async () => {
    if (!user) {
      nav("/login");
      return;
    }
    setRegLoading(true);
    try {
      await regsSvc.register(eventId);
      setRegistered(true);
      setRegsCount((c) => c + 1);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Xatolik");
    } finally {
      setRegLoading(false);
    }
  };

  const doComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      nav("/login");
      return;
    }
    if (!newComment.trim()) return;

    setPosting(true);
    try {
      await commentsSvc.create(eventId, newComment);
      const updated = await commentsSvc.getAll(eventId);
      setComments(Array.isArray(updated) ? updated : []);
      setNewComment("");
    } catch {
    } finally {
      setPosting(false);
    }
  };

  const delComment = async (cmId: number) => {
    try {
      await commentsSvc.delete(cmId);
      setComments((c) => c.filter((x: any) => x.id !== cmId));
    } catch {}
  };

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg,#f7f8ff,#eef2ff)",
        }}
      >
        <Navbar />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
          }}
        >
          <div className="spinner" />
        </div>
      </div>
    );

  if (!ev)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg,#f7f8ff,#eef2ff)",
        }}
      >
        <Navbar />
        <div
          style={{
            maxWidth: 700,
            margin: "60px auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "Syne,sans-serif",
              fontSize: 22,
              color: "var(--text)",
              marginBottom: 12,
            }}
          >
            Tadbir topilmadi
          </h2>
          <Link
            to="/events"
            className="btn btn-ghost"
            style={{ textDecoration: "none" }}
          >
            Orqaga
          </Link>
        </div>
      </div>
    );

  const d = new Date(ev.eventDateTime);

  // ✅ coords
  const lat = Number(ev.latitude);
  const lng = Number(ev.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "none",
      }}
    >
      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        {/* Back */}
        <Link
          to="/events"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(15,23,42,0.65)",
            textDecoration: "none",
            fontSize: 13,
            marginBottom: 24,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} /> Tadbirlarga qaytish
        </Link>

        {/* Main card */}
        <div
          className="card anim-up"
          style={{
            overflow: "visible",
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 12px 30px rgba(2,6,23,0.06)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              height: 4,
              background: "linear-gradient(90deg,var(--accent),var(--accent2))",
            }}
          />

          <div style={{ padding: "28px 28px 24px" }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              {!isNaN(d.getTime()) && (
                <div
                  style={{
                    background: "rgba(124,106,247,0.10)",
                    border: "1px solid rgba(124,106,247,0.18)",
                    borderRadius: 12,
                    padding: "10px 16px",
                    textAlign: "center",
                    minWidth: 60,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Syne,sans-serif",
                      fontWeight: 800,
                      fontSize: 28,
                      color: "#4f46e5",
                      lineHeight: 1,
                    }}
                  >
                    {format(d, "dd")}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(15,23,42,0.6)",
                      textTransform: "uppercase",
                      marginTop: 3,
                      fontWeight: 700,
                    }}
                  >
                    {format(d, "MMM yyyy")}
                  </div>
                </div>
              )}

              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    fontFamily: "Syne,sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(20px,3vw,28px)",
                    color: "#0f172a",
                    lineHeight: 1.2,
                    marginBottom: 8,
                  }}
                >
                  {ev.title}
                </h1>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {!isNaN(d.getTime()) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        color: "rgba(15,23,42,0.65)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <Clock size={13} />
                      {format(d, "HH:mm")}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      color: "rgba(15,23,42,0.65)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <MapPin size={13} />
                    {ev.locationName}
                  </div>

                  {ev.organizationName && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        color: "rgba(15,23,42,0.65)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <Building2 size={13} />
                      {ev.organizationName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ MAP */}
            {hasCoords && (
              <div
                style={{
                  marginBottom: 18,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(15,23,42,0.10)",
                  background: "#fff",
                  boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(99,102,241,0.08)",
                    borderBottom: "1px solid rgba(15,23,42,0.08)",
                  }}
                >
                  <MapPin size={14} color="#4f46e5" />
                  <div
                    style={{
                      fontSize: 13,
                      color: "#0f172a",
                      fontWeight: 700,
                    }}
                  >
                    {ev.locationName} ({lat.toFixed(5)}, {lng.toFixed(5)})
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      marginLeft: "auto",
                      fontSize: 12,
                      color: "#4f46e5",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Google Maps’da ochish →
                  </a>
                </div>

                <iframe
                  title="event-map"
                  width="100%"
                  height="260"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?output=embed&q=${lat},${lng}&z=14`}
                />
              </div>
            )}

            {/* ✅ GALLERY */}
            {images.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={toFileUrl(img)} // ✅ FIX: backend base + path
                    alt={`event-${eventId}-${i}`}
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid rgba(15,23,42,0.10)",
                      boxShadow: "0 8px 20px rgba(2,6,23,0.05)",
                      background: "#fff",
                    }}
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            <p
              style={{
                fontSize: 14,
                color: "rgba(15,23,42,0.70)",
                lineHeight: 1.8,
                marginBottom: 24,
                whiteSpace: "pre-wrap",
                fontWeight: 500,
              }}
            >
              {ev.description}
            </p>

            {/* Action row */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {!registered ? (
                <button
                  className="btn btn-primary"
                  onClick={doRegister}
                  disabled={regLoading}
                >
                  {regLoading ? (
                    <span
                      className="spinner"
                      style={{ width: 16, height: 16, borderWidth: 2 }}
                    />
                  ) : (
                    <>
                      <Users size={15} />
                      Ro'yxatdan o'tish
                    </>
                  )}
                </button>
              ) : (
                <div
                  className="tag tag-green"
                  style={{ padding: "8px 16px", fontSize: 12 }}
                >
                  ✓ Ro'yxatdan o'tilgan
                </div>
              )}

              <button className="btn btn-ghost" onClick={doLike} style={{ gap: 6 }}>
                <Heart size={15} /> {likes}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "rgba(15,23,42,0.65)",
                  fontSize: 13,
                  marginLeft: "auto",
                  fontWeight: 700,
                }}
              >
                <Users size={14} />
                {regsCount} ishtirokchi
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div style={{ marginTop: 24 }}>
          <h2
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: "#0f172a",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MessageCircle size={18} color="var(--accent)" /> Izohlar (
            {comments.length})
          </h2>

          {/* Input */}
          <form
            onSubmit={doComment}
            style={{ display: "flex", gap: 10, marginBottom: 20 }}
          >
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Izoh qoldiring..." : "Izoh qoldirish uchun kiring"}
              disabled={!user}
              className="inp"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!user || posting || !newComment.trim()}
            >
              <Send size={14} />
            </button>
          </form>

          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "rgba(15,23,42,0.65)",
                  fontSize: 13,
                }}
              >
                Hozircha izohlar yo'q. Birinchi bo'ling!
              </div>
            ) : (
              comments.map((c: any) => (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 10px 24px rgba(2,6,23,0.05)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--accent)",
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      {c.userFullName || c.userName || "Foydalanuvchi"}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#0f172a",
                        lineHeight: 1.6,
                        fontWeight: 500,
                      }}
                    >
                      {c.text}
                    </div>
                  </div>

                  {user &&
                    (user.id === c.userId ||
                      hasRole("ADMIN") ||
                      hasRole("SUPER_ADMIN")) && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => delComment(c.id)}
                        style={{ padding: "5px 10px" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}