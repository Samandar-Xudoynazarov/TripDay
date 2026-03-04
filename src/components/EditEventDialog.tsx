import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  // ISO like 2026-03-04T10:30:00 -> datetime-local expects yyyy-MM-ddTHH:mm
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

  // re-sync when opening (helps when list reloads)
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

  const inp =
    "mt-1 bg-white/10 border-white/20 text-white placeholder:text-sky-200/60 " +
    "focus-visible:ring-blue-300 focus-visible:ring-offset-0";

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
          <Button
            variant="secondary"
            disabled={!!disabled}
            className="px-2 bg-white/10 text-white hover:bg-white/20 border border-white/20"
            title="Tahrirlash"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={!!disabled}
            className="gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/20"
            title="Tahrirlash"
          >
            <Pencil className="w-4 h-4" />
            Tahrirlash
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="w-[calc(100vw-24px)] sm:max-w-xl max-h-[85vh] overflow-y-auto
                   rounded-2xl border border-white/10
                   bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600
                   text-sky-50 shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-sky-50">Tadbirni tahrirlash</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-sky-100">Sarlavha</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className={inp}
            />
          </div>

          <div>
            <Label className="text-sky-100">Tavsif</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              className={inp}
            />
          </div>

          <div>
            <Label className="text-sky-100 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Joy nomi
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
              <Label className="text-sky-100">Latitude</Label>
              <Input
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                required
                className={inp}
              />
            </div>
            <div>
              <Label className="text-sky-100">Longitude</Label>
              <Input
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                required
                className={inp}
              />
            </div>
          </div>

          <div>
            <Label className="text-sky-100">Sana / vaqt</Label>
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
            <Button
              type="submit"
              disabled={!canSubmit || submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
