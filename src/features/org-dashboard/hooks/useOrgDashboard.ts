import { useCallback, useEffect, useMemo, useState } from "react";
import { orgsApi, eventsApi, registrationsApi, likesApi, commentsApi } from "@/lib/api";

type Org = {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  verified?: boolean;
};

type EventItem = {
  id: number;
  title: string;
  description: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  eventDateTime: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  organizationId?: number;
};

type RegItem = {
  id: number;
  eventId?: number;
  event?: { id: number };
  user?: { fullName?: string; email?: string };
  fullName?: string;
  email?: string;
};

type Stats = Record<
  number,
  {
    likes: number;
    comments: number;
    registrations: number;
  }
>;

function pickEventId(e: any): number | undefined {
  const id = e?.id ?? e?.eventId ?? e?.event?.id;
  const n = Number(id);
  return Number.isFinite(n) ? n : undefined;
}

export function useOrgDashboard(userId?: number) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [org, setOrg] = useState<Org | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [stats, setStats] = useState<Stats>({});

  const [loading, setLoading] = useState(true);

  const [regsOpenFor, setRegsOpenFor] = useState<number | null>(null);
  const [regs, setRegs] = useState<RegItem[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);

  // ✅ Backend token bo‘yicha filtr qilsa, org tasdiqlangan bo‘lsa event yaratish mumkin
  const orgReadyForEvents = useMemo(() => {
    if (!org) return false;
    return org.verified === true; // verified yo‘q bo‘lsa ham true deb olamiz
  }, [org]);

  // ✅ 1) orglarni olish: faqat token bilan GET /organizations
  const loadOrgs = useCallback(async () => {
    const res = await orgsApi.getAll(); // ✅ interceptor token qo‘shadi
    const list = Array.isArray(res.data) ? (res.data as Org[]) : [];
    setOrgs(list);

    // ✅ ID/ownerId tekshirmaymiz — backend qaytargan 1-orgni olamiz
    setOrg(list[0] ?? null);

    return list;
  }, []);

  // ✅ 2) eventlarni olish: backendda /events/my bo‘lsa, shuni ishlatamiz
  const loadMyEvents = useCallback(async () => {
    const res = await eventsApi.getMy(); // ✅ token bilan
    const list = Array.isArray(res.data) ? (res.data as EventItem[]) : [];
    setEvents(list.filter((e) => { const d = new Date(e.eventDateTime); return Number.isNaN(+d) ? true : +d >= Date.now(); }));
    return list;
  }, []);

  // ✅ 3) statistikani yig‘ish (likes/comments/registrations)
  const loadStatsForEvents = useCallback(async (list: EventItem[]) => {
    const next: Stats = {};
    const tasks = (list || []).map(async (e) => {
      const eventId = pickEventId(e);
      if (!eventId) return;

      try {
        const [likesRes, commentsRes, regsRes] = await Promise.all([
          likesApi.count(eventId),
          commentsApi.getAll(eventId),
          registrationsApi.getCountByEvent(eventId),
        ]);

        const likesCount = Number(likesRes?.data ?? 0) || 0;
        const commentsCount = Array.isArray(commentsRes?.data) ? commentsRes.data.length : 0;
        const regsCount = Number(regsRes?.data ?? 0) || 0;

        next[eventId] = {
          likes: likesCount,
          comments: commentsCount,
          registrations: regsCount,
        };
      } catch {
        // stats yuklanmasa ham UI ishlayversin
        next[eventId] = next[eventId] ?? { likes: 0, comments: 0, registrations: 0 };
      }
    });

    await Promise.all(tasks);
    setStats(next);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await loadOrgs();
      const myEvents = await loadMyEvents();
      await loadStatsForEvents(myEvents);
    } finally {
      setLoading(false);
    }
  }, [loadOrgs, loadMyEvents, loadStatsForEvents]);

  useEffect(() => {
    // userId bo‘lsa ham, bo‘lmasa ham token orqali ishlaymiz
    reload();
  }, [reload, userId]);

  // ================= ACTIONS =================
  const createEvent = useCallback(
    async (payload: {
      title: string;
      description: string;
      locationName: string;
      latitude: number;
      longitude: number;
      eventDateTime: string;
      organizationId: number;
      files?: File[];
    }) => {
      await eventsApi.create(payload);
      await reload();
    },
    [reload],
  );

  const deleteEvent = useCallback(
    async (eventId: number) => {
      await eventsApi.delete(eventId);
      await reload();
    },
    [reload],
  );

  const openRegs = useCallback(async (eventId: number) => {
    setRegsOpenFor(eventId);
    setRegsLoading(true);
    try {
      // Backendda event bo‘yicha ro‘yxat endpoint yo‘q bo‘lishi mumkin.
      // Shuning uchun hozircha /registrations dan olib clientda filtrlaymiz.
      const res = await registrationsApi.getAll();
      const all = Array.isArray(res.data) ? (res.data as any[]) : [];
      const filtered = all.filter((r) => {
        const rid = Number(r?.eventId ?? r?.event?.id);
        return rid === Number(eventId);
      });
      setRegs(filtered as RegItem[]);
    } finally {
      setRegsLoading(false);
    }
  }, []);

  const closeRegs = useCallback(() => {
    setRegsOpenFor(null);
    setRegs([]);
  }, []);

  return {
    orgs,
    org,
    events,
    stats,
    regsOpenFor,
    regs,
    loading,
    regsLoading,
    orgReadyForEvents,
    actions: {
      reload,
      createEvent,
      deleteEvent,
      openRegs,
      closeRegs,
    },
  };
}