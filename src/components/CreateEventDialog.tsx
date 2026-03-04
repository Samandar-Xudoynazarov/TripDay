import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import {
  Plus,
  Upload,
  CalendarDays,
  Link as LinkIcon,
  MapPin,
} from "lucide-react";
import { parseLatLngFromLink } from "@/lib/geo";

/**
 * datetime-local => "YYYY-MM-DDTHH:mm" (yoki ba'zida sekund bilan)
 * Backend kutyapti => "YYYY-MM-DDTHH:mm:ss"
 */
function normalizeToIsoNoTZ(dtLocal: string) {
  const v = (dtLocal || "").trim();
  if (!v) return "";

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return `${v}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)) return v;

  return "";
}

/**
 * String qiymatni floatga aylantiradi.
 * - bo‘sh bo‘lsa => null
 * - "39,65" bo‘lsa => 39.65
 * - "undefined", "NaN" va boshqa noto‘g‘ri bo‘lsa => null
 */
function toFloatOrNull(v: string) {
  const s = (v ?? "").trim();
  if (!s) return null;
  if (s === "undefined" || s === "null" || s === "NaN") return null;

  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

type CreateEventPayload = {
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  eventDateTime: string; 
  organizationId: number;
  files: File[];
};

export default function CreateEventDialog({
  disabled,
  organizationId,
  onCreate,
}: {
  disabled: boolean;
  organizationId: number;
  onCreate: (payload: CreateEventPayload) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    locationName: "",
    locationLink: "",
    latitude: "",
    longitude: "",
    eventDateTimeLocal: "",
  });

  const eventDateTimeIso = useMemo(
    () => normalizeToIsoNoTZ(form.eventDateTimeLocal),
    [form.eventDateTimeLocal],
  );

  const latPreview = useMemo(() => toFloatOrNull(form.latitude), [form.latitude]);
  const lngPreview = useMemo(() => toFloatOrNull(form.longitude), [form.longitude]);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.locationName.trim().length > 0 &&
      latPreview !== null &&
      lngPreview !== null &&
      eventDateTimeIso.trim().length > 0 &&
      organizationId > 0 &&
      files.length >= 1 &&
      !disabled
    );
  }, [
    form.title,
    form.description,
    form.locationName,
    latPreview,
    lngPreview,
    eventDateTimeIso,
    organizationId,
    files.length,
    disabled,
  ]);

  const reset = () => {
    setForm({
      title: "",
      description: "",
      locationName: "",
      locationLink: "",
      latitude: "",
      longitude: "",
      eventDateTimeLocal: "",
    });
    setFiles([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled) {
      toast.error("Tashkilot tasdiqlanmagan. Tadbir yaratib bo‘lmaydi.");
      return;
    }
    if (files.length < 1) {
      toast.error("Kamida 1 ta rasm yuklang");
      return;
    }
    if (!eventDateTimeIso) {
      toast.error("Sana/vaqtni kalendardan tanlang");
      return;
    }

    const lat = toFloatOrNull(form.latitude);
    const lng = toFloatOrNull(form.longitude);

    if (lat === null || lng === null) {
      toast.error("Latitude/Longitude noto‘g‘ri (raqam bo‘lishi kerak)");
      return;
    }

    // ixtiyoriy: range check
    if (lat < -90 || lat > 90) {
      toast.error("Latitude -90 va 90 oralig‘ida bo‘lishi kerak");
      return;
    }
    if (lng < -180 || lng > 180) {
      toast.error("Longitude -180 va 180 oralig‘ida bo‘lishi kerak");
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        title: form.title.trim(),
        description: form.description.trim(),
        locationName: form.locationName.trim(),
        latitude: lat,
        longitude: lng,
        eventDateTime: eventDateTimeIso,
        organizationId,
        files,
      });

      toast.success("Tadbir yaratildi ✅");
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  // Reusable input styles (ko‘k theme)
  const inp =
    "mt-1 bg-white/10 border-white/20 text-white placeholder:text-sky-200/60 " +
    "focus-visible:ring-blue-300 focus-visible:ring-offset-0";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          disabled={organizationId <= 0}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Tadbir yaratish
        </Button>
      </DialogTrigger>

      <DialogContent
        className="w-[calc(100vw-24px)] sm:max-w-xl max-h-[85vh] overflow-y-auto
                   rounded-2xl border border-white/10
                   bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600
                   text-sky-50 shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-sky-50">Yangi tadbir</DialogTitle>
          {disabled ? (
            <div className="text-xs text-amber-200/90 mt-1">
              Tashkilot tasdiqlanmagan — tadbir yaratib bo‘lmaydi.
            </div>
          ) : null}
        </DialogHeader>

        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
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
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
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
                  onChange={(e) =>
                    setForm({ ...form, locationName: e.target.value })
                  }
                  required
                  className={inp}
                />
              </div>

              <div>
                <Label className="text-sky-100 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Joylashuv linki (Google/Yandex)
                </Label>
                <Input
                  placeholder="Masalan: https://www.google.com/maps/@39.6542,66.9597,16z"
                  value={form.locationLink}
                  onChange={(e) => {
                    const v = e.target.value;
                    const parsed = parseLatLngFromLink(v);

                    // MUHIM: parsed.lat/lng undefined bo‘lsa set qilmaymiz!
                    if (
                      parsed &&
                      Number.isFinite(parsed.lat) &&
                      Number.isFinite(parsed.lng)
                    ) {
                      setForm((prev) => ({
                        ...prev,
                        locationLink: v,
                        latitude: String(parsed.lat),
                        longitude: String(parsed.lng),
                      }));
                    } else {
                      setForm((prev) => ({ ...prev, locationLink: v }));
                    }
                  }}
                  className={inp}
                />
                <div className="mt-1 text-xs text-sky-100/70">
                  Linkni paste qilsangiz latitude/longitude avtomatik to‘ladi.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sky-100">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={form.latitude}
                    onChange={(e) =>
                      setForm({ ...form, latitude: e.target.value })
                    }
                    required
                    className={inp}
                  />
                  {form.latitude.trim().length > 0 && latPreview === null ? (
                    <div className="mt-1 text-xs text-amber-200/90">
                      Latitude raqam bo‘lishi kerak
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label className="text-sky-100">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={form.longitude}
                    onChange={(e) =>
                      setForm({ ...form, longitude: e.target.value })
                    }
                    required
                    className={inp}
                  />
                  {form.longitude.trim().length > 0 && lngPreview === null ? (
                    <div className="mt-1 text-xs text-amber-200/90">
                      Longitude raqam bo‘lishi kerak
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <Label className="text-sky-100 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Sana va vaqt
                </Label>
                <Input
                  type="datetime-local"
                  value={form.eventDateTimeLocal}
                  onChange={(e) =>
                    setForm({ ...form, eventDateTimeLocal: e.target.value })
                  }
                  required
                  className={inp}
                />
                <div className="mt-1 text-xs text-sky-100/70">
                  Backendga yuboriladi:{" "}
                  <span className="font-mono text-sky-50">
                    {eventDateTimeIso || "—"}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sky-100 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Rasmlar
                </Label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className={
                    "mt-1 bg-white/10 border-white/20 text-white " +
                    "file:bg-white/10 file:text-white file:border-0 " +
                    "focus-visible:ring-blue-300 focus-visible:ring-offset-0"
                  }
                />
                <div className="mt-1 text-xs text-sky-100/70">
                  Kamida 1 ta rasm yuklang.
                </div>

                {files.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.slice(0, 6).map((f) => (
                      <span
                        key={f.name + f.size}
                        className="inline-flex items-center rounded-full
                                   bg-white/10 border border-white/20
                                   px-2 py-0.5 text-[11px] text-sky-50"
                        title={f.name}
                      >
                        {f.name.length > 22 ? f.name.slice(0, 22) + "…" : f.name}
                      </span>
                    ))}
                    {files.length > 6 ? (
                      <span className="text-xs text-sky-100/70">
                        +{files.length - 6} ta
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full rounded-xl bg-black/30 text-white border border-white/15
                           hover:bg-black/45 transition"
              >
                {submitting ? "Yuborilmoqda..." : "Yaratish"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}