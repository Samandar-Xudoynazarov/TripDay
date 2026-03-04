import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { eventsSvc, adminSvc, registrationsApi } from "@/lib/api";
import Shell from "@/components/Shell";
import RegistrationsDialog from "@/components/RegistrationsDialog";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  MapPin,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import useEmblaCarousel from "embla-carousel-react";

export default function AdminEventDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { hasRole, isLoading, user } = useAuth();
  const isSuper = hasRole("SUPER_ADMIN");
  const base = isSuper ? "/super-admin" : "/admin";
  const label = isSuper ? "Super Admin" : "Admin";

  const eventId = Number(id);

  // ✅ ENV
  const ORIGIN = import.meta.env.VITE_BACKEND_URL || "https://tripday.uz";
  const API_PREFIX = import.meta.env.VITE_API_BASE_URL || "/api";

  const apiUrl = (p: string) =>
    `${ORIGIN}${API_PREFIX}${p.startsWith("/") ? "" : "/"}${p}`;

  const fileUrl = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    return `${ORIGIN}${p.startsWith("/") ? "" : "/"}${p}`;
  };

  const [ev, setEv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const [images, setImages] = useState<string[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: images.length > 1,
  });

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const items = [
    { label: `${label} panel`, to: `${base}?tab=overview`, icon: "dashboard" },
    { label: "Tadbirlar", to: `${base}?tab=events`, icon: "events" },
    { label: "Bosh sahifa", to: "/", icon: "home" },
  ];

  useEffect(() => {
    if (isLoading) return;
    if (!user || (!hasRole("ADMIN") && !hasRole("SUPER_ADMIN"))) {
      nav("/login");
      return;
    }
    load();
  }, [id, isLoading]);

  const load = async () => {
    setLoading(true);

    try {
      const [evData, imgs] = await Promise.all([
        eventsSvc.getById(eventId),

        // ✅ images API
        fetch(apiUrl(`/events/${eventId}/images`))
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ]);

      setEv(evData);
      setImages(Array.isArray(imgs) ? imgs : []);

      const pending = await adminSvc.pendingEvents();
      setIsPending(pending.some((p: any) => p.id === eventId));
    } catch {
      toast.error("Tadbir topilmadi");
      nav(base);
    } finally {
      setLoading(false);
    }
  };

  const loadRegs = async (eid: number) => {
    const res = await registrationsApi.getAll();
    const all = Array.isArray(res.data) ? res.data : [];
    return all.filter((r: any) => Number(r?.eventId ?? r?.event?.id) === Number(eid));
  };

  const approve = async () => {
    await adminSvc.approveEvent(eventId);
    toast.success("Tasdiqlandi");
    load();
  };

  const reject = async () => {
    if (!reason.trim()) {
      toast.error("Sabab kiriting");
      return;
    }

    await adminSvc.rejectEvent(eventId, reason);
    toast.success("Rad etildi");
    nav(`${base}?tab=events`);
  };



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

  const d = ev ? new Date(ev.eventDateTime) : null;
  const imageUrls = images.map(fileUrl);

  return (
    <Shell items={items} title={label}>
      <div style={{ padding: "28px", maxWidth: 760 }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 24 }}
          onClick={() => nav(`${base}?tab=events`)}
        >
          <ArrowLeft size={14} />
          Orqaga
        </button>

        {/* ✅ SLIDER */}
        {imageUrls.length > 0 && (
          <div
            className="card"
            style={{
              marginBottom: 20,
              overflow: "hidden",
              borderRadius: 18,
            }}
          >
            <div style={{ position: "relative" }}>
              <div ref={emblaRef} style={{ overflow: "hidden" }}>
                <div style={{ display: "flex" }}>
                  {imageUrls.map((src, i) => (
                    <div key={i} style={{ flex: "0 0 100%" }}>
                      <img
                        src={src}
                        style={{
                          width: "100%",
                          height: 320,
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

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
                    }}
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
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {ev && (
          <div className="card anim-up">
            <div
              style={{
                height: 4,
                background:
                  "linear-gradient(90deg,var(--accent),var(--accent2))",
              }}
            />

            <div style={{ padding: "28px" }}>
              <h1
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 800,
                  fontSize: 24,
                  marginBottom: 10,
                }}
              >
                {ev.title}
              </h1>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {d && !isNaN(d.getTime()) && (
                  <span className="tag">
                    <Clock size={13} /> {format(d, "dd MMM yyyy, HH:mm")}
                  </span>
                )}

                <span className="tag">
                  <MapPin size={13} /> {ev.locationName}
                </span>

                {ev.organizationName && (
                  <span className="tag">
                    <Building2 size={13} /> {ev.organizationName}
                  </span>
                )}
              </div>

              <p style={{ marginTop: 20 }}>{ev.description}</p>

              <div style={{ marginTop: 16 }}>
                <RegistrationsDialog
                  eventId={eventId}
                  eventTitle={ev?.title}
                  triggerVariant="button"
                  load={loadRegs}
                />
              </div>

              {isPending && (
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn" onClick={approve}>
                    <CheckCircle size={15} />
                    Tasdiqlash
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={() => setRejectOpen(true)}
                  >
                    <XCircle size={15} />
                    Rad etish
                  </button>
                </div>
              )}

              {/* Event o'chirish: faqat tashkilotchi (TOUR_ORGANIZATION)da qoladi */}
            </div>
          </div>
        )}
      </div>

      {rejectOpen && (
        <div className="modal-bg" onClick={() => setRejectOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rad etish sababi</h3>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="inp"
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-danger" onClick={reject}>
                Rad etish
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => setRejectOpen(false)}
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