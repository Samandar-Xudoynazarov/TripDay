import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SidebarLayout, { SidebarIcons } from "@/components/layout/SidebarLayout";
import { registrationsApi } from "@/lib/api";
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Registration = {
  id: number;
  eventId?: number;
  eventTitle?: string;
  createdAt?: string;
};

export default function MyRegistrationsFeature() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Registration[]>([]);

  const sidebarItems = [
    { label: "Bosh sahifa", to: "/", icon: SidebarIcons.Home },
    { label: "Tadbirlar", to: "/events", icon: SidebarIcons.Dashboard },
    { label: "Mening ro‘yxatlarim", to: "/my-registrations", icon: SidebarIcons.Users },
  ];

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await registrationsApi.getByUser(user.id);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ro‘yxatlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout title="Mening ro‘yxatlarim" items={sidebarItems}>
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">Mening ro‘yxatdan o‘tishlarim</div>
            <div className="text-sm text-muted-foreground">registrations endpointlari ishlaydi: GET /registrations/user/:userId va DELETE /registrations/:id</div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/events">Tadbirlar</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ro‘yxat ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Yuklanmoqda...</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">Hozircha ro‘yxatdan o‘tishlar yo‘q.</div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between rounded-xl border p-3 bg-white">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {it.eventTitle ?? `Event #${it.eventId ?? "—"}`}
                      </div>
                      <div className="text-xs text-muted-foreground">Registration ID: {it.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {it.eventId ? (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/events/${it.eventId}`)}>
                          Ko‘rish
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (!confirm("Ro‘yxatdan o‘tishni bekor qilasizmi?")) return;
                          try {
                            await registrationsApi.delete(it.id);
                            toast.success("Bekor qilindi");
                            setItems((p) => p.filter((x) => x.id !== it.id));
                          } catch (e: any) {
                            toast.error(e?.response?.data?.message || "Xatolik");
                          }
                        }}
                      >
                        O‘chirish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
