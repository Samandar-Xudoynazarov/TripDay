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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import useEmblaCarousel from "embla-carousel-react";

export default function EventDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, hasRole } = useAuth();
  const eventId = Number(id);

  // ✅ ENV: ORIGIN va API_PREFIX ajratiladi
  const ORIGIN = import.meta.env.VITE_BACKEND_URL || "https://tripday.uz";
  const API_PREFIX = import.meta.env.VITE_API_BASE_URL || "/api";

  // API so‘rov: /api bilan
  const apiUrl = (p: string) =>
    `${ORIGIN}${API_PREFIX}${p.startsWith("/") ? "" : "/"}${p}`;

  // File/img: /api YO‘Q
  const fileUrl = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${ORIGIN}${p.startsWith("/") ? "" : "/"}${p}`;
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

  // ✅ images (API’dan keladi)
  const [images, setImages] = useState<string[]>([]);

  // ✅ Embla slider (faqat images > 1 bo‘lsa loop)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: images.length > 1,
    align: "start",
  });

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);

    Promise.all([
      eventsSvc.getById(eventId),
      likesSvc.count(eventId).catch(() => 0),
      regsSvc.getCountByEvent(eventId).catch(() => 0),
      commentsSvc.getAll(eventId).catch(() => []),

      // ✅ images API: GET /api/events/:id/images
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

  // like local state
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
              (r: any) => r.eventId === eventId || r.event?.id === eventId
            )
        );
      })
      .catch(() => {});
  }, [user, eventId]);

  // registrations list (best-effort)
  useEffect(() => {
    const canSee = Boolean(
      user &&
        ev &&
        ev.organizationId &&
        user.organizationId &&
        Number(ev.organizationId) === Number(user.organizationId)
    );
    if (!canSee) return;

    regsSvc
      .getAll()
      .then((all) => {
        const arr = Array.isArray(all) ? all : [];
        const filtered = arr.filter(
          (r: any) => r.eventId === eventId || r.event?.id === eventId
        );
        setRegList(filtered);
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
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f7f8ff,#eef2ff)" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div className="spinner" />
        </div>
      </div>
    );

  if (!ev)
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f7f8ff,#eef2ff)" }}>
        <Navbar />
        <div style={{ maxWidth: 700, margin: "60px auto", padding: "0 24px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "DM Sans,sans-serif", fontSize: 22, color: "var(--text)", marginBottom: 12 }}>
            Tadbir topilmadi
          </h2>
          <Link to="/events" className="btn btn-ghost" style={{ textDecoration: "none" }}>
            Orqaga
          </Link>
        </div>
      </div>
    );

  const d = new Date(ev.eventDateTime);

  // coords
  const lat = Number(ev.latitude);
  const lng = Number(ev.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  // ✅ image urls (fileUrl bilan)
  const imageUrls = images.map(fileUrl).filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "none" }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 32px" }}>
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
            marginBottom: 14,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} /> Tadbirlarga qaytish
        </Link>

        {/* ✅ TOP SLIDER (rasmlar eng yuqorida) */}
        {imageUrls.length > 0 && (
          <div
            className="card"
            style={{
              marginBottom: 14,
              overflow: "hidden",
              borderRadius: 18,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 12px 30px rgba(2,6,23,0.06)",
            }}
          >
            <div style={{ position: "relative" }}>
              <div ref={emblaRef} style={{ overflow: "hidden" }}>
                <div style={{ display: "flex" }}>
                  {imageUrls.map((src, i) => (
                    <div key={i} style={{ flex: "0 0 100%" }}>
                      <img
                        src={src}
                        alt={`event-${eventId}-${i}`}
                        style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* arrows: faqat 1 tadan ko‘p bo‘lsa */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={scrollPrev}
                    className="btn"
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: "8px 10px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.75)",
                      border: "1px solid rgba(15,23,42,0.12)",
                      backdropFilter: "blur(10px)",
                    }}
                    type="button"
                    aria-label="prev"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={scrollNext}
                    className="btn"
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: "8px 10px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.75)",
                      border: "1px solid rgba(15,23,42,0.12)",
                      backdropFilter: "blur(10px)",
                    }}
                    type="button"
                    aria-label="next"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

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
          <div style={{ height: 4, background: "linear-gradient(90deg,var(--accent),var(--accent2))" }} />

          <div style={{ padding: "28px 28px 24px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" }}>
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
                  <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 800, fontSize: 28, color: "#4f46e5", lineHeight: 1 }}>
                    {format(d, "dd")}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(15,23,42,0.6)", textTransform: "uppercase", marginTop: 3, fontWeight: 700 }}>
                    {format(d, "MMM yyyy")}
                  </div>
                </div>
              )}

              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 800, fontSize: "clamp(20px,3vw,28px)", color: "#0f172a", lineHeight: 1.2, marginBottom: 8 }}>
                  {ev.title}
                </h1>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {!isNaN(d.getTime()) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(15,23,42,0.65)", fontSize: 13, fontWeight: 600 }}>
                      <Clock size={13} />
                      {format(d, "HH:mm")}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(15,23,42,0.65)", fontSize: 13, fontWeight: 600 }}>
                    <MapPin size={13} />
                    {ev.locationName}
                  </div>

                  {ev.organizationName && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(15,23,42,0.65)", fontSize: 13, fontWeight: 600 }}>
                      <Building2 size={13} />
                      {ev.organizationName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* description */}
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

            {/* ✅ MAP (tadbir ma’lumotlaridan keyin, kommentdan tepada) */}
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
                  <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>
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

            {/* Action row */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {!registered ? (
                <button className="btn btn-primary" onClick={doRegister} disabled={regLoading}>
                  {regLoading ? (
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  ) : (
                    <>
                      <Users size={15} />
                      Ro'yxatdan o'tish
                    </>
                  )}
                </button>
              ) : (
                <div className="tag tag-green" style={{ padding: "8px 16px", fontSize: 12 }}>
                  ✓ Ro'yxatdan o'tilgan
                </div>
              )}

              <button
                className="btn"
                onClick={doLike}
                style={{
                  gap: 6,
                  background: liked ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.75)",
                  border: liked ? "1px solid rgba(239,68,68,0.22)" : "1px solid var(--border)",
                  color: liked ? "#ef4444" : "var(--text)",
                }}
              >
                <Heart size={15} color={liked ? "#ef4444" : "var(--text)"} /> {likes}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(15,23,42,0.65)", fontSize: 13, marginLeft: "auto", fontWeight: 700 }}>
                <Users size={14} />
                {regsCount} ishtirokchi
              </div>
            </div>

            {/* Registrations list */}
            {regList.length > 0 && (
              <div style={{ marginTop: 18, borderTop: "1px solid rgba(15,23,42,0.10)", paddingTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 8, color: "#0f172a" }}>
                  Ro'yxatdan o'tganlar ({regList.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
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
                        {r?.userFullName || r?.user?.fullName || r?.userName || "Ism yo'q"}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(15,23,42,0.65)" }}>
                        {r?.userEmail || r?.user?.email || ""}
                      </div>
                    </div>
                  ))}
                </div>
                {regList.length > 24 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "rgba(15,23,42,0.65)" }}>
                    +{regList.length - 24} ta yana...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ✅ Comments (map tepada, comment pastda) */}
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
            <MessageCircle size={18} color="var(--accent)" /> Izohlar ({comments.length})
          </h2>

          <form onSubmit={doComment} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Izoh qoldiring..." : "Izoh qoldirish uchun kiring"}
              disabled={!user}
              className="inp"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!user || posting || !newComment.trim()}>
              <Send size={14} />
            </button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(15,23,42,0.65)", fontSize: 13 }}>
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
                    <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 800, marginBottom: 4 }}>
                      {c.userFullName || c.userName || "Foydalanuvchi"}
                    </div>
                    <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.6, fontWeight: 500 }}>
                      {c.text}
                    </div>
                  </div>

                  {user && (user.id === c.userId || hasRole("ADMIN") || hasRole("SUPER_ADMIN")) && (
                    <button className="btn btn-danger btn-sm" onClick={() => delComment(c.id)} style={{ padding: "5px 10px" }}>
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