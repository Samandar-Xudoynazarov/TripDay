import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarLayout, { SidebarIcons } from "@/components/layout/SidebarLayout";
import { authApi, managementApi } from "@/lib/api";
import { useAuth } from '@/lib/auth';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type UserSimple = {
  id: number;
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  roles?: string[] | string;
  enabled?: boolean;
};

function normalizeRoles(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map((r) => r.replace(/^ROLE_/, ""));
  if (typeof raw === "string")
    return raw
      .split(/[, ]+/)
      .filter(Boolean)
      .map((r) => r.replace(/^ROLE_/, ""));
  return [];
}

function getTabFromSearch(search: string, isSuper: boolean) {
  const sp = new URLSearchParams(search);
  const t = sp.get("tab") || "users";
  const allowed = new Set(["users", "tour", "admins", "super"]);
  const safe = allowed.has(t) ? t : "users";
  if (!isSuper && (safe === "admins" || safe === "super")) return "users";
  return safe;
}

export default function ManagementFeature() {
  const { user, logout, hasRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = hasRole("SUPER_ADMIN") ? "/super-admin" : "/admin";
  const panelLabel = hasRole("SUPER_ADMIN") ? "Super Admin" : "Admin";

  const isSuper = hasRole("SUPER_ADMIN");
  const managementPath = `${basePath}/management`;

  // ✅ tab URL query’dan keladi
  const tabFromUrl = useMemo(() => getTabFromSearch(location.search, isSuper), [location.search, isSuper]);
  const [tab, setTab] = useState<string>(tabFromUrl);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  // ✅ Tabs -> Sidebar items
  const sidebarItems = [
    { label: `${panelLabel} panel`, to: basePath, icon: SidebarIcons.Admin },

    { label: "Users", to: `${managementPath}?tab=users`, icon: SidebarIcons.Users },
    { label: "Tour organizations", to: `${managementPath}?tab=tour`, icon: SidebarIcons.Org },

    ...(isSuper
      ? [
          { label: "Admins", to: `${managementPath}?tab=admins`, icon: SidebarIcons.Admin },
          { label: "Super admins", to: `${managementPath}?tab=super`, icon: SidebarIcons.Shield ?? SidebarIcons.Admin },
        ]
      : []),

    { label: "Hotel / Hostel", to: `${basePath}/accommodations`, icon: SidebarIcons.Accommodations },
    { label: "Kalendar", to: `${basePath}/calendar`, icon: SidebarIcons.Calendar },
    { label: "Tadbirlar", to: "/events", icon: SidebarIcons.Dashboard },
    { label: "Bosh sahifa", to: "/", icon: SidebarIcons.Home },
  ];

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [users, setUsers] = useState<UserSimple[]>([]);
  const [tourOrgs, setTourOrgs] = useState<UserSimple[]>([]);
  const [admins, setAdmins] = useState<UserSimple[]>([]);
  const [superAdmins, setSuperAdmins] = useState<UserSimple[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!user || (!hasRole("ADMIN") && !hasRole("SUPER_ADMIN"))) {
      navigate("/login");
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([
        managementApi.getUsers(),
        managementApi.getTourOrganizations(),
      ]);

      setUsers(Array.isArray(u.data) ? u.data : []);
      setTourOrgs(Array.isArray(t.data) ? t.data : []);

      if (isSuper) {
        const [a, s] = await Promise.all([
          managementApi.getAdmins(),
          managementApi.getSuperAdmins(),
        ]);
        setAdmins(Array.isArray(a.data) ? a.data : []);
        setSuperAdmins(Array.isArray(s.data) ? s.data : []);
      } else {
        setAdmins([]);
        setSuperAdmins([]);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) {
        toast.error(
          "403: Ruxsat yo‘q. Backend adminga bu /management endpointlarni yopgan bo‘lishi mumkin yoki siz boshqa backendga ulangan bo‘lishingiz mumkin (VITE_API_PROXY_TARGET/VITE_BACKEND_URL ni tekshiring)."
        );
      } else {
        toast.error(e?.response?.data?.message || "Management ma'lumotlarini yuklashda xatolik");
      }
    } finally {
      setLoading(false);
    }
  };

  const filter = (arr: UserSimple[]) => {
    const x = q.trim().toLowerCase();
    if (!x) return arr;
    return arr.filter((u) => {
      const hay = `${u.id} ${u.fullName ?? ""} ${u.email ?? ""} ${u.phone ?? ""} ${u.country ?? ""}`.toLowerCase();
      return hay.includes(x);
    });
  };

  const UsersTable = ({
    data,
    allowForceLogout,
  }: {
    data: UserSimple[];
    allowForceLogout?: boolean;
  }) => {
    const list = useMemo(() => filter(data), [data, q]);

    return (
      <Card className="rounded-2xl border-0 shadow-md">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Ro‘yxat ({list.length})</CardTitle>
            <div className="text-xs text-slate-500 mt-1">
              Qidirish orqali ID/Ism/Email/Telefon bo‘yicha topasiz
            </div>
          </div>

          <div className="w-full sm:w-80">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish..." className="rounded-xl" />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left border-b border-slate-100">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Ism</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Rollar</th>
                  <th className="py-3 px-3">Holat</th>
                  {allowForceLogout ? <th className="py-3 px-3">Amal</th> : null}
                </tr>
              </thead>

              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="py-3 px-3">{u.id}</td>
                    <td className="py-3 px-3">{u.fullName ?? "—"}</td>
                    <td className="py-3 px-3">{u.email ?? "—"}</td>
                    <td className="py-3 px-3">{normalizeRoles(u.roles).join(", ") || "—"}</td>
                    <td className="py-3 px-3">
                      <span className={u.enabled === false ? "text-red-600" : "text-emerald-600"}>
                        {u.enabled === false ? "Disabled" : "Enabled"}
                      </span>
                    </td>

                    {allowForceLogout ? (
                      <td className="py-3 px-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={async () => {
                            if (!confirm("Force logout qilinsinmi?")) return;
                            try {
                              await authApi.forceLogout(u.id);
                              toast.success("Force logout bajarildi");
                            } catch (e: any) {
                              toast.error(e?.response?.data?.message || "Xatolik");
                            }
                          }}
                        >
                          Force logout
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <SidebarLayout title={`${panelLabel} Management`} items={sidebarItems}>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={`${panelLabel} Management`} items={sidebarItems}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-2xl font-semibold text-slate-900">Management</div>
            <div className="text-sm text-slate-500">
              Ishlatilmagan backend endpointlar shu yerda UI bilan ishlaydi.
            </div>
          </div>

          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Chiqish
          </Button>
        </div>

        {/* ✅ TabsList yo’q, tab URL orqali boshqariladi */}
        <Tabs value={tab} onValueChange={(v) => navigate(`${managementPath}?tab=${v}`)} className="space-y-4">
          <TabsContent value="users">
            <UsersTable data={users} />
          </TabsContent>

          <TabsContent value="tour">
            <UsersTable data={tourOrgs} />
          </TabsContent>

          {isSuper ? (
            <TabsContent value="admins">
              <UsersTable data={admins} />
            </TabsContent>
          ) : null}

          {isSuper ? (
            <TabsContent value="super">
              <UsersTable data={superAdmins} allowForceLogout />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </SidebarLayout>
  );
}