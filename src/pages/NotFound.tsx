import { Link } from 'react-router-dom';
import { Home, Ticket } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', textAlign:'center', padding:24 }}>
      <div className="anim-up" style={{ fontSize:'8rem', fontFamily:'Syne,sans-serif', fontWeight:800, lineHeight:1, background:'linear-gradient(135deg,var(--accent),var(--accent2))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
        404
      </div>
      <h1 className="anim-up s1" style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24, color:'var(--text)', marginBottom:10, marginTop:8 }}>
        Sahifa topilmadi
      </h1>
      <p className="anim-up s2" style={{ color:'var(--text-muted)', fontSize:14, marginBottom:28, maxWidth:300 }}>
        Siz qidirgan sahifa mavjud emas yoki o'chirib tashlangan.
      </p>
      <div className="anim-up s3" style={{ display:'flex', gap:10 }}>
        <Link to="/" className="btn btn-primary" style={{ textDecoration:'none' }}>
          <Home size={15} />Bosh sahifa
        </Link>
        <Link to="/events" className="btn btn-ghost" style={{ textDecoration:'none' }}>
          <Ticket size={15} />Tadbirlar
        </Link>
      </div>
    </div>
  );
}
