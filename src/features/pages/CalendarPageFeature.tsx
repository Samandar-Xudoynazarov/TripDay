import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SidebarLayout, { SidebarIcons } from '@/components/layout/SidebarLayout';
import { eventsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  subMonths,
} from 'date-fns';

type EventItem = {
  id: number;
  title: string;
  description: string;
  locationName: string;
  eventDateTime: string;
  organizationId?: number;
  organizationName?: string;
  status?: string;
  approved?: boolean;
  published?: boolean;
};

function toArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.data)) return data.data as T[];
  if (Array.isArray(data?.content)) return data.content as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  return [];
}

function getEventVisibilityLabel(ev: EventItem) {
  const status = String(ev.status || '').toUpperCase();
  if (status) return status;
  if (ev.approved === true) return 'APPROVED';
  if (ev.published === true) return 'PUBLISHED';
  return '';
}

export default function CalendarPage() {
  const { user, hasRole, isLoading } = useAuth();
  const navigate = useNavigate();

  const isAdmin = hasRole('ADMIN') || hasRole('SUPER_ADMIN');
  const isOrg = hasRole('TOUR_ORGANIZATION');
  const basePath = hasRole('SUPER_ADMIN') ? '/super-admin' : hasRole('ADMIN') ? '/admin' : '/dashboard';
  const title = hasRole('SUPER_ADMIN') ? 'Super Admin' : hasRole('ADMIN') ? 'Admin' : 'Dashboard';

  const sidebarItems = useMemo(() => {
    if (isAdmin) {
      return [
        { label: `${title} panel`, to: basePath, icon: SidebarIcons.Admin },
        { label: 'Hotel / Hostel', to: `${basePath}/accommodations`, icon: SidebarIcons.Accommodations },
        { label: 'Kalendar', to: `${basePath}/calendar`, icon: SidebarIcons.Calendar },
        { label: 'Tadbirlar', to: '/events', icon: SidebarIcons.Dashboard },
        { label: 'Bosh sahifa', to: '/', icon: SidebarIcons.Home },
      ];
    }
    return [
      { label: 'Dashboard', to: '/dashboard', icon: SidebarIcons.Dashboard },
      { label: 'Kalendar', to: '/dashboard/calendar', icon: SidebarIcons.Calendar },
      { label: 'Tadbirlar', to: '/events', icon: SidebarIcons.Home },
      { label: 'Bosh sahifa', to: '/', icon: SidebarIcons.Home },
    ];
  }, [isAdmin, title, basePath]);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdmin && !isOrg) {
      navigate('/');
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await eventsApi.getAll();
        const all = toArray<EventItem>(res.data);
        const filtered =
          isOrg && (user as any).organizationId
            ? all.filter((e) => e.organizationId === (user as any).organizationId)
            : all;
        setEvents(filtered.filter((e) => { const d = new Date(e.eventDateTime); return Number.isNaN(+d) ? true : +d >= Date.now(); }));
      } catch {
        toast.error("Kalendar ma'lumotlarini yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isAdmin, isOrg, navigate, isLoading]);

  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const WEEKDAYS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];

  const selectedDayEvents = useMemo(() => {
    return events
      .filter((e) => isSameDay(new Date(e.eventDateTime), selectedDate))
      .sort((a, b) => +new Date(a.eventDateTime) - +new Date(b.eventDateTime));
  }, [events, selectedDate]);

  if (loading) {
    return (
      <SidebarLayout title={title} items={sidebarItems}>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={title} items={sidebarItems}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top header */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Kalendar</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Kunni bosing — o&apos;sha kundagi tadbirlar “Eslatma”da chiqadi.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 shadow-sm">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-800">{format(new Date(), 'dd MMMM yyyy')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
            {/* Calendar */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              {/* Gradient header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600">
                <CardHeader className="text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                        <CalendarDays className="w-5 h-5" />
                      </span>
                      Oy ko&apos;rinishi
                    </CardTitle>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCalMonth(subMonths(calMonth, 1))}
                        className="text-white hover:bg-white/15"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <span className="text-sm font-semibold w-36 text-center">
                        {format(calMonth, 'MMMM yyyy')}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCalMonth(addMonths(calMonth, 1))}
                        className="text-white hover:bg-white/15"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-white/80">
                      Tanlangan kun: <span className="font-semibold text-white">{format(selectedDate, 'dd MMM')}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-xl bg-white/15 text-white hover:bg-white/20 border-0"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Bugun
                    </Button>
                  </div>
                </CardHeader>
              </div>

              <CardContent className="p-4 sm:p-5">
                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((d) => (
                    <div
                      key={d}
                      className="text-center text-[11px] font-semibold text-slate-400 py-1 tracking-wide"
                    >
                      {d}
                    </div>
                  ))}

                  {/* Empty leading cells */}
                  {Array.from({ length: startDay === 0 ? 6 : startDay - 1 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {/* Days */}
                  {days.map((day) => {
                    const dayEvents = events.filter((e) => isSameDay(new Date(e.eventDateTime), day));
                    const isToday = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                      <button
                        type="button"
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={[
                          'group relative min-h-[92px] rounded-2xl border p-2 text-left text-xs transition',
                          'focus:outline-none focus:ring-2 focus:ring-indigo-500/40',
                          isSelected
                            ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                            : isToday
                              ? 'border-violet-200 bg-violet-50/40'
                              : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={[
                              'inline-flex h-7 min-w-7 items-center justify-center rounded-xl px-2 font-semibold',
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : isToday
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-100',
                            ].join(' ')}
                          >
                            {format(day, 'd')}
                          </span>

                          {/* dot indicator */}
                          {dayEvents.length > 0 ? (
                            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-500/80" />
                          ) : (
                            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-transparent" />
                          )}
                        </div>

                        {/* Event chips */}
                        <div className="mt-2 space-y-1">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              className="rounded-xl bg-indigo-100/70 text-indigo-700 px-2 py-1 truncate text-[11px] font-medium"
                              title={ev.title}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 ? (
                            <div className="text-[11px] text-slate-400 font-medium">
                              +{dayEvents.length - 2} ta tadbir
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reminders */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <div className="bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg text-slate-900">Eslatma</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{format(selectedDate, 'dd MMMM yyyy')}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-xl">
                      {selectedDayEvents.length} ta
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {selectedDayEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-sm text-slate-500">
                      <div className="font-medium text-slate-700">Bu kunda tadbir yo&apos;q</div>
                      <div className="mt-1 text-xs">Boshqa kunni tanlab ko&apos;ring 🙂</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayEvents.map((ev) => {
                        const vis = getEventVisibilityLabel(ev);
                        const detailHref = `/events/${ev.id}`;
                        return (
                          <Link
                            to={detailHref}
                            key={ev.id}
                            className="group block rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm transition"
                          >
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                {/* timeline dot */}
                                <div className="mt-1 flex flex-col items-center">
                                  <span className="h-3 w-3 rounded-full bg-indigo-600/90" />
                                  <span className="mt-1 h-full w-px bg-slate-100" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="font-semibold text-slate-900 truncate group-hover:text-indigo-700">
                                        {ev.title}
                                      </div>
                                      <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5" />
                                          {format(new Date(ev.eventDateTime), 'HH:mm')}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                          <MapPin className="w-3.5 h-3.5" />
                                          {ev.locationName}
                                        </span>
                                      </div>
                                    </div>

                                    {vis ? (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] rounded-xl bg-slate-100 text-slate-700"
                                      >
                                        {vis}
                                      </Badge>
                                    ) : null}
                                  </div>

                                  {ev.organizationName ? (
                                    <div className="mt-3 text-[11px] text-slate-400">
                                      {ev.organizationName}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}