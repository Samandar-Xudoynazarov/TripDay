import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, MapPin } from "lucide-react";

function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  const s = String(iso);
  if (s.length >= 16) return s.slice(0, 16);
  return s;
}

function normalizeToIsoNoTZ(dtLocal: string) {
  const v = (dtLocal || "").trim();
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return `${v}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)) return v;
  return "";
}

function toFloatOrNull(v: string) {
  const s = (v ?? "").trim();
  if (!s) return null;
  if (s === "undefined" || s === "null" || s === "NaN") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export type EditEventPayload = {
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  eventDateTime: string;
};

export default function EditEventDialog({
  event,
  onSave,
  disabled,
  triggerVariant,
}: {
  event: {
    id: number;
    title?: string;
    description?: string;
    locationName?: string;
    latitude?: number;
    longitude?: number;
    eventDateTime?: string;
  };
  onSave: (eventId: number, payload: EditEventPayload) => Promise<void>;
  disabled?: boolean;
  triggerVariant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(() => ({
    title: event?.title ?? "",
    description: event?.description ?? "",
    locationName: event?.locationName ?? "",
    latitude: String(event?.latitude ?? ""),
    longitude: String(event?.longitude ?? ""),
    eventDateTimeLocal: toLocalInputValue(event?.eventDateTime),
  }));

  const reset = () => {
    setForm({
      title: event?.title ?? "",
      description: event?.description ?? "",
      locationName: event?.locationName ?? "",
      latitude: String(event?.latitude ?? ""),
      longitude: String(event?.longitude ?? ""),
      eventDateTimeLocal: toLocalInputValue(event?.eventDateTime),
    });
  };

  const eventDateTimeIso = useMemo(
    () => normalizeToIsoNoTZ(form.eventDateTimeLocal),
    [form.eventDateTimeLocal],
  );
  const latPreview = useMemo(() => toFloatOrNull(form.latitude), [form.latitude]);
  const lngPreview = useMemo(() => toFloatOrNull(form.longitude), [form.longitude]);

  const canSubmit =
    !disabled &&
    form.title.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.locationName.trim().length > 0 &&
    latPreview !== null &&
    lngPreview !== null &&
    eventDateTimeIso.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Ma'lumotlarni to'liq kiriting");
      return;
    }
    const lat = latPreview;
    const lng = lngPreview;
    if (lat === null || lng === null) return;

    setSubmitting(true);
    try {
      await onSave(event.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        locationName: form.locationName.trim(),
        latitude: lat,
        longitude: lng,
        eventDateTime: eventDateTimeIso,
      });
      toast.success("Tadbir tahrirlandi ✅");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  /* Input uchun stil */
  const inp =
    "mt-1 border-slate-300 text-slate-900 placeholder:text-slate-400 " +
    "focus-visible:ring-amber-400 focus-visible:ring-offset-0 bg-white";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) reset();
      }}
    >
      <DialogTrigger asChild>
        {triggerVariant === "icon" ? (
          /* 🟡 Sariq — icon */
          <button
            disabled={!!disabled}
            title="Tahrirlash"
            className="inline-flex items-center justify-center rounded-xl
                       bg-gradient-to-r from-amber-500 to-yellow-400
                       px-3 py-2 text-sm font-semibold text-white shadow-md
                       transition hover:scale-[1.02] hover:from-amber-600 hover:to-yellow-500
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Pencil className="w-4 h-4" />
          </button>
        ) : (
          /* 🟡 Sariq — button */
          <button
            disabled={!!disabled}
            title="Tahrirlash"
            className="inline-flex items-center gap-2 rounded-xl
                       bg-gradient-to-r from-amber-500 to-yellow-400
                       px-4 py-2.5 text-sm font-semibold text-white shadow-md
                       transition hover:scale-[1.02] hover:from-amber-600 hover:to-yellow-500
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Pencil className="w-4 h-4" />
            Tahrirlash
          </button>
        )}
      </DialogTrigger>

      {/* ✅ Oq fon — form modali */}
      <DialogContent
        className="w-[calc(100vw-24px)] sm:max-w-xl max-h-[85vh] overflow-y-auto
                   rounded-2xl border border-slate-200
                   bg-white text-slate-900 shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-bold text-lg">
            Tadbirni tahrirlash
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-slate-700 font-semibold">Sarlavha</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className={inp}
            />
          </div>

          <div>
            <Label className="text-slate-700 font-semibold">Tavsif</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              className={inp}
            />
          </div>

          <div>
            <Label className="text-slate-700 font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" /> Joy nomi
            </Label>
            <Input
              value={form.locationName}
              onChange={(e) => setForm({ ...form, locationName: e.target.value })}
              required
              className={inp}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-700 font-semibold">Latitude</Label>
              <Input
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                required
                className={inp}
              />
            </div>
            <div>
              <Label className="text-slate-700 font-semibold">Longitude</Label>
              <Input
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                required
                className={inp}
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-700 font-semibold">Sana / vaqt</Label>
            <Input
              type="datetime-local"
              value={form.eventDateTimeLocal}
              onChange={(e) =>
                setForm({ ...form, eventDateTimeLocal: e.target.value })
              }
              required
              className={inp}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl
                         border border-slate-300 bg-slate-100
                         px-4 py-2.5 text-sm font-semibold text-slate-700
                         transition hover:bg-slate-200"
            >
              Bekor
            </button>

            {/* 🟡 Sariq — Saqlash */}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-xl
                         bg-gradient-to-r from-amber-500 to-yellow-400
                         px-4 py-2.5 text-sm font-semibold text-white shadow-md
                         transition hover:scale-[1.02] hover:from-amber-600 hover:to-yellow-500
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}