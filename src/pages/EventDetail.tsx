import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { eventsSvc, regsSvc, likesSvc, commentsSvc } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { MapPin, Clock, Heart, MessageCircle, Send, Trash2, Users, ArrowLeft, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, hasRole } = useAuth();
  const eventId = Number(id);

  const [ev, setEv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [regsCount, setRegsCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [registered, setRegistered] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    Promise.all([
      eventsSvc.getById(eventId),
      likesSvc.count(eventId).catch(() => 0),
      regsSvc.getCountByEvent(eventId).catch(() => 0),
      commentsSvc.getAll(eventId).catch(() => []),
    ]).then(([evData, lk, rc, cm]) => {
      setEv(evData); setLikes(Number(lk) || 0); setRegsCount(Number(rc) || 0); setComments(cm);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!user || !eventId) return;
    regsSvc.getByUser(user.id).then(list => {
      setRegistered(list.some((r: any) => r.eventId === eventId || r.event?.id === eventId));
    }).catch(() => {});
  }, [user, eventId]);

  const doLike = async () => {
    if (!user) { nav('/login'); return; }
    await likesSvc.toggle(eventId);
    setLikes(l => l + 1);
  };

  const doRegister = async () => {
    if (!user) { nav('/login'); return; }
    setRegLoading(true);
    try {
      await regsSvc.register(eventId);
      setRegistered(true); setRegsCount(c => c + 1);
    } catch (e: any) { alert(e?.response?.data?.message || 'Xatolik'); }
    finally { setRegLoading(false); }
  };

  const doComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { nav('/login'); return; }
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await commentsSvc.create(eventId, newComment);
      const updated = await commentsSvc.getAll(eventId);
      setComments(updated); setNewComment('');
    } catch {} finally { setPosting(false); }
  };

  const delComment = async (cmId: number) => {
    await commentsSvc.delete(cmId);
    setComments(c => c.filter((x: any) => x.id !== cmId));
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  if (!ev) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth:700, margin:'60px auto', padding:'0 24px', textAlign:'center' }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:22, color:'var(--text)', marginBottom:12 }}>Tadbir topilmadi</h2>
        <Link to="/events" className="btn btn-ghost" style={{ textDecoration:'none' }}>Orqaga</Link>
      </div>
    </div>
  );

  const d = new Date(ev.eventDateTime);

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar />
      <div style={{ maxWidth:800, margin:'0 auto', padding:'32px 24px' }}>
        {/* Back */}
        <Link to="/events" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--text-muted)', textDecoration:'none', fontSize:13, marginBottom:24 }}>
          <ArrowLeft size={14} /> Tadbirlarga qaytish
        </Link>

        {/* Main card */}
        <div className="card anim-up" style={{ overflow:'visible' }}>
          <div style={{ height:4, background:'linear-gradient(90deg,var(--accent),var(--accent2))' }} />

          <div style={{ padding:'28px 28px 24px' }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:20, flexWrap:'wrap' }}>
              {!isNaN(d.getTime()) && (
                <div style={{ background:'rgba(124,106,247,0.12)', border:'1px solid rgba(124,106,247,0.2)', borderRadius:12, padding:'10px 16px', textAlign:'center', minWidth:60 }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28, color:'#a89af9', lineHeight:1 }}>{format(d,'dd')}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', marginTop:3 }}>{format(d,'MMM yyyy')}</div>
                </div>
              )}
              <div style={{ flex:1 }}>
                <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(20px,3vw,28px)', color:'var(--text)', lineHeight:1.2, marginBottom:8 }}>
                  {ev.title}
                </h1>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  {!isNaN(d.getTime()) && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text-muted)', fontSize:13 }}>
                      <Clock size={13} />{format(d,'HH:mm')}
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text-muted)', fontSize:13 }}>
                    <MapPin size={13} />{ev.locationName}
                  </div>
                  {ev.organizationName && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text-muted)', fontSize:13 }}>
                      <Building2 size={13} />{ev.organizationName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.8, marginBottom:24, whiteSpace:'pre-wrap' }}>
              {ev.description}
            </p>

            {/* Action row */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              {!registered ? (
                <button className="btn btn-primary" onClick={doRegister} disabled={regLoading}>
                  {regLoading ? <span className="spinner" style={{ width:16,height:16,borderWidth:2 }} /> : <><Users size={15} />Ro'yxatdan o'tish</>}
                </button>
              ) : (
                <div className="tag tag-green" style={{ padding:'8px 16px', fontSize:12 }}>
                  ✓ Ro'yxatdan o'tilgan
                </div>
              )}
              <button className="btn btn-ghost" onClick={doLike} style={{ gap:6 }}>
                <Heart size={15} /> {likes}
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)', fontSize:13, marginLeft:'auto' }}>
                <Users size={14} />{regsCount} ishtirokchi
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div style={{ marginTop:24 }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--text)', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <MessageCircle size={18} color="var(--accent)" /> Izohlar ({comments.length})
          </h2>

          {/* Input */}
          <form onSubmit={doComment} style={{ display:'flex', gap:10, marginBottom:20 }}>
            <input value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder={user ? "Izoh qoldiring..." : "Izoh qoldirish uchun kiring"}
              disabled={!user} className="inp" style={{ flex:1 }} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!user || posting || !newComment.trim()}>
              <Send size={14} />
            </button>
          </form>

          {/* List */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {comments.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:13 }}>
                Hozircha izohlar yo'q. Birinchi bo'ling!
              </div>
            ) : (
              comments.map((c: any) => (
                <div key={c.id} className="card" style={{ padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:'var(--accent)', fontWeight:600, marginBottom:4 }}>
                      {c.userFullName || c.userName || 'Foydalanuvchi'}
                    </div>
                    <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.6 }}>{c.text}</div>
                  </div>
                  {(user && (user.id === c.userId || hasRole('ADMIN') || hasRole('SUPER_ADMIN'))) && (
                    <button className="btn btn-danger btn-sm" onClick={() => delComment(c.id)} style={{ padding:'5px 10px' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
