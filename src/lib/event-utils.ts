export type EventLike = {
  eventDateTime?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export function getEventDateValue(event?: EventLike | null): string {
  if (!event) return "";
  return String(event.startDate || event.eventDateTime || event.endDate || "");
}

export function getEventDate(event?: EventLike | null): Date | null {
  const value = getEventDateValue(event);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(+date) ? null : date;
}

export function sortByEventDate<T extends EventLike>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aDate = getEventDate(a);
    const bDate = getEventDate(b);
    return +(aDate || 0) - +(bDate || 0);
  });
}

export function isUpcomingEvent(event?: EventLike | null, now = Date.now()): boolean {
  const date = getEventDate(event);
  if (!date) return true;
  return +date >= now;
}

// ─── Deduplicate helper ───────────────────────────────────────────────────────
// Backend bir event uchun har kun alohida event yaratadi.
// Bu funksiya title+organizationId boyicha guruhlaydi va
// har guruhdan BIRINCHI (eng eski sanali) eventni qaytaradi.
// Guruh ichidagi barcha eventlar representative eventning _siblings fieldiga qoyiladi.

export type EventWithSiblings = {
  _siblings: any[];   // shu guruhning barcha eventlari (kun tanlash uchun)
  _dateRange: string; // "16 Mar - 20 Mar" yoki "16 Mar" (bir kun bolsa)
  [key: string]: any;
};

function fmtShort(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function deduplicateEvents(events: any[]): EventWithSiblings[] {
  const groups = new Map<string, any[]>();

  for (const ev of events) {
    const key = `${String(ev?.title || "").trim()}__${String(ev?.organizationId || ev?.organization?.id || "")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ev);
  }

  const result: EventWithSiblings[] = [];

  for (const [, siblings] of groups) {
    const sorted = sortByEventDate(siblings);
    const representative = { ...sorted[0] };

    const first = getEventDate(sorted[0]);
    const last  = getEventDate(sorted[sorted.length - 1]);

    let dateRange = "";
    if (first && last && sorted.length > 1) {
      dateRange = first.toDateString() === last.toDateString()
        ? fmtShort(first)
        : `${fmtShort(first)} — ${fmtShort(last)}`;
    } else if (first) {
      dateRange = fmtShort(first);
    }

    representative._siblings  = sorted;
    representative._dateRange = dateRange;

    result.push(representative as EventWithSiblings);
  }

  return result;
}
