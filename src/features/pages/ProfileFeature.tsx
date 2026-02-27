import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersApi, registrationsApi , safeArray} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  CalendarDays,
  User,
  Mail,
  Phone,
  Globe,
  LogOut,
  Save,
  LayoutDashboard,
  Building2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface RegItem {
  id: number;
  eventId: number;
  eventTitle?: string;
  eventDateTime?: string;
  registeredAt: string;
}

export default function ProfilePage() {
  const { user, logout, hasRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', country: '' });
  const [regs, setRegs] = useState<RegItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { navigate('/login'); return; }
    setForm({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      country: user.country || '',
    });
    registrationsApi
      .getByUser(user.id)
      .then((r) => {
        setRegs(safeArray(r));
      })
      .catch(() => setRegs([]));
  }, [user, navigate, isLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await usersApi.update(user.id, form);
      toast.success("Profil yangilandi!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleUnregister = async (regId: number) => {
    if (!confirm("Ro'yxatdan chiqmoqchimisiz?")) return;
    try {
      await registrationsApi.delete(regId);
      setRegs((prev) => prev.filter((r) => r.id !== regId));
      toast.success("Ro'yxatdan chiqarildingiz");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Xatolik');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );
  if (!user) return null;

  // ✅ Defensive: Netlify/old localStorage formatda roles string bo‘lib qolishi mumkin
  const safeRoles: string[] = (() => {
    const raw: any = (user as any)?.roles;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === 'string') return raw.split(/[, ]+/).filter(Boolean).map((r) => r.replace(/^ROLE_/, ''));
    if (Array.isArray(raw?.authorities)) return raw.authorities.map((a: any) => String(a?.authority ?? a)).map((r) => r.replace(/^ROLE_/, ''));
    return [];
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TripDay</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/events"><Button variant="ghost" size="sm">Tadbirlar</Button></Link>
            {(hasRole('ADMIN') || hasRole('SUPER_ADMIN')) && (
              <Link to={hasRole('SUPER_ADMIN') ? '/super-admin' : '/admin'}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-1" />
                  {hasRole('SUPER_ADMIN') ? 'Super Admin' : 'Admin'}
                </Button>
              </Link>
            )}
            {hasRole('TOUR_ORGANIZATION') && (
              <Link to="/dashboard"><Button variant="ghost" size="sm"><Building2 className="w-4 h-4 mr-1" />Dashboard</Button></Link>
            )}
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
              <LogOut className="w-4 h-4 mr-1" />Chiqish
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Profil ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1"><User className="w-3 h-3" />Ism familiya</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Mail className="w-3 h-3" />Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" disabled />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Phone className="w-3 h-3" />Telefon</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Globe className="w-3 h-3" />Davlat</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {safeRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                  ))}
                </div>
              </div>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Registrations */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Ro'yxatdan o'tgan tadbirlar ({regs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {regs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Hali birorta tadbirga ro'yxatdan o'tmagansiz</p>
                <Link to="/events">
                  <Button variant="link" className="mt-2 text-indigo-600">Tadbirlarni ko'rish</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {regs.map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Link to={`/events/${reg.eventId}`} className="font-medium text-gray-900 hover:text-indigo-600">
                        {reg.eventTitle || `Tadbir #${reg.eventId}`}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Ro'yxatdan o'tilgan: {format(new Date(reg.registeredAt), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleUnregister(reg.id)}>
                      Bekor qilish
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}