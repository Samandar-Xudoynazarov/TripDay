import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { eventsSvc, adminSvc } from '@/lib/api';
import Shell from '@/components/Shell';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowLeft, MapPin, Clock, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminEventDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { hasRole, isLoading, user } = useAuth();
  const isSuper = hasRole('SUPER_ADMIN');
  const base = isSuper ? '/super-admin' : '/admin';
  const label = isSuper ? 'Super Admin' : 'Admin';

  const [ev, setEv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const items = [
    { label:`${label} panel`, to:`${base}?tab=overview`, icon:'dashboard' },
    { label:'Tadbirlar', to:`${base}?tab=events`, icon:'events' },
    { label:'Bosh sahifa', to:'/', icon:'home' },
  ];

  useEffect(() => {
    if (isLoading) return;
    if (!user || (!hasRole('ADMIN') && !hasRole('SUPER_ADMIN'))) { nav('/login'); return; }
    load();
  }, [id, isLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const evData = await eventsSvc.getById(Number(id));
      setEv(evData);
      const pending = await adminSvc.pendingEvents();
      setIsPending(pending.some((p: any) => p.id === Number(id)));
    } catch { toast.error("Tadbir topilmadi"); nav(base); }
    finally { setLoading(false); }
  };

  const approve = async () => {
    await adminSvc.approveEvent(Number(id)); toast.success('Tasdiqlandi'); load();
  };

  const reject = async () => {
    if (!reason.trim()) { toast.error('Sabab kiriting'); return; }
    await adminSvc.rejectEvent(Number(id), reason);
    toast.success('Rad etildi'); nav(`${base}?tab=events`);
  };

  if (loading) return (
    <Shell items={items} title={label}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <div className="spinner" />
      </div>
    </Shell>
  );

  const d = ev ? new Date(ev.eventDateTime) : null;

  return (
    <Shell items={items} title={label}>
      <div style={{ padding:'28px', maxWidth:760 }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom:24 }} onClick={() => nav(`${base}?tab=events`)}>
          <ArrowLeft size={14} />Orqaga
        </button>
        {ev && (
          <div className="card anim-up">
            <div style={{ height:4, background:'linear-gradient(90deg,var(--accent),var(--accent2))' }} />
            <div style={{ padding:'28px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:24, color:'var(--text)', marginBottom:8 }}>{ev.title}</h1>
                  <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                    {d && !isNaN(d.getTime()) && (
                      <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--text-muted)' }}>
                        <Clock size={13} />{format(d,'dd MMM yyyy, HH:mm')}
                      </span>
                    )}
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--text-muted)' }}>
                      <MapPin size={13} />{ev.locationName}
                    </span>
                    {ev.organizationName && (
                      <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--text-muted)' }}>
                        <Building2 size={13} />{ev.organizationName}
                      </span>
                    )}
                  </div>
                </div>
                {isPending ? <span className="tag tag-yellow">Kutilmoqda</span> : <span className="tag tag-green">Tasdiqlangan</span>}
              </div>
              <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.8, marginBottom:24 }}>{ev.description}</p>
              {isPending && (
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn" style={{ background:'rgba(74,222,128,0.12)', color:'#86efac', border:'1px solid rgba(74,222,128,0.2)' }} onClick={approve}>
                    <CheckCircle size={15} />Tasdiqlash
                  </button>
                  <button className="btn btn-danger" onClick={() => setRejectOpen(true)}>
                    <XCircle size={15} />Rad etish
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {rejectOpen && (
        <div className="modal-bg" onClick={() => setRejectOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--text)', marginBottom:14 }}>Rad etish sababi</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} className="inp" style={{ resize:'vertical', marginBottom:14 }} placeholder="Sabab..." />
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-danger" style={{ flex:1 }} onClick={reject}>Rad etish</button>
              <button className="btn btn-ghost" onClick={() => setRejectOpen(false)}>Bekor</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
