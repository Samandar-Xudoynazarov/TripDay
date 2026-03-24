import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { eventsSvc } from "@/lib/api";
import {
  getEventDate,
  getEventDateValue,
  isUpcomingEvent,
  sortByEventDate,
} from "@/lib/event-utils";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  CalendarDays,
  MapPin,
  Clock,
  LayoutDashboard,
  Building2,
  User,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Menu,
  X,
  Home,
} from "lucide-react";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

interface EventItem {
  id: number;
  title: string;
  description: string;
  locationName: string;
  eventDateTime?: string;
  startDate?: string;
  endDate?: string;
  organizationName?: string;
  status?: string;
  approved?: boolean;
  published?: boolean;
}

function getEventVisibilityLabel(ev: EventItem) {
  const status = String(ev.status || "").toUpperCase();
  if (status) return status;
  if (ev.approved === true) return "APPROVED";
  if (ev.published === true) return "PUBLISHED";
  return "";
}

function clampText(s: string, n: number) {
  const t = String(s || "");
  return t.length > n ? `${t.slice(0, n).trim()}…` : t;
}

function MiniCalendar({
  events,
  covers,
}: {
  events: EventItem[];
  covers: Record<number, string>;
}) {
  const { t } = useTranslation();
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<"MONTH" | "WEEK">("MONTH");

  const WEEKDAYS = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const emptyCount = startDay === 0 ? 6 : startDay - 1;

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const ORIGIN = import.meta.env.VITE_BACKEND_URL || "https://tripday.uz";
  const fileUrl = (p?: string | null) => {
    if (!p) return "";

    let value = String(p).trim();
    if (!value) return "";

    // full url bo‘lsa ham normalize qilamiz
    value = value.replace("/uploads/events/", "/uploads/");

    if (/^https?:\/\//i.test(value)) return value;

    const normalizedPath = value.startsWith("/") ? value : `/${value}`;
    return `${ORIGIN}${normalizedPath}`;
  };

  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const event of events) {
      const date = getEventDate(event);
      if (!date) continue;
      const key = format(date, "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(event);
      map.set(key, sortByEventDate(arr));
    }
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    return eventsByDayKey.get(key) || [];
  }, [eventsByDayKey, selectedDate]);

  // ── Mobile: selected day events panel show/hide
  const [showPanel, setShowPanel] = useState(false);

  const renderDayCell = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const dayEvents = eventsByDayKey.get(key) || [];
    const isToday = isSameDay(day, new Date());
    const isSelected = isSameDay(day, selectedDate);
    const inMonth = isSameMonth(day, calMonth);

    return (
      <button
        type="button"
        key={day.toISOString()}
        onClick={() => {
          setSelectedDate(day);
          setShowPanel(true);
        }}
        className={[
          // Desktop: taller cells with event pills
          // Mobile: compact square cells
          "relative rounded-xl border p-1 text-left text-xs transition",
          "cal-cell", // custom responsive class below
          "hover:border-blue-200 hover:shadow-sm",
          isSelected
            ? "border-blue-600 bg-blue-50"
            : "border-slate-200 bg-white",
          isToday && !isSelected ? "ring-1 ring-blue-200" : "",
          !inMonth ? "opacity-50" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <span
            className={[
              "font-semibold text-[11px] sm:text-xs",
              isToday ? "text-blue-700" : "text-slate-900",
            ].join(" ")}
          >
            {format(day, "d")}
          </span>
          {/* Mobile: just a dot; Desktop: count */}
          {dayEvents.length > 0 && (
            <>
              {/* dot — always visible */}
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 sm:hidden" />
              {/* count — desktop only */}
              <span className="hidden sm:inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span className="text-[10px] text-slate-500">
                  {dayEvents.length}
                </span>
              </span>
            </>
          )}
        </div>

        {/* Event pills — desktop only */}
        <div className="hidden sm:block">
          {dayEvents.slice(0, 2).map((ev) => (
            <div
              key={ev.id}
              className="mt-1 truncate rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-800"
              title={ev.title}
            >
              {clampText(ev.title, 14)}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="mt-0.5 text-[9px] text-slate-400">
              +{dayEvents.length - 2}
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      {/* ── Responsive styles ── */}
      <style>{`
        /* Desktop cell: taller */
        .cal-cell { min-height: 62px; }
        /* Mobile cell: compact square */
        @media (max-width: 640px) {
          .cal-cell { min-height: 38px; padding: 4px 3px; }
        }
        /* Dialog inner scroll on mobile */
        @media (max-width: 640px) {
          .cal-scroll { max-height: 60vh; overflow-y: auto; }
        }
      `}</style>

      {/* ── Layout: mobile = stacked, desktop = grid 3col ── */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-5">
        {/* ── Calendar card ── */}
        <Card className="overflow-hidden border border-slate-200 bg-white/95 shadow-sm lg:col-span-2">
          <CardHeader className="bg-white pb-2 pt-3 px-3 sm:px-5 sm:pb-3 sm:pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  {t("common.calendar")}
                </CardTitle>
                <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Kunni bosing — o'sha kundagi tadbirlar o'ng tomonda chiqadi.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setCalMonth(today);
                    setSelectedDate(today);
                    setShowPanel(false);
                  }}
                  className="text-slate-900 text-xs h-7 px-2"
                >
                  {t("common.today")}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    mode === "MONTH"
                      ? setCalMonth(subMonths(calMonth, 1))
                      : setSelectedDate(addDays(selectedDate, -7))
                  }
                  aria-label="Oldingi"
                  className="text-slate-900 h-7 w-7"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <div className="text-center min-w-[120px] sm:min-w-[150px]">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900">
                    {mode === "MONTH"
                      ? format(calMonth, "MMMM yyyy")
                      : `${format(weekStart, "dd MMM")} — ${format(weekEnd, "dd MMM")}`}
                  </div>
                  <button
                    type="button"
                    className="mt-0.5 inline-flex items-center justify-center gap-1 text-[10px] text-blue-700 hover:underline"
                    onClick={() =>
                      setMode((m) => (m === "MONTH" ? "WEEK" : "MONTH"))
                    }
                  >
                    {mode === "MONTH"
                      ? t("navbar.weekView")
                      : t("navbar.monthView")}
                    <ChevronUp
                      className={[
                        "h-3 w-3 transition",
                        mode === "MONTH" ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    mode === "MONTH"
                      ? setCalMonth(addMonths(calMonth, 1))
                      : setSelectedDate(addDays(selectedDate, 7))
                  }
                  aria-label="Keyingi"
                  className="text-slate-900 h-7 w-7"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="bg-white px-2 pb-3 sm:px-4 sm:pb-4">
            {/* Weekday headers */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] sm:text-xs font-semibold text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {mode === "MONTH" ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: emptyCount }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {monthDays.map(renderDayCell)}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map(renderDayCell)}
              </div>
            )}

            {/* Mobile: selected day events inline (below calendar) */}
            {showPanel && selectedDayEvents.length > 0 && (
              <div className="mt-3 sm:hidden">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {format(selectedDate, "dd MMMM")} —{" "}
                    {selectedDayEvents.length} ta tadbir
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPanel(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    ✕ yopish
                  </button>
                </div>
                <div className="cal-scroll flex flex-col gap-2">
                  {selectedDayEvents.map((ev) => {
                    const eventDate = getEventDate(ev);
                    const cover = covers[ev.id];
                    return (
                      <Link
                        to={`/events/${ev.id}`}
                        key={ev.id}
                        className="flex gap-2 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-blue-200"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
                          {cover ? (
                            <img
                              src={fileUrl(cover)}
                              alt={ev.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-blue-100 to-sky-100" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-slate-900">
                            {ev.title}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {eventDate ? format(eventDate, "HH:mm") : "—"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {ev.locationName}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Right panel: desktop only ── */}
        <Card className="hidden border border-slate-200 bg-white/95 shadow-sm lg:block">
          <CardHeader className="bg-white pb-2 pt-4 px-5">
            <CardTitle className="text-base text-slate-900">
              {t("navbar.reminder")}
            </CardTitle>
            <p className="text-xs text-slate-500">
              {format(selectedDate, "dd MMMM yyyy")}
            </p>
          </CardHeader>
          <CardContent className="max-h-[500px] space-y-2.5 overflow-auto bg-white px-4 pb-4 pr-1">
            {selectedDayEvents.length === 0 ? (
              <div className="text-sm text-slate-500">
                {t("navbar.noEventsOnDay")}
              </div>
            ) : (
              selectedDayEvents.map((ev) => {
                const visibility = getEventVisibilityLabel(ev);
                const eventDate = getEventDate(ev);
                const cover = covers[ev.id];
                return (
                  <Link
                    to={`/events/${ev.id}`}
                    key={ev.id}
                    className="block rounded-xl border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex gap-3 p-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {cover ? (
                          <img
                            src={fileUrl(cover)}
                            alt={ev.title}
                            className="block h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-blue-100 to-sky-100" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {ev.title}
                            </div>
                            <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {eventDate ? format(eventDate, "HH:mm") : "—"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {ev.locationName}
                              </span>
                            </div>
                          </div>
                          {visibility ? (
                            <Badge
                              variant="secondary"
                              className="whitespace-nowrap text-[10px]"
                            >
                              {visibility}
                            </Badge>
                          ) : null}
                        </div>
                        {ev.organizationName ? (
                          <div className="mt-2 text-[11px] text-slate-400">
                            {ev.organizationName}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const ORIGIN = import.meta.env.VITE_BACKEND_URL || "https://tripday.uz";
  const API_PREFIX = import.meta.env.VITE_API_BASE_URL || "/api";
  const apiUrl = (path: string) =>
    `${ORIGIN}${API_PREFIX}${path.startsWith("/") ? "" : "/"}${path}`;
  const fileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const [events, setEvents] = useState<EventItem[]>([]);
  const [covers, setCovers] = useState<Record<number, string>>({});

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await eventsSvc.getAll();
        const list = Array.isArray(response) ? response : [];
        const upcoming = sortByEventDate(
          list.filter((event) => isUpcomingEvent(event)),
        ).slice(0, 120);
        if (!alive) return;
        setEvents(upcoming);

        const results = await Promise.all(
          upcoming.map(async (event) => {
            const id = Number(event?.id);
            if (!id) return [id, ""] as const;
            try {
              const res = await fetch(apiUrl(`/events/${id}/images`));
              const imgs = res.ok ? await res.json() : [];
              const first =
                Array.isArray(imgs) && imgs.length ? String(imgs[0]) : "";
              return [id, first ? fileUrl(first) : ""] as const;
            } catch {
              return [id, ""] as const;
            }
          }),
        );

        if (!alive) return;
        const map: Record<number, string> = {};
        for (const [id, cover] of results) if (id && cover) map[id] = cover;
        setCovers(map);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  const adminPath = hasRole("SUPER_ADMIN") ? "/super-admin" : "/admin";
  const close = () => setMobileOpen(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200",
      isActive
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
      isActive ? "bg-blue-600 text-white" : "text-slate-800 hover:bg-blue-50",
    ].join(" ");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-decoration-none">
            <img
              src="/png.png"
              alt="TripDay"
              className="h-12 w-auto rounded-xl object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/" className={navLinkClass}>
              <span className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t("common.home")}
              </span>
            </NavLink>
            <NavLink to="/events" className={navLinkClass}>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {t("common.events")}
              </span>
            </NavLink>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="relative rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={t("navbar.openCalendar")}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {t("common.calendar")}
                  </span>
                  {events.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] text-white">
                      {events.length > 99 ? "99+" : events.length}
                    </span>
                  )}
                </button>
              </DialogTrigger>
              {/* Desktop: wider dialog */}
              <DialogContent className="w-[95vw] max-w-4xl bg-slate-100 text-slate-900">
                <DialogHeader>
                  <DialogTitle>{t("common.calendar")}</DialogTitle>
                </DialogHeader>
                <MiniCalendar events={events} covers={covers} />
              </DialogContent>
            </Dialog>

            <LanguageSwitcher compact />

            {user ? (
              <>
                {(hasRole("ADMIN") || hasRole("SUPER_ADMIN")) && (
                  <NavLink to={adminPath} className={navLinkClass}>
                    <span className="inline-flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      {hasRole("SUPER_ADMIN")
                        ? t("common.superAdmin")
                        : t("common.admin")}
                    </span>
                  </NavLink>
                )}
                {hasRole("TOUR_ORGANIZATION") && (
                  <NavLink to="/dashboard" className={navLinkClass}>
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {t("common.dashboard")}
                    </span>
                  </NavLink>
                )}
                <NavLink to="/profile" className={navLinkClass}>
                  <span className="inline-flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("common.profile")}
                  </span>
                </NavLink>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    {t("common.logout")}
                  </span>
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <span className="inline-flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {t("common.login")}
                </span>
              </NavLink>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t("common.menu")}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={[
          "fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="mb-5 flex items-center justify-between">
          <img
            src="/png.png"
            alt="TripDay"
            className="h-11 w-auto rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={close}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <LanguageSwitcher className="w-full justify-between" />
        </div>

        <div className="flex flex-col gap-1">
          <NavLink to="/" onClick={close} className={mobileLinkClass}>
            <Home className="h-5 w-5" />
            {t("common.home")}
          </NavLink>
          <NavLink to="/events" onClick={close} className={mobileLinkClass}>
            <CalendarDays className="h-5 w-5" />
            {t("common.events")}
          </NavLink>

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-blue-50"
              >
                <CalendarDays className="h-5 w-5" />
                <span>{t("common.calendar")}</span>
                {events.length > 0 && (
                  <span className="ml-auto flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] text-white">
                    {events.length > 99 ? "99+" : events.length}
                  </span>
                )}
              </button>
            </DialogTrigger>
            {/* Mobile: full-width dialog, scrollable */}
            <DialogContent className="w-[calc(100vw-16px)] max-w-full bg-slate-100 text-slate-900 overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>{t("common.calendar")}</DialogTitle>
              </DialogHeader>
              <MiniCalendar events={events} covers={covers} />
            </DialogContent>
          </Dialog>

          {user ? (
            <>
              {(hasRole("ADMIN") || hasRole("SUPER_ADMIN")) && (
                <NavLink
                  to={adminPath}
                  onClick={close}
                  className={mobileLinkClass}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  {hasRole("SUPER_ADMIN")
                    ? t("common.superAdmin")
                    : t("common.admin")}
                </NavLink>
              )}
              {hasRole("TOUR_ORGANIZATION") && (
                <NavLink
                  to="/dashboard"
                  onClick={close}
                  className={mobileLinkClass}
                >
                  <Building2 className="h-5 w-5" />
                  {t("common.dashboard")}
                </NavLink>
              )}
              <NavLink
                to="/profile"
                onClick={close}
                className={mobileLinkClass}
              >
                <User className="h-5 w-5" />
                {t("common.profile")}
              </NavLink>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                  close();
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                {t("common.logout")}
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              onClick={close}
              className="mt-2 flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <LogIn className="h-5 w-5" />
              {t("common.login")}
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
