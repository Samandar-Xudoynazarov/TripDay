import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Shield, Users } from "lucide-react";
import type { UserData } from "../helpers";
import { normalizeRoles } from "../helpers";

type Props = {
  users: UserData[];
  adminUsers: UserData[];
  hasRole: (role: string) => boolean;
  onMakeAdmin: (userId: number) => void;
  onMakeOrganization: (userId: number) => void;
  onToggleEnabled: (userId: number, enabled: boolean) => void;
};

export default function UsersTab({
  users,
  adminUsers,
  hasRole,
  onMakeAdmin,
  onMakeOrganization,
  onToggleEnabled,
}: Props) {
  const [q, setQ] = useState("");

  const filteredUsers = useMemo(() => {
    const x = q.trim().toLowerCase();
    if (!x) return users;

    return users.filter((u) => {
      const fullName = (u.fullName ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const phone = (u.phone ?? "").toLowerCase();

      return fullName.includes(x) || email.includes(x) || phone.includes(x);
    });
  }, [users, q]);

  // Adminlar ro‘yxatini ham qidiruvga moslab yuboramiz (faqat superadmin ko‘rsa)
  const filteredAdmins = useMemo(() => {
    const x = q.trim().toLowerCase();
    if (!x) return adminUsers;

    return adminUsers.filter((u) => {
      const fullName = (u.fullName ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const phone = (u.phone ?? "").toLowerCase();
      return fullName.includes(x) || email.includes(x) || phone.includes(x);
    });
  }, [adminUsers, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Foydalanuvchilar ({filteredUsers.length})
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Super Admin: ADMIN yaratadi. Admin/Super Admin: userni tashkilotchi (TOUR_ORGANIZATION) qilishi mumkin.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          {hasRole("SUPER_ADMIN") ? (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
              Adminlar: {filteredAdmins.length}
            </Badge>
          ) : null}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ism/familiya yoki email/telefon..."
              className="w-full sm:w-80"
            />
            {q ? (
              <Button variant="outline" size="sm" onClick={() => setQ("")}>
                Tozalash
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {hasRole("SUPER_ADMIN") && filteredAdmins.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Adminlar ro'yxati</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredAdmins.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{a.fullName}</div>
                  <div className="text-xs text-gray-500 truncate">{a.email}</div>
                </div>
                <Badge variant="secondary">ADMIN</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {filteredUsers.map((u) => {
          const roles = normalizeRoles(u.roles);

          const canMakeAdmin =
            hasRole("SUPER_ADMIN") && !roles.includes("ADMIN") && !roles.includes("SUPER_ADMIN");

          const canMakeOrg =
            (hasRole("ADMIN") || hasRole("SUPER_ADMIN")) &&
            !roles.includes("TOUR_ORGANIZATION") &&
            !roles.includes("ADMIN") &&
            !roles.includes("SUPER_ADMIN");

          return (
            <Card key={u.id} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{u.fullName}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {roles.length === 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          USER
                        </Badge>
                      ) : (
                        roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!u.enabled && (
                    <Badge variant="destructive" className="text-xs">
                      O'chirilgan
                    </Badge>
                  )}

                  <Button variant="outline" size="sm" onClick={() => onToggleEnabled(u.id, u.enabled)}>
                    {u.enabled ? "Delete" : "Yoqish"}
                  </Button>

                  {canMakeAdmin && (
                    <Button size="sm" variant="outline" onClick={() => onMakeAdmin(u.id)}>
                      <Shield className="w-3 h-3 mr-1" />
                      Admin qilish
                    </Button>
                  )}

                  {canMakeOrg && (
                    <Button size="sm" variant="outline" onClick={() => onMakeOrganization(u.id)}>
                      <Building2 className="w-3 h-3 mr-1" />
                      Tashkilotchi qilish
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-sm text-gray-500 bg-white border rounded-xl p-4">
          Hech narsa topilmadi.
        </div>
      ) : null}
    </div>
  );
}