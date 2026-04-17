import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { eventsSvc, regsSvc, likesSvc, commentsSvc } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ImageSlider from "@/components/ImageSlider";
import { useSEO, buildEventStructuredData } from "@/hooks/useSEO";
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
  CalendarDays,
  X,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { getEventDate, deduplicateEvents } from "@/lib/event-utils";

export default function EventDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, hasRole } = useAuth();
  const eventId = Number(id);

  const ORIGIN = import.meta.env.VITE_BACKEND_URL || "https://tripday.uz" || "http://10.207.208.105:8081";
  const API_PREFIX = import.meta.env.VITE_API_BASE_URL || "/api";
  const apiUrl = (p: string) =>
    `${ORIGIN}${API_PREFIX}${p.startsWith("/") ? "" : "/"}${p}`;
  const fileUrl = (p?: string | null) => {
    if (!p) return "";

    let value = String(p).trim();
    if (!value) return "";

    value = value.replace("/uploads/events/", "/uploads/");

    if (/^https?:\/\//i.test(value)) return value;

    const normalizedPath = value.startsWith("/") ? value : `/${value}`;
    return `${ORIGIN}${normalizedPath}`;
  };

  const [ev, setEv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [regsCount, setRegsCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [registered, setRegistered] = useState(false);
  const [regList, setRegList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // ✅ Siblings (bir xil event orasidan kun tanlash)
  const [siblings, setSiblings] = useState<any[]>([]);
  const [dayModal, setDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [registeringDay, setRegisteringDay] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    Promise.all([
      eventsSvc.getById(eventId),
      likesSvc.count(eventId).catch(() => 0),
      regsSvc.getCountByEvent(eventId).catch(() => 0),
      commentsSvc.getAll(eventId).catch(() => []),
      fetch(apiUrl(`/events/${eventId}/images`))
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([evData, lk, rc, cm, imgs]) => {
        setEv(evData);
        setLikes(Number(lk) || 0);
        setRegsCount(Number(rc) || 0);
        setComments(Array.isArray(cm) ? cm : []);
        setImages(Array.isArray(imgs) ? imgs.map(String) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId, ORIGIN, API_PREFIX]);

  // ✅ Siblings: shu event bilan bir xil title+organizationId ga ega barcha eventlarni olish
  useEffect(() => {
    if (!ev) return;
    eventsSvc
      .getAll()
      .then((all: any[]) => {
        const arr = Array.isArray(all) ? all : [];
        // Shu eventga tegishli guruhni topamiz
        const deduplicated = deduplicateEvents(arr);
        const group = deduplicated.find((g) =>
          g._siblings?.some((s: any) => Number(s.id) === eventId),
        );
        if (group && group._siblings.length > 1) {
          setSiblings(group._siblings);
        } else {
          setSiblings([]);
        }
      })
      .catch(() => setSiblings([]));
  }, [ev, eventId]);

  useEffect(() => {
    if (!eventId) return;
    const key = `liked_event_${eventId}_${user?.id ?? "guest"}`;
    setLiked(localStorage.getItem(key) === "1");
  }, [eventId, user?.id]);

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

  useEffect(() => {
    const canSee = Boolean(
      user &&
      ev &&
      ev.organizationId &&
      user.organizationId &&
      Number(ev.organizationId) === Number(user.organizationId),
    );
    if (!canSee) return;
    regsSvc
      .getAll()
      .then((all) => {
        const arr = Array.isArray(all) ? all : [];
        setRegList(
          arr.filter(
            (r: any) => r.eventId === eventId || r.event?.id === eventId,
          ),
        );
      })
      .catch(() => setRegList([]));
  }, [user?.id, user?.organizationId, ev?.organizationId, eventId]);

  const doLike = async () => {
    if (!user) {
      nav("/login");
      return;
    }
    try {
      await likesSvc.toggle(eventId);
      const key = `liked_event_${eventId}_${user?.id ?? "guest"}`;
      setLiked((p) => {
        const n = !p;
        localStorage.setItem(key, n ? "1" : "0");
        return n;
      });
      const c = await likesSvc.count(eventId).catch(() => null);
      if (c !== null) setLikes(Number(c) || 0);
      else setLikes((l) => l + 1);
    } catch {}
  };

  // ✅ Ro'yxatdan o'tish: agar siblings bo'lsa modal ochiladi, aks holda to'g'ridan register
  const handleRegisterClick = () => {
    if (!user) {
      nav("/login");
      return;
    }
    if (siblings.length > 1) {
      setSelectedDay(null);
      setDayModal(true);
    } else {
      doRegisterDirect(eventId);
    }
  };

  const doRegisterDirect = async (eid: number) => {
    setRegLoading(true);
    try {
      await regsSvc.register(eid);
      setRegistered(true);
      setRegsCount((c) => c + 1);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Xatolik");
    } finally {
      setRegLoading(false);
    }
  };

  const doRegisterDay = async () => {
    if (!selectedDay) return;
    setRegisteringDay(true);
    try {
      await regsSvc.register(Number(selectedDay.id));
      setRegistered(true);
      setRegsCount((c) => c + 1);
      setDayModal(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Xatolik");
    } finally {
      setRegisteringDay(false);
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

  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://tripday.uz';
  useSEO(
    ev
      ? {
          title: `${ev.title} — TripDay`,
          description: ev.description?.slice(0, 160) || 'TripDay tadbirlar platformasi',
          image: images[0] ? `${BACKEND}${images[0]}` : undefined,
          url: `https://tripday.uz/events/${eventId}`,
          type: 'event',
          extraKeywords: [
            ev.title,
            ev.locationName,
            `${ev.title} Toshkent`,
            `${ev.title} O'zbekiston`,
            `${ev.title} Uzbekistan`,
            `${ev.title} событие`,
            `${ev.title} мероприятие`,
            ev.organizationName,
          ].filter(Boolean) as string[],
          structuredData: buildEventStructuredData({
            title: ev.title,
            description: ev.description,
            locationName: ev.locationName,
            latitude: Number(ev.latitude),
            longitude: Number(ev.longitude),
            eventDateTime: ev.eventDateTime,
            startDate: ev.startDate,
            endDate: ev.endDate,
            imageUrl: images[0] ? `${BACKEND}${images[0]}` : undefined,
            organizationName: ev.organizationName,
          }),
        }
      : { title: 'TripDay — Tadbir', url: `https://tripday.uz/events/${eventId}` }
  );

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
              fontFamily: "DM Sans,sans-serif",
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
  const lat = Number(ev.latitude);
  const lng = Number(ev.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const imageUrls = images.map(fileUrl).filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "none" }}>
      <Navbar />

      <div
        style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 32px" }}
      >
        <Link
          to="/events"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(15,23,42,0.65)",
            textDecoration: "none",
            fontSize: 13,
            marginBottom: 14,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} /> Tadbirlarga qaytish
        </Link>

        {/* Slider */}
        <ImageSlider images={imageUrls} />

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
                      fontFamily: "DM Sans,sans-serif",
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
                    fontFamily: "DM Sans,sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(20px,3vw,28px)",
                    color: "#0f172a",
                    lineHeight: 1.2,
                    marginBottom: 8,
                  }}
                >
                  {ev.title}
                </h1>
                {/* ✅ Ko'p kunli bo'lsa date range badge */}
                {siblings.length > 1 && (
                  <div style={{ marginBottom: 10 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(99,102,241,0.10)",
                        border: "1px solid rgba(99,102,241,0.20)",
                        borderRadius: 999,
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#4f46e5",
                      }}
                    >
                      <CalendarDays size={13} />
                      {siblings.length} kunlik tadbir
                    </span>
                  </div>
                )}
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
                      <Clock size={13} /> {format(d, "HH:mm")}
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
                    <MapPin size={13} /> {ev.locationName}
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
                      <Building2 size={13} /> {ev.organizationName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: 14,
                color: "rgba(15,23,42,0.70)",
                lineHeight: 1.8,
                marginBottom: 18,
                whiteSpace: "pre-wrap",
                fontWeight: 500,
              }}
            >
              {ev.description}
            </p>

            {/* MAP */}
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
                    style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}
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
                    Google Maps'da ochish →
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
                  onClick={handleRegisterClick}
                  disabled={regLoading}
                >
                  {regLoading ? (
                    <span
                      className="spinner"
                      style={{ width: 16, height: 16, borderWidth: 2 }}
                    />
                  ) : (
                    <>
                      <Users size={15} /> Ro'yxatdan o'tish
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
              <button
                className="btn"
                onClick={doLike}
                style={{
                  gap: 6,
                  background: liked
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(255,255,255,0.75)",
                  border: liked
                    ? "1px solid rgba(239,68,68,0.22)"
                    : "1px solid var(--border)",
                  color: liked ? "#ef4444" : "var(--text)",
                }}
              >
                <Heart size={15} color={liked ? "#ef4444" : "var(--text)"} />{" "}
                {likes}
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
                <Users size={14} /> {regsCount} ishtirokchi
              </div>
            </div>

            {/* Registrations list */}
            {regList.length > 0 && (
              <div
                style={{
                  marginTop: 18,
                  borderTop: "1px solid rgba(15,23,42,0.10)",
                  paddingTop: 14,
                }}
              >
                <div
                  style={{ fontWeight: 900, marginBottom: 8, color: "#0f172a" }}
                >
                  Ro'yxatdan o'tganlar ({regList.length})
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                    gap: 10,
                  }}
                >
                  {regList.slice(0, 24).map((r: any, idx: number) => (
                    <div
                      key={r?.id ?? idx}
                      style={{
                        background: "rgba(255,255,255,0.75)",
                        border: "1px solid rgba(15,23,42,0.10)",
                        borderRadius: 14,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 13 }}>
                        {r?.userFullName ||
                          r?.user?.fullName ||
                          r?.userName ||
                          "Ism yo'q"}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "rgba(15,23,42,0.65)" }}
                      >
                        {r?.userEmail || r?.user?.email || ""}
                      </div>
                    </div>
                  ))}
                </div>
                {regList.length > 24 && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color: "rgba(15,23,42,0.65)",
                    }}
                  >
                    +{regList.length - 24} ta yana...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div style={{ marginTop: 24 }}>
          <h2
            style={{
              fontFamily: "DM Sans,sans-serif",
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
          <form
            onSubmit={doComment}
            style={{ display: "flex", gap: 10, marginBottom: 20 }}
          >
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                user ? "Izoh qoldiring..." : "Izoh qoldirish uchun kiring"
              }
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

      {/* ✅ KUN TANLASH MODAL */}
      {dayModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(2,6,23,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setDayModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: "28px 24px",
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 24px 60px rgba(2,6,23,0.18)",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 18,
                    color: "#0f172a",
                    fontFamily: "DM Sans,sans-serif",
                  }}
                >
                  Kunni tanlang
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(15,23,42,0.55)",
                    marginTop: 3,
                  }}
                >
                  {ev.title} — {siblings.length} ta kun
                </div>
              </div>
              <button
                onClick={() => setDayModal(false)}
                style={{
                  background: "rgba(15,23,42,0.06)",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={16} color="#0f172a" />
              </button>
            </div>

            {/* Kun ro'yxati */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {siblings.map((sibling: any) => {
                const sibDate = getEventDate(sibling);
                const isSelected = selectedDay?.id === sibling.id;
                return (
                  <button
                    key={sibling.id}
                    onClick={() => setSelectedDay(sibling)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 16,
                      cursor: "pointer",
                      border: isSelected
                        ? "2px solid #4f46e5"
                        : "1px solid rgba(15,23,42,0.12)",
                      background: isSelected ? "rgba(99,102,241,0.07)" : "#fff",
                      transition: "all 0.15s",
                      textAlign: "left",
                    }}
                  >
                    {/* Sana blokchai */}
                    <div
                      style={{
                        background: isSelected
                          ? "rgba(99,102,241,0.15)"
                          : "rgba(15,23,42,0.05)",
                        borderRadius: 12,
                        padding: "8px 12px",
                        textAlign: "center",
                        minWidth: 52,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 20,
                          color: isSelected ? "#4f46e5" : "#0f172a",
                          lineHeight: 1,
                        }}
                      >
                        {sibDate ? format(sibDate, "dd") : "—"}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(15,23,42,0.55)",
                          textTransform: "uppercase",
                          marginTop: 2,
                          fontWeight: 700,
                        }}
                      >
                        {sibDate ? format(sibDate, "MMM") : ""}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: isSelected ? "#4f46e5" : "#0f172a",
                        }}
                      >
                        {sibDate ? format(sibDate, "EEEE, dd MMMM yyyy") : "—"}
                      </div>
                      {sibDate && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "rgba(15,23,42,0.55)",
                            marginTop: 3,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={11} /> {format(sibDate, "HH:mm")}
                        </div>
                      )}
                    </div>
                    {isSelected && <CheckCircle size={18} color="#4f46e5" />}
                  </button>
                );
              })}
            </div>

            {/* Tasdiqlash tugmasi */}
            <button
              onClick={doRegisterDay}
              disabled={!selectedDay || registeringDay}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 16,
                background: selectedDay
                  ? "linear-gradient(135deg,#4f46e5,#6366f1)"
                  : "rgba(15,23,42,0.08)",
                color: selectedDay ? "#fff" : "rgba(15,23,42,0.35)",
                fontWeight: 800,
                fontSize: 15,
                border: "none",
                cursor: selectedDay ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              {registeringDay ? (
                <span
                  className="spinner"
                  style={{
                    width: 18,
                    height: 18,
                    borderWidth: 2,
                    borderColor: "#fff",
                    borderTopColor: "transparent",
                  }}
                />
              ) : (
                <>
                  <Users size={16} /> Ro'yxatdan o'tish
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
