import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Users } from "lucide-react";

type RegItem = {
  id: number;
  createdAt?: string;
  eventId?: number;
  event?: { id: number; title?: string };
  user?: { fullName?: string; email?: string; phone?: string };
  fullName?: string;
  email?: string;
  phone?: string;
};

function pick(v: any) {
  return String(v ?? "").trim();
}

function downloadCsv(filename: string, rows: Record<string, string>[]) {
  const cols = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );

  const escape = (x: string) => {
    const v = String(x ?? "");
    if (/[",\n]/.test(v)) return `"${v.replaceAll('"', '""')}"`;
    return v;
  };

  const header = cols.map(escape).join(",");
  const body = rows
    .map((r) => cols.map((c) => escape(r[c] ?? "")).join(","))
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function RegistrationsDialog({
  eventId,
  eventTitle,
  triggerVariant,
  load,
}: {
  eventId: number;
  eventTitle?: string;
  triggerVariant?: "icon" | "button";
  load: (eventId: number) => Promise<RegItem[]>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regs, setRegs] = useState<RegItem[]>([]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const list = await load(eventId);
        if (!alive) return;
        setRegs(Array.isArray(list) ? list : []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, eventId, load]);

  const rows = useMemo(() => {
    return (regs || []).map((r, i) => {
      const fullName = pick(r?.user?.fullName || r?.fullName);
      const email = pick(r?.user?.email || r?.email);
      const phone = pick(r?.user?.phone || r?.phone);
      const createdAt = pick(r?.createdAt);
      return {
        "#": String(i + 1),
        "Full name": fullName,
        Email: email,
        Phone: phone,
        "Registered at": createdAt,
      };
    });
  }, [regs]);

  const doDownload = () => {
    const name = (eventTitle || `event-${eventId}`)
      .replaceAll(/[^a-zA-Z0-9_-]+/g, "-")
      .slice(0, 60);
    downloadCsv(`${name}-registrations.csv`, rows);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === "icon" ? (
          <Button
            variant="secondary"
            className="px-2 bg-white/10 text-white hover:bg-white/20 border border-white/20"
            title="Ro‘yxatdan o‘tganlar"
          >
            <Users className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/20"
          >
            <Users className="w-4 h-4" /> Ro‘yxatdan o‘tganlar
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Ro‘yxatdan o‘tganlar ({regs.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-muted-foreground truncate">
            {eventTitle ? eventTitle : `Event #${eventId}`}
          </div>
          <Button
            onClick={doDownload}
            disabled={rows.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" /> Yuklab olish (CSV)
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[55vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  <th className="text-left p-2 w-12">#</th>
                  <th className="text-left p-2">Full name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Registered at</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4" colSpan={5}>
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="p-4" colSpan={5}>
                      Hali ro‘yxatdan o‘tganlar yo‘q
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r["#"]} className="border-b last:border-b-0">
                      <td className="p-2">{r["#"]}</td>
                      <td className="p-2">{r["Full name"]}</td>
                      <td className="p-2">{r["Email"]}</td>
                      <td className="p-2">{r["Phone"]}</td>
                      <td className="p-2">{r["Registered at"]}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
