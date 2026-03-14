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
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;    return v;
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
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .slice(0, 60);
    downloadCsv(`${name}-registrations.csv`, rows);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === "icon" ? (
          /* 🔵 Ko'k — icon */
          <button
            title="Ro'yxatdan o'tganlar"
            className="inline-flex items-center justify-center rounded-xl
                       bg-gradient-to-r from-blue-600 to-sky-500
                       px-3 py-2 text-sm font-semibold text-white shadow-md
                       transition hover:scale-[1.02] hover:from-blue-700 hover:to-sky-600"
          >
            <Users className="w-4 h-4" />
          </button>
        ) : (
          /* 🔵 Ko'k — button */
          <button
            className="inline-flex items-center gap-2 rounded-xl
                       bg-gradient-to-r from-blue-600 to-sky-500
                       px-4 py-2.5 text-sm font-semibold text-white shadow-md
                       transition hover:scale-[1.02] hover:from-blue-700 hover:to-sky-600"
          >
            <Users className="w-4 h-4" />
            Ro'yxatdan o'tganlar
          </button>
        )}
      </DialogTrigger>

      {/* ✅ Oq fon modal */}
      <DialogContent className="max-w-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-bold text-lg">
            Ro'yxatdan o'tganlar ({regs.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-slate-500 truncate">
            {eventTitle ? eventTitle : `Event #${eventId}`}
          </div>

          {/* 🔵 Ko'k — CSV yuklab olish */}
          <button
            onClick={doDownload}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-xl
                       bg-gradient-to-r from-blue-600 to-sky-500
                       px-4 py-2 text-sm font-semibold text-white shadow-md
                       transition hover:scale-[1.02] hover:from-blue-700 hover:to-sky-600
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Download className="w-4 h-4" />
            Yuklab olish (CSV)
          </button>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="max-h-[55vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-3 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Full name</th>
                  <th className="text-left px-3 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-3 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-3 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Registered at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-400" colSpan={5}>
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-400" colSpan={5}>
                      Hali ro'yxatdan o'tganlar yo'q
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r["#"]} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 text-slate-400 text-xs">{r["#"]}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{r["Full name"]}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r["Email"]}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r["Phone"]}</td>
                      <td className="px-3 py-2.5 text-slate-500 text-xs">{r["Registered at"]}</td>
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