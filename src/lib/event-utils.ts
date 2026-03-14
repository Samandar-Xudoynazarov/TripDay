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
