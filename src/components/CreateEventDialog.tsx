import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Plus, Upload, CalendarDays, Link as LinkIcon, MapPin } from "lucide-react";
import { parseLatLngFromLink } from "@/lib/geo";

function normalizeToIsoNoTZ(dtLocal: string) {
  const value = (dtLocal || "").trim();
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return value;
  return "";
}

function toFloatOrNull(value: string) {
  const source = (value ?? "").trim();
  if (!source || ["undefined", "null", "NaN"].includes(source)) return null;
  const parsed = Number(source.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

type CreateEventPayload = {
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
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
  const { t } = useTranslation();
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
    startDateLocal: "",
    endDateLocal: "",
  });

  const startDateIso = useMemo(() => normalizeToIsoNoTZ(form.startDateLocal), [form.startDateLocal]);
  const endDateIso = useMemo(() => normalizeToIsoNoTZ(form.endDateLocal), [form.endDateLocal]);
  const latPreview = useMemo(() => toFloatOrNull(form.latitude), [form.latitude]);
  const lngPreview = useMemo(() => toFloatOrNull(form.longitude), [form.longitude]);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.locationName.trim().length > 0 &&
      latPreview !== null &&
      lngPreview !== null &&
      startDateIso.length > 0 &&
      endDateIso.length > 0 &&
      new Date(endDateIso) >= new Date(startDateIso) &&
      organizationId > 0 &&
      files.length >= 1 &&
      !disabled
    );
  }, [form, latPreview, lngPreview, startDateIso, endDateIso, organizationId, files.length, disabled]);

  const reset = () => {
    setForm({
      title: "",
      description: "",
      locationName: "",
      locationLink: "",
      latitude: "",
      longitude: "",
      startDateLocal: "",
      endDateLocal: "",
    });
    setFiles([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled) return toast.error(t("createEvent.createdDisabled"));
    if (files.length < 1) return toast.error(t("createEvent.requiredImage"));
    if (!startDateIso || !endDateIso) return toast.error(t("createEvent.chooseDate"));

    const lat = toFloatOrNull(form.latitude);
    const lng = toFloatOrNull(form.longitude);
    if (lat === null || lng === null) return toast.error(t("createEvent.latError"));
    if (lat < -90 || lat > 90) return toast.error(t("createEvent.latRange"));
    if (lng < -180 || lng > 180) return toast.error(t("createEvent.lngRange"));
    if (+new Date(endDateIso) < +new Date(startDateIso)) return toast.error(t("createEvent.endBeforeStart"));

    setSubmitting(true);
    try {
      await onCreate({
        title: form.title.trim(),
        description: form.description.trim(),
        locationName: form.locationName.trim(),
        latitude: lat,
        longitude: lng,
        startDate: startDateIso,
        endDate: endDateIso,
        organizationId,
        files,
      });
      toast.success(t("createEvent.success"));
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.message || t("createEvent.fail"));
    } finally {
      setSubmitting(false);
    }
  };

  const inp = "mt-1 bg-white/10 border-white/20 text-white placeholder:text-sky-200/60 focus-visible:ring-blue-300 focus-visible:ring-offset-0";

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
      <DialogTrigger asChild>
        <Button disabled={organizationId <= 0} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          {t("createEvent.button")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] w-[calc(100vw-24px)] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-sky-50 shadow-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sky-50">{t("createEvent.title")}</DialogTitle>
          {disabled ? <div className="mt-1 text-xs text-amber-200/90">{t("createEvent.orgNotVerified")}</div> : null}
        </DialogHeader>

        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="text-sky-100">{t("createEvent.titleLabel")}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inp} />
              </div>

              <div>
                <Label className="text-sky-100">{t("createEvent.descriptionLabel")}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className={inp} />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-sky-100"><MapPin className="h-4 w-4" />{t("createEvent.locationNameLabel")}</Label>
                <Input value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} required className={inp} />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-sky-100"><LinkIcon className="h-4 w-4" />{t("createEvent.mapLinkLabel")}</Label>
                <Input
                  value={form.locationLink}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = parseLatLngFromLink(value);
                    setForm({
                      ...form,
                      locationLink: value,
                      latitude: parsed ? String(parsed.lat) : form.latitude,
                      longitude: parsed ? String(parsed.lng) : form.longitude,
                    });
                  }}
                  className={inp}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sky-100">{t("createEvent.latitudeLabel")}</Label>
                  <Input type="number" step="any" inputMode="decimal" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required className={inp} />
                </div>
                <div>
                  <Label className="text-sky-100">{t("createEvent.longitudeLabel")}</Label>
                  <Input type="number" step="any" inputMode="decimal" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required className={inp} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="flex items-center gap-2 text-sky-100"><CalendarDays className="h-4 w-4" />{t("createEvent.startDateLabel")}</Label>
                  <Input type="datetime-local" value={form.startDateLocal} onChange={(e) => setForm({ ...form, startDateLocal: e.target.value })} required className={inp} />
                  <div className="mt-1 text-xs text-sky-100/70">{t("createEvent.backendSend")} <span className="font-mono text-sky-50">{startDateIso || "—"}</span></div>
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-sky-100"><CalendarDays className="h-4 w-4" />{t("createEvent.endDateLabel")}</Label>
                  <Input type="datetime-local" value={form.endDateLocal} onChange={(e) => setForm({ ...form, endDateLocal: e.target.value })} required className={inp} />
                  <div className="mt-1 text-xs text-sky-100/70">{t("createEvent.backendSend")} <span className="font-mono text-sky-50">{endDateIso || "—"}</span></div>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 text-sky-100"><Upload className="h-4 w-4" />{t("createEvent.imagesLabel")}</Label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="mt-1 border-white/20 bg-white/10 text-white file:border-0 file:bg-white/10 file:text-white focus-visible:ring-blue-300 focus-visible:ring-offset-0"
                />
                <div className="mt-1 text-xs text-sky-100/70">{t("createEvent.imagesHint")}</div>
                {files.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.slice(0, 6).map((file) => (
                      <span key={file.name + file.size} className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] text-sky-50" title={file.name}>
                        {file.name.length > 22 ? `${file.name.slice(0, 22)}…` : file.name}
                      </span>
                    ))}
                    {files.length > 6 ? <span className="text-xs text-sky-100/70">+{files.length - 6} ta</span> : null}
                  </div>
                ) : null}
              </div>

              <Button type="submit" disabled={!canSubmit || submitting} className="w-full rounded-xl border border-white/15 bg-black/30 text-white transition hover:bg-black/45">
                {submitting ? t("createEvent.submitting") : t("createEvent.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
