import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Building2, CalendarDays, Hotel } from "lucide-react";
import type { EventItem, OrgData } from "../helpers";

type Props = {
  basePath: string;
  pendingOrgs: OrgData[];
  pendingEvents: EventItem[];
  onGoTab: (tab: string) => void;
  onApproveOrg: (orgId: number) => void;
  onOpenRejectOrg: (orgId: number) => void;
  onApproveEvent: (eventId: number) => void;
  onOpenRejectEvent: (eventId: number) => void;
};

export default function PendingDashboardTab({
  basePath,
  pendingOrgs,
  pendingEvents,
  onGoTab,
  onApproveOrg,
  onOpenRejectOrg,
  onApproveEvent,
  onOpenRejectEvent,
}: Props) {
  const orgsPreview = pendingOrgs.slice(0, 6);
  const eventsPreview = pendingEvents.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Tashkilotlar</div>
                  <div className="text-xs text-gray-500">
                    Kutilayotgan: <span className="font-medium">{pendingOrgs.length}</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => onGoTab("orgs")}>Ko‘rish</Button>
            </div>

            {orgsPreview.length === 0 ? (
              <div className="text-sm text-gray-500">Kutilayotgan tashkilot yo‘q.</div>
            ) : (
              <div className="space-y-3">
                {orgsPreview.map((org) => (
                  <div key={org.id} className="flex items-start justify-between gap-3">
                    <Link to={`${basePath}/organizations/${org.id}`} className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900 truncate hover:underline">{org.name}</div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px]">
                          PENDING
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-2">{org.description}</div>
                    </Link>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onApproveOrg(org.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onOpenRejectOrg(org.id)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-violet-700" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Eventlar</div>
                  <div className="text-xs text-gray-500">
                    Kutilayotgan: <span className="font-medium">{pendingEvents.length}</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => onGoTab("events")}>Ko‘rish</Button>
            </div>

            {eventsPreview.length === 0 ? (
              <div className="text-sm text-gray-500">Kutilayotgan event yo‘q.</div>
            ) : (
              <div className="space-y-3">
                {eventsPreview.map((ev) => (
                  <div key={ev.id} className="flex items-start justify-between gap-3">
                    <Link to={`${basePath}/events/${ev.id}`} className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900 truncate hover:underline">{ev.title}</div>
                        <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-[10px]">
                          PENDING
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-2">{ev.description}</div>
                    </Link>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onApproveEvent(ev.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onOpenRejectEvent(ev.id)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="relative h-[220px]">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=60"
            alt="Hotels & Hostels"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <div className="flex items-center gap-2 text-white">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Hotel className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-lg">Hotel / Hostel</div>
                <div className="text-xs text-white/80">Ko‘rish va batafsil ma’lumot</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <Link to={`${basePath}/accommodations`}>
                <Button className="rounded-xl">Ko‘rish</Button>
              </Link>
              <Link to="/hotels-hostels">
                <Button variant="secondary" className="rounded-xl">Public sahifa</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
