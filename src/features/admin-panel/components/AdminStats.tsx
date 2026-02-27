import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useMemo } from "react";

type Props = {
  pendingOrgsCount?: number | string | null;
  pendingEventsCount?: number | string | null;
  verifiedOrgsCount?: number | string | null;
  usersCount?: number | string | null;
  eventsCount?: number | string | null;

  // ✅ click actions
  onOpenPendingOrgs?: () => void;
  onOpenPendingEvents?: () => void;
  onOpenVerifiedOrgs?: () => void;
  onOpenUsers?: () => void;
  onOpenEvents?: () => void;
};

function toSafeNumber(v: unknown, fallback = 0): number {
  // number bo‘lsa
  if (typeof v === "number" && Number.isFinite(v)) return v;

  // string bo‘lsa
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  // null/undefined/obj bo‘lsa
  return fallback;
}

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  badge,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: any;
  hint?: string;
  badge?: string;
  onClick?: () => void;
}) {
  const clickable = typeof onClick === "function";

  const content = (
    <Card
      className={[
        "border-0 shadow-md rounded-2xl overflow-hidden",
        clickable ? "cursor-pointer hover:shadow-lg transition" : "",
      ].join(" ")}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-700">
              {title}
            </CardTitle>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {value}
            </div>
            {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
          </div>

          <div className="h-11 w-11 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-indigo-700" />
          </div>
        </div>

        {badge ? (
          <div className="mt-3">
            <Badge className="rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-100">
              {badge}
            </Badge>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 opacity-80" />
      </CardContent>
    </Card>
  );

  if (!clickable) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left"
      aria-label={`${title} ochish`}
    >
      {content}
    </button>
  );
}

export default function AdminStats(props: Props) {
  // ✅ PRODUCTION SAFE: hammasini numberga aylantiramiz
  const pendingOrgsCount = toSafeNumber(props.pendingOrgsCount);
  const pendingEventsCount = toSafeNumber(props.pendingEventsCount);
  const verifiedOrgsCount = toSafeNumber(props.verifiedOrgsCount);
  const usersCount = toSafeNumber(props.usersCount);
  const eventsCount = toSafeNumber(props.eventsCount);

  const {
    onOpenPendingOrgs,
    onOpenPendingEvents,
    onOpenVerifiedOrgs,
    onOpenUsers,
    onOpenEvents,
  } = props;

  // 1) Summary bar chart
  const barData = useMemo(
    () => [
      { name: "Pending Orgs", value: pendingOrgsCount },
      { name: "Pending Events", value: pendingEventsCount },
      { name: "Verified Orgs", value: verifiedOrgsCount },
      { name: "Users", value: usersCount },
      { name: "Events", value: eventsCount },
    ],
    [pendingOrgsCount, pendingEventsCount, verifiedOrgsCount, usersCount, eventsCount]
  );

  // 2) Donut: Pending vs Approved (approx)
  const approvedApprox = Math.max(eventsCount - pendingEventsCount, 0);

  const donutData = useMemo(
    () => [
      { name: "Pending", value: pendingEventsCount },
      { name: "Approved", value: approvedApprox },
    ],
    [pendingEventsCount, approvedApprox]
  );

  // 3) Line: demo
  const totalFlow =
    pendingOrgsCount +
    pendingEventsCount +
    verifiedOrgsCount +
    usersCount +
    eventsCount;

  const lineData = useMemo(
    () => [
      { name: "Dushanba", value: Math.max(0, Math.round(totalFlow * 0.55)) },
      { name: "Seshanba", value: Math.max(0, Math.round(totalFlow * 0.62)) },
      { name: "Chorshanba", value: Math.max(0, Math.round(totalFlow * 0.7)) },
      { name: "Payshanba", value: Math.max(0, Math.round(totalFlow * 0.78)) },
      { name: "Juma", value: Math.max(0, Math.round(totalFlow * 0.86)) },
      { name: "Shanba", value: Math.max(0, Math.round(totalFlow * 0.93)) },
      { name: "Yakshanba", value: Math.max(0, totalFlow) },
    ],
    [totalFlow]
  );

  const pieColors = ["#6366F1", "#22C55E"]; // indigo, green

  // ✅ UZOQKA XAVFSIZ: data array bo‘lmasa ham yiqilmasin
  const safeDonutData = Array.isArray(donutData) ? donutData : [];
  const safeBarData = Array.isArray(barData) ? barData : [];
  const safeLineData = Array.isArray(lineData) ? lineData : [];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Kutilayotgan tashkilotlar"
          value={pendingOrgsCount}
          icon={Clock3}
          hint="Tasdiqlash / rad etish"
          badge="Pending"
          onClick={onOpenPendingOrgs}
        />
        <StatCard
          title="Kutilayotgan eventlar"
          value={pendingEventsCount}
          icon={CalendarDays}
          hint="Admin tasdig‘ini kutmoqda"
          badge="Pending"
          onClick={onOpenPendingEvents}
        />
        <StatCard
          title="Tasdiqlangan tashkilotlar"
          value={verifiedOrgsCount}
          icon={Building2}
          hint="Aktiv tashkilotlar"
          badge="Verified"
          onClick={onOpenVerifiedOrgs}
        />
        <StatCard
          title="Foydalanuvchilar"
          value={usersCount}
          icon={Users}
          hint="Umumiy ro‘yxat"
          badge="Users"
          onClick={onOpenUsers}
        />
        <StatCard
          title="Eventlar"
          value={eventsCount}
          icon={CheckCircle2}
          hint="Umumiy eventlar"
          badge="Events"
          onClick={onOpenEvents}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-900">
              Umumiy statistikalar (Bar)
            </CardTitle>
            <div className="text-xs text-slate-500">
              Kutilayotgan / tasdiqlangan / umumiy
            </div>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeBarData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-900">
              Event holati (Donut)
            </CardTitle>
            <div className="text-xs text-slate-500">
              Pending vs Approved (taxminiy)
            </div>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeDonutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {safeDonutData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-900">
              Haftalik trend (Line)
            </CardTitle>
            <div className="text-xs text-slate-500">
              Demo trend (keyin real qilamiz)
            </div>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeLineData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}