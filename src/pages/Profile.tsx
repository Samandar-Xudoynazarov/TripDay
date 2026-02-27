import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { usersSvc, regsSvc } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { User, Mail, Phone, Globe, Save, CalendarDays, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ fullName:'', email:'', phone:'', country:'' });
  const [regs, setRegs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { nav('/login'); return; }
    setForm({ fullName: user.fullName||'', email: user.email||'', phone: user.phone||'', country: user.country||'' });
    regsSvc.getByUser(user.id).then(setRegs).catch(() => {});
  }, [user, isLoading]);

  if (isLoading) return <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner" /></div>;
  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await usersSvc.update(user.id, form); toast.success('Profil yangilandi!'); }
    catch (er: any) { toast.error(er?.response?.data?.message || 'Xatolik'); }
    finally { setSaving(false); }
  };

  const unregister = async (regId: number) => {
    if (!confirm("Ro'yxatdan chiqasizmi?")) return;
    await regsSvc.delete(regId);
    setRegs(p => p.filter(r => r.id !== regId));
    toast.success("Bekor qilindi");
  };

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar />
      <div style={{ maxWidth:760, margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28, color:'var(--text)', marginBottom:4 }}>Profil</h1>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {user.roles.map(r => <span key={r} className="tag tag-accent">{r}</span>)}
          </div>
        </div>

        {/* Edit form */}
        <div className="card anim-up" style={{ marginBottom:24 }}>
          <div style={{ padding:'22px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <User size={16} color="var(--accent)" />
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'var(--text)' }}>Shaxsiy ma'lumotlar</span>
          </div>
          <form onSubmit={save} style={{ padding:'22px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
              {[
                { k:'fullName', label:'Ism Familiya', icon:<User size={13} /> },
                { k:'email', label:'Email', icon:<Mail size={13} />, disabled:true },
                { k:'phone', label:'Telefon', icon:<Phone size={13} /> },
                { k:'country', label:'Davlat', icon:<Globe size={13} /> },
              ].map(({ k, label, icon, disabled }) => (
                <div key={k}>
                  <label style={{ fontSize:11, color:'var(--text-muted)', marginBottom:5, display:'flex', alignItems:'center', gap:4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>
                    {icon}{label}
                  </label>
                  <input value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                    disabled={disabled} className="inp" style={{ opacity: disabled ? 0.5 : 1 }} />
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width:16,height:16,borderWidth:2 }} /> : <><Save size={15} />Saqlash</>}
            </button>
          </form>
        </div>

        {/* Registrations */}
        <div className="card anim-up s2">
          <div style={{ padding:'22px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <CalendarDays size={16} color="var(--accent)" />
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'var(--text)' }}>
              Tadbirlarim ({regs.length})
            </span>
          </div>
          <div style={{ padding:'12px 16px' }}>
            {regs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:13 }}>
                Hali hech qanday tadbirga ro'yxatdan o'tmagansiz.{' '}
                <Link to="/events" style={{ color:'var(--accent)', textDecoration:'none' }}>Ko'ring</Link>
              </div>
            ) : (
              regs.map(reg => (
                <div key={reg.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <Link to={`/events/${reg.eventId}`} style={{ fontWeight:600, fontSize:14, color:'var(--text)', textDecoration:'none' }}>
                      {reg.eventTitle || `Tadbir #${reg.eventId}`}
                    </Link>
                    {reg.registeredAt && (
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
                        {format(new Date(reg.registeredAt), 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => unregister(reg.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
