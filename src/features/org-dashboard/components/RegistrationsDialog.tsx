import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function downloadCsv(filename: string, rows: Array<{ fullName: string; email: string }>) {
  const header = ["Full Name", "Email"];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      [r.fullName, r.email]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Props = {
  openFor: { id: number; title: string } | null;
  regs: Array<{ fullName: string; email: string }>;
  loading: boolean;
  onClose: () => void;
};

export default function RegistrationsDialog({ openFor, regs, loading, onClose }: Props) {
  const open = !!openFor;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Ro‘yxatdan o‘tganlar {openFor ? `— ${openFor.title}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {loading ? "Yuklanmoqda..." : `${regs.length} ta odam`}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={loading || regs.length === 0}
            onClick={() => downloadCsv(`event-${openFor?.id}-registrations.csv`, regs)}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV yuklab olish
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 text-xs font-semibold bg-gray-50 px-3 py-2">
            <div>Ism-familiya</div>
            <div>Email</div>
          </div>

          {loading ? (
            <div className="p-4 text-sm">Yuklanmoqda...</div>
          ) : regs.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Ro‘yxatdan o‘tganlar ro‘yxati topilmadi.
              <br />
              Agar backend `GET /api/registrations` ichida user fullname/email bermasa, event bo‘yicha list endpoint kerak bo‘ladi.
            </div>
          ) : (
            <div className="max-h-[360px] overflow-auto">
              {regs.map((r, idx) => (
                <div key={idx} className="grid grid-cols-2 px-3 py-2 text-sm border-t">
                  <div className="truncate">{r.fullName || "-"}</div>
                  <div className="truncate">{r.email || "-"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}