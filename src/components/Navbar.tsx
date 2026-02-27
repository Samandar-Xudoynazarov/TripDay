import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { eventsSvc } from "@/lib/api";

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
} from "lucide-react";

import {
  addMonths,
  addDays,
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
  eventDateTime: string;
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
  return t.length > n ? t.slice(0, n).trim() + "…" : t;
}

/** MiniCalendar (IndexPage dagi kalendar) */
function MiniCalendar({ events }: { events: EventItem[] }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<"MONTH" | "WEEK">("MONTH");

  const WEEKDAYS = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];

  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);

  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart); // 0=Yakshanba
  const emptyCount = startDay === 0 ? 6 : startDay - 1;

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const d = new Date(e.eventDateTime);
      const key = format(d, "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(e);
      map.set(key, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => +new Date(a.eventDateTime) - +new Date(b.eventDateTime));
      map.set(k, arr);
    }
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    return eventsByDayKey.get(key) || [];
  }, [eventsByDayKey, selectedDate]);

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
        onClick={() => setSelectedDate(day)}
        className={[
          "relative min-h-[86px] p-2 rounded-xl border text-left text-xs transition",
          "hover:border-blue-200 hover:shadow-sm",
          isSelected ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white",
          isToday && !isSelected ? "ring-1 ring-blue-200" : "",
          !inMonth ? "opacity-60" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <span
            className={[
              "font-semibold",
              isToday ? "text-blue-700" : "text-slate-900",
            ].join(" ")}
          >
            {format(day, "d")}
          </span>

          {dayEvents.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-[10px] text-slate-600">{dayEvents.length}</span>
            </span>
          ) : null}
        </div>

        {dayEvents.slice(0, 2).map((ev) => (
          <div
            key={ev.id}
            className="mt-1 bg-blue-100 text-blue-800 rounded-lg px-2 py-1 truncate"
            title={ev.title}
          >
            {clampText(ev.title, 18)}
          </div>
        ))}

        {dayEvents.length > 2 ? (
          <div className="mt-1 text-[10px] text-slate-500">
            +{dayEvents.length - 2} ta
          </div>
        ) : null}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border border-slate-200 bg-white/95 shadow-sm lg:col-span-2 overflow-hidden">
        <CardHeader className="pb-3 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Kalendar
              </CardTitle>
              <p className="text-xs text-slate-600 mt-1">
                Kunni bosing — o‘sha kundagi tadbirlar o‘ng tomonda chiqadi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const t = new Date();
                  setCalMonth(t);
                  setSelectedDate(t);
                }}
                className="text-slate-900"
              >
                Bugun
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
                className="text-slate-900"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="min-w-[160px] text-center">
                <div className="text-sm font-semibold text-slate-900">
                  {mode === "MONTH"
                    ? format(calMonth, "MMMM yyyy")
                    : `${format(weekStart, "dd MMM")} — ${format(weekEnd, "dd MMM")}`}
                </div>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center justify-center gap-1 text-[11px] text-blue-700 hover:underline"
                  onClick={() => setMode((m) => (m === "MONTH" ? "WEEK" : "MONTH"))}
                >
                  {mode === "MONTH" ? "Haftalik ko‘rinish" : "Oylik ko‘rinish"}
                  <ChevronUp
                    className={[
                      "w-3 h-3 transition",
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
                className="text-slate-900"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="bg-white">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-slate-600"
              >
                {d}
              </div>
            ))}
          </div>

          {mode === "MONTH" ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: emptyCount }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthDays.map(renderDayCell)}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">{weekDays.map(renderDayCell)}</div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white/95 shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-lg text-slate-900">Eslatma</CardTitle>
          <p className="text-sm text-slate-600">{format(selectedDate, "dd MMMM yyyy")}</p>
        </CardHeader>

        <CardContent className="space-y-3 max-h-[560px] overflow-auto pr-1 bg-white">
          {selectedDayEvents.length === 0 ? (
            <div className="text-sm text-slate-600">Bu kunda tadbir yo‘q.</div>
          ) : (
            selectedDayEvents.map((ev) => {
              const vis = getEventVisibilityLabel(ev);
              return (
                <Link
                  to={`/events/${ev.id}`}
                  key={ev.id}
                  className="block rounded-2xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm transition"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{ev.title}</div>
                        <div className="mt-2 flex flex-col gap-1 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(ev.eventDateTime), "HH:mm")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {ev.locationName}
                          </span>
                        </div>
                      </div>

                      {vis ? (
                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                          {vis}
                        </Badge>
                      ) : null}
                    </div>

                    {ev.organizationName ? (
                      <div className="mt-3 text-[11px] text-slate-500">
                        {ev.organizationName}
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const nav = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    eventsSvc
      .getUpcoming()
      .then((r) => setEvents(Array.isArray(r) ? r : []))
      .catch(() => {});
  }, []);

  const adminPath = hasRole("SUPER_ADMIN") ? "/super-admin" : "/admin";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
     ${
       isActive
         ? "bg-blue-600 text-white"
         : "text-slate-900 hover:bg-blue-600 hover:text-white"
     }`;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(120,120,120,0.35)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <NavLink
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <img
            src="/4.png"
            alt="TripDay"
            style={{ height: 150, width: "auto", display: "block" }}
          />
        </NavLink>

        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NavLink to="/events" className={linkClass}>
            Tadbirlar
          </NavLink>

          {/* ✅ KALENDAR ICON -> MODAL */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="relative px-3 py-1.5 rounded-lg text-sm font-medium text-slate-900 hover:bg-blue-600 hover:text-white transition-all duration-200"
                aria-label="Kalendarni ochish"
              >
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                </span>

                {events.length > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                    {events.length > 99 ? "99+" : events.length}
                  </span>
                ) : null}
              </button>
            </DialogTrigger>

            {/* ✅ Kulrang fon + matnlar aniq ko‘rinsin */}
            <DialogContent className="max-w-6xl bg-slate-100 text-slate-900">
              <DialogHeader>
                <DialogTitle className="text-slate-900"></DialogTitle>
              </DialogHeader>
              <MiniCalendar events={events} />
            </DialogContent>
          </Dialog>

          {user ? (
            <>
              {(hasRole("ADMIN") || hasRole("SUPER_ADMIN")) && (
                <NavLink to={adminPath} className={linkClass}>
                  <LayoutDashboard size={14} className="mr-1 inline" />
                  {hasRole("SUPER_ADMIN") ? "Super Admin" : "Admin"}
                </NavLink>
              )}

              {hasRole("TOUR_ORGANIZATION") && (
                <NavLink to="/dashboard" className={linkClass}>
                  <Building2 size={14} className="mr-1 inline" />
                  Dashboard
                </NavLink>
              )}

              <NavLink to="/profile" className={linkClass}>
                <User size={14} className="mr-1 inline" />
                Profil
              </NavLink>

              <button
                onClick={() => {
                  logout();
                  nav("/");
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-900 hover:bg-blue-600 hover:text-white transition-all duration-200"
              >
                <LogOut size={14} className="mr-1 inline" />
                Chiqish
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
            >
              <LogIn size={14} className="mr-1 inline" />
              Kirish
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}