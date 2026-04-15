import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { eventsSvc, adminSvc, registrationsApi } from "@/lib/api";
import Shell from "@/components/Shell";
import RegistrationsDialog from "@/components/RegistrationsDialog";
import EditEventDialog from "@/components/EditEventDialog";
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

  const ORIGIN = import.meta.env.VITE_BACKEND_URL || "https://tripday.uz";
  const API_PREFIX = import.meta.env.VITE_API_BASE_URL || "/api";

  const apiUrl = (p: string) =>
    `${ORIGIN}${API_PREFIX}${p.startsWith("/") ? "" : "/"}${p}`;

  const fileUrl = (p?: string | null) => {
    if (!p) return "";

    let value = String(p).trim();
    if (!value) return "";

    // full url bo‘lsa ham normalize qilamiz
    value = value.replace("/uploads/events/", "/uploads/");

    if (/^https?:\/\//i.test(value)) return value;

    const normalizedPath = value.startsWith("/") ? value : `/${value}`;
    return `${ORIGIN}${normalizedPath}`;
  };

  const [ev, setEv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<string[]>([]);
  // Ko'p kunlik tadbir: bir xil nom+tashkilotga ega pending kunlar
  const [pendingSiblings, setPendingSiblings] = useState<any[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: images.length > 1,
    align: "start",
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
      const [evData, imgs, pending] = await Promise.all([
        eventsSvc.getById(eventId),
        fetch(apiUrl(`/events/${eventId}/images`))
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        adminSvc.pendingEvents(),
      ]);

      setEv(evData);
      setImages(Array.isArray(imgs) ? imgs : []);
      setIsPending(pending.some((p: any) => p.id === eventId));

      // Bir xil nom + tashkilotga ega barcha pending kunlarni topamiz (siblings)
      const siblings = pending.filter(
        (p: any) =>
          p.id !== eventId &&
          String(p.title || "").trim() === String(evData.title || "").trim() &&
          String(p.organizationId || "") === String(evData.organizationId || ""),
      );
      setPendingSiblings(siblings);
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
    return all.filter(
      (r: any) => Number(r?.eventId ?? r?.event?.id) === Number(eid),
    );
  };

  const approve = async (onlyCurrent = false) => {
    try {
      const ids =
        onlyCurrent || pendingSiblings.length === 0
          ? [eventId]
          : [eventId, ...pendingSiblings.map((s: any) => s.id)];

      await Promise.all(ids.map((id) => adminSvc.approveEvent(id)));

      toast.success(
        ids.length > 1
          ? `${ids.length} ta kun tasdiqlandi ✅`
          : "Tasdiqlandi ✅",
      );
      load();
    } catch {
      toast.error("Tasdiqlab bo'lmadi");
    }
  };

  const reject = async (onlyCurrent = false) => {
    if (!reason.trim()) {
      toast.error("Sabab kiriting");
      return;
    }

    try {
      const ids =
        onlyCurrent || pendingSiblings.length === 0
          ? [eventId]
          : [eventId, ...pendingSiblings.map((s: any) => s.id)];

      await Promise.all(ids.map((id) => adminSvc.rejectEvent(id, reason)));

      toast.success(
        ids.length > 1 ? `${ids.length} ta kun rad etildi` : "Rad etildi",
      );
      nav(`${base}?tab=events`);
    } catch {
      toast.error("Rad etib bo'lmadi");
    }
  };

  const updateEvent = async (eventId: number, payload: any) => {
    try {
      await eventsSvc.update(eventId, payload);
      toast.success("Event yangilandi");
      await load();
    } catch {
      toast.error("Eventni yangilab bo'lmadi");
      throw new Error("Event update failed");
    }
  };

  const deleteEvent = async () => {
    if (!confirm("Eventni butunlay o'chirasizmi?")) return;

    try {
      await eventsSvc.delete(eventId);
      toast.success("Event o'chirildi");
      nav(`${base}?tab=events`);
    } catch {
      toast.error("Eventni o'chirib bo'lmadi");
    }
  };

  if (loading) {
    return (
      <Shell items={items} title={label}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </Shell>
    );
  }

  const d = ev ? new Date(ev.eventDateTime) : null;
  const imageUrls = images.map(fileUrl).filter(Boolean);

  return (
    <Shell items={items} title={label}>
      <div className="mx-auto w-full max-w-4xl px-4 py-7 md:px-6">
        {/* Back button */}
        <button
          onClick={() => nav(`${base}?tab=events`)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow"
        >
          <ArrowLeft size={14} />
          Orqaga
        </button>

        {/* ── IMAGE SLIDER (EventDetailPage uslubida) ── */}
        {imageUrls.length > 0 && (
          <div
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
              {/* Embla viewport */}
              <div ref={emblaRef} style={{ overflow: "hidden" }}>
                <div style={{ display: "flex" }}>
                  {imageUrls.map((src, i) => (
                    <div key={i} style={{ flex: "0 0 100%" }}>
                      <img
                        src={src}
                        alt={`Event image ${i + 1}`}
                        style={{
                          width: "100%",
                          height: 360,
                          objectFit: "cover",
                          display: "block",
                        }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Nav arrows */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={scrollPrev}
                    type="button"
                    aria-label="prev"
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
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={scrollNext}
                    type="button"
                    aria-label="next"
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
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── MAIN CARD ── */}
        {ev && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-cyan-400" />

            <div className="p-6 md:p-7">
              <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                {ev.title}
              </h1>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-3">
                {d && !isNaN(d.getTime()) && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-blue-200">
                    <Clock size={13} />
                    {format(d, "dd MMM yyyy, HH:mm")}
                  </span>
                )}

                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <MapPin size={13} />
                  {ev.locationName}
                </span>

                {ev.organizationName && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 ring-1 ring-violet-200">
                    <Building2 size={13} />
                    {ev.organizationName}
                  </span>
                )}
              </div>

              <p className="mt-5 whitespace-pre-line text-base leading-7 text-slate-700">
                {ev.description}
              </p>

              {/* ── ACTION BUTTONS ── */}
              <div className="mt-6 flex flex-wrap gap-3">
                {/* 🔵 Ko'k — Ro'yxatdan o'tganlar */}
                <RegistrationsDialog
                  eventId={eventId}
                  eventTitle={ev?.title}
                  triggerVariant="button"
                  load={loadRegs}
                />

                {/* 🟡 Sariq — Tahrirlash */}
                <EditEventDialog event={ev} onSave={updateEvent} />

                {/* 🔴 Qizil — O'chirish */}
                <button
                  onClick={deleteEvent}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:from-red-700 hover:to-rose-600"
                >
                  Eventni o'chirish
                </button>
              </div>

              {/* ── PENDING ACTIONS ── */}
              {isPending && (
                <div className="mt-5 space-y-3">
                  {/* Ko'p kunlik tadbir xabardorligi */}
                  {pendingSiblings.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      ⚠️ Bu <strong>{pendingSiblings.length + 1} kunlik</strong> tadbirning bir kuni.
                      Qolgan <strong>{pendingSiblings.length} kun</strong> ham kutmoqda.
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {/* 🟢 Hammasini tasdiqlash */}
                    {pendingSiblings.length > 0 && (
                      <button
                        onClick={() => approve(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:from-emerald-600 hover:to-green-500"
                      >
                        <CheckCircle size={15} />
                        Barcha {pendingSiblings.length + 1} kunni tasdiqlash
                      </button>
                    )}

                    {/* 🟢 Faqat shu kunni tasdiqlash */}
                    <button
                      onClick={() => approve(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-400 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                    >
                      <CheckCircle size={15} />
                      {pendingSiblings.length > 0 ? "Faqat shu kunni" : "Tasdiqlash"}
                    </button>

                    {/* 🔴 Rad etish */}
                    <button
                      onClick={() => setRejectOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:from-red-700 hover:to-pink-600"
                    >
                      <XCircle size={15} />
                      Rad etish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RAD ETISH MODAL ── */}
      {rejectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setRejectOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-xl font-bold text-slate-900">
              Rad etish sababi
            </h3>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Sababni kiriting..."
              className="mb-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
            />

            <div className="flex flex-wrap gap-3">
              {/* 🔴 Hammasini rad etish */}
              {pendingSiblings.length > 0 && (
                <button
                  onClick={() => reject(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:from-red-700 hover:to-rose-600"
                >
                  Barcha {pendingSiblings.length + 1} kunni rad etish
                </button>
              )}

              {/* 🔴 Faqat shu kunni rad etish */}
              <button
                onClick={() => reject(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-400 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
              >
                {pendingSiblings.length > 0 ? "Faqat shu kunni rad etish" : "Rad etish"}
              </button>

              {/* Neytral — Bekor */}
              <button
                onClick={() => setRejectOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
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
