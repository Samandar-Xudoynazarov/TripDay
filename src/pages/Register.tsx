import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/auth';
import { Ticket, ArrowRight, KeyRound, RefreshCw } from 'lucide-react';
import { COUNTRIES } from '@/constants/countries';

export default function RegisterPage() {
  const { user, isLoading, verifyRegister, redirectPath } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<'form'|'code'>('form');
  const [form, setForm] = useState({ fullName:'', email:'', phone:'', country:'Uzbekistan' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isLoading && user) nav(redirectPath(), { replace: true });
  }, [user, isLoading]);

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await api.post('/auth/register', { ...form, email: form.email.trim().toLowerCase() });
      setStep('code');
    } catch (er: any) { setErr(er?.response?.data?.message || 'Xatolik'); }
    finally { setLoading(false); }
  };

  const doVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { await verifyRegister(form.email, code); }
    catch (er: any) { setErr(er?.response?.data?.message || "Noto'g'ri kod"); }
    finally { setLoading(false); }
  };

  const F = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,106,247,0.1),transparent 70%)', top:-100, right:-100, pointerEvents:'none' }} />

      <div className="card anim-up" style={{ width:'100%', maxWidth:420, padding:36 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:16, margin:'0 auto 14px', background:'linear-gradient(135deg,var(--accent),var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Ticket size={24} color="#fff" />
          </div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--text)', marginBottom:6 }}>
            {step === 'form' ? "Hisob yaratish" : "Emailni tasdiqlang"}
          </h1>
          <p style={{ fontSize:13, color:'var(--text-muted)' }}>
            {step === 'form' ? 'Barcha maydonlarni to\'ldiring' : `${form.email} ga kod yuborildi`}
          </p>
        </div>

        {err && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#f87171' }}>{err}</div>}

        {step === 'form' ? (
          <form onSubmit={doRegister} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { k:'fullName', label:'Ism Familiya', ph:'Asilbek Karimov' },
              { k:'email', label:'Email', ph:'asilbek@example.com', type:'email' },
              { k:'phone', label:'Telefon', ph:'+998901234567' },
            ].map(({ k, label, ph, type }) => (
              <div key={k}>
                <label style={{ fontSize:12, color:'var(--text-muted)', marginBottom:5, display:'block', fontWeight:500 }}>{label}</label>
                <input type={type||'text'} required value={(form as any)[k]} onChange={F(k)} placeholder={ph} className="inp" />
              </div>
            ))}
            <div>
              <label style={{ fontSize:12, color:'var(--text-muted)', marginBottom:5, display:'block', fontWeight:500 }}>Davlat</label>
              <select
                required
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                className="inp"
                style={{ appearance:'none', cursor:'pointer' }}
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop:4 }}>
              {loading ? <span className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> : <><span>Ro'yxatdan o'tish</span><ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={doVerify} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input type="text" required value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="123456" maxLength={6} className="inp" style={{ letterSpacing:'0.18em', fontSize:20, textAlign:'center' }} />
            <button type="submit" className="btn btn-primary" disabled={loading||code.length<4}>
              {loading ? <span className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> : <><KeyRound size={15} /><span>Tasdiqlash</span></>}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setStep('form'); setCode(''); setErr(''); }}>
              <RefreshCw size={13} /> Orqaga
            </button>
          </form>
        )}

        <div style={{ marginTop:22, textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>
          Allaqachon hisob bormi?{' '}
          <Link to="/login" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>Kirish</Link>
        </div>
      </div>
    </div>
  );
}
