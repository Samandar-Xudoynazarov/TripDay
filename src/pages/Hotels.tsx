import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accomSvc, pickImages, imgUrl } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Hotel, MapPin, Star, Search } from 'lucide-react';

export default function HotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [tab, setTab] = useState<'hotel'|'hostel'>('hotel');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([accomSvc.getHotels(), accomSvc.getHostels()])
      .then(([h, hs]) => { setHotels(h); setHostels(hs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = (tab === 'hotel' ? hotels : hostels).filter(item => {
    const x = q.toLowerCase();
    return !x || item.name?.toLowerCase().includes(x) || item.city?.toLowerCase().includes(x);
  });

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <Navbar />
      <div style={{ borderBottom:'1px solid var(--border)', padding:'28px 24px', background:'var(--surface)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(22px,3vw,34px)', marginBottom:20, color:'var(--text)' }}>
            Mehmonxonalar
          </h1>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
            <div className="tabs-list" style={{ display:'flex' }}>
              <button className={`tab-btn${tab==='hotel'?' active':''}`} onClick={() => setTab('hotel')}>
                Hotellar ({hotels.length})
              </button>
              <button className={`tab-btn${tab==='hostel'?' active':''}`} onClick={() => setTab('hostel')}>
                Hostellar ({hostels.length})
              </button>
            </div>
            <div style={{ position:'relative', flex:1, maxWidth:320 }}>
              <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Qidirish..." className="inp" style={{ paddingLeft:34 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div className="spinner" />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)' }}>
            <Hotel size={40} style={{ margin:'0 auto 12px', opacity:0.25 }} />
            <p>Hozircha {tab === 'hotel' ? 'hotel' : 'hostel'} mavjud emas</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
            {items.map((item: any, i) => {
              const imgs = pickImages(item);
              const img = imgs[0];
              return (
                <Link key={item.id} to={`/${tab}s/${item.id}`}
                  className="card card-hover anim-up" style={{ textDecoration:'none', animationDelay:`${Math.min(i,6)*0.05}s` }}>
                  {/* Image */}
                  <div style={{ aspectRatio:'16/9', background:'linear-gradient(135deg,var(--surface2),rgba(124,106,247,0.15))', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {img ? (
                      <img src={imgUrl(img)} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    ) : (
                      <Hotel size={32} color="var(--text-muted)" style={{ opacity:0.3 }} />
                    )}
                  </div>
                  <div style={{ padding:'16px 18px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, color:'var(--text)', lineHeight:1.3 }}>{item.name}</h3>
                      {tab === 'hotel' && item.stars && (
                        <div style={{ display:'flex', gap:1 }}>
                          {[...Array(Math.min(item.stars,5))].map((_,si) => (
                            <Star key={si} size={12} fill="#fbbf24" color="#fbbf24" />
                          ))}
                        </div>
                      )}


                      
                    </div>
                    {item.city && (
                      <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text-muted)', fontSize:12, marginBottom:6 }}>
                        <MapPin size={11} />{item.city}
                      </div>
                    )}
                    {item.description && (
                      <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6,
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
