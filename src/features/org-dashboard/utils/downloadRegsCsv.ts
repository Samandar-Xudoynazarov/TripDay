import type { RegItem } from "../types";

function esc(v: unknown) {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadRegsCsv(eventTitle: string, regs: RegItem[]) {
  const header = ["Full Name", "Email", "Registered At"];
  const rows = regs.map((r) => [r.userFullName ?? "", r.userEmail ?? "", r.registeredAt ?? ""]);

  const csv = [header, ...rows].map((row) => row.map(esc).join(",")).join("\n") + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  const safe = (eventTitle || "registrations").replace(/[^a-z0-9\-_ ]/gi, "_");
  a.href = url;
  a.download = `${safe}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
