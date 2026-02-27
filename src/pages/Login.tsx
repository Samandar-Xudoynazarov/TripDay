import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Ticket, Mail, ArrowRight, KeyRound, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const { user, isLoading, login, verify, redirectPath } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState<'email'|'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isLoading && user) {
      const next = params.get('next');
      nav(next?.startsWith('/') ? next : redirectPath(), { replace: true });
    }
  }, [user, isLoading]);

  const doEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { await login(email); }
    catch (er: any) { if (er.needsVerification) setStep('code'); else setErr(er?.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };

  const doCode = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { await verify(email, code); }
    catch (er: any) { setErr(er?.response?.data?.message || "Noto'g'ri kod"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,106,247,0.1),transparent 70%)', top:-100, right:-100, pointerEvents:'none' }} />
      <div style={{ position:'fixed', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(240,98,146,0.07),transparent 70%)', bottom:-80, left:-80, pointerEvents:'none' }} />

      <div className="card anim-up" style={{ width:'100%', maxWidth:400, padding:36 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:16, margin:'0 auto 14px', background:'linear-gradient(135deg,var(--accent),var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Ticket size={24} color="#fff" />
          </div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:24, color:'var(--text)', marginBottom:6 }}>
            {step === 'email' ? 'Xush kelibsiz' : 'Kodni kiriting'}
          </h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>
            {step === 'email' ? 'Email manzilingizni kiriting' : `${email} ga kod yuborildi`}
          </p>
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:24 }}>
          {[0,1].map(i => (
            <div key={i} style={{ flex:1 }}>
              <div style={{ height:2, borderRadius:2, background: (step==='email'&&i===0)||(step==='code') ? 'linear-gradient(90deg,var(--accent),var(--accent2))' : 'var(--border)' }} />
            </div>
          ))}
        </div>

        {err && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#f87171' }}>{err}</div>}

        {step === 'email' ? (
          <form onSubmit={doEmail} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ position:'relative' }}>
              <Mail size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="siz@example.com" className="inp" style={{ paddingLeft:36 }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> : <><span>Davom etish</span><ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={doCode} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ position:'relative' }}>
              <KeyRound size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input type="text" required value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="123456" maxLength={6} className="inp" style={{ paddingLeft:36, letterSpacing:'0.18em', fontSize:20, textAlign:'center' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading||code.length<4}>
              {loading ? <span className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> : <><KeyRound size={15} /><span>Tasdiqlash</span></>}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setStep('email'); setCode(''); setErr(''); }}>
              <RefreshCw size={13} /> Orqaga
            </button>
          </form>
        )}

        <div style={{ marginTop:22, textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>
          Akkauntingiz yo'qmi?{' '}
          <Link to="/register" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>Ro'yxatdan o'ting</Link>
        </div>
      </div>
    </div>
  );
}
