import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { accommodationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type HotelLike = {
  id: number;
  type: 'HOTEL' | 'HOSTEL';
  name: string;
  city?: string;
  address?: string;
  stars?: number;
  images?: string[];
};

function pickImages(item: any): string[] {
  const imgs = item?.images || item?.imageUrls || item?.photos || item?.files;
  return Array.isArray(imgs) ? imgs.map(String) : [];
}

export default function HotelsHostelsFeature() {
  const { isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<HotelLike[]>([]);
  const [idx, setIdx] = useState(0);
  const [layoutSeed, setLayoutSeed] = useState(() => Date.now());
  const didFetch = useRef(false); // ✅ StrictMode (DEV) da 2 marta ketishini to‘xtatadi

  useEffect(() => {
    if (isLoading) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (didFetch.current) return;
    didFetch.current = true;

    let cancelled = false;

    (async () => {
      try {
        // ✅ ketma-ket: avval hotels, keyin hostels
        const hRes = await accommodationsApi.getHotels();
        const hList = Array.isArray(hRes.data) ? hRes.data : Array.isArray((hRes as any)?.data?.data) ? (hRes as any).data.data : [];
        const hotels: HotelLike[] = hList.map((x: any) => ({
          id: Number(x.id),
          type: 'HOTEL',
          name: String(x.name),
          city: x.city,
          address: x.address,
          stars: x.stars,
          images: pickImages(x),
        }));

        const sRes = await accommodationsApi.getHostels();
        const sList = Array.isArray(sRes.data) ? sRes.data : Array.isArray((sRes as any)?.data?.data) ? (sRes as any).data.data : [];
        const hostels: HotelLike[] = sList.map((x: any) => ({
          id: Number(x.id),
          type: 'HOSTEL',
          name: String(x.name),
          city: x.city,
          address: x.address,
          images: pickImages(x),
        }));

        if (cancelled) return;
        setItems([...hotels, ...hostels]);
      } catch {
        if (!cancelled) toast.error("Hotel/hostellarni yuklab bo'lmadi");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

// 12 ta “pazl” uchun ro‘yxat
  const tiles = useMemo(() => {
    const base = items.length ? items : [];
    const out: HotelLike[] = [];
    for (let i = 0; i < 12; i++) out.push(base[(idx + i) % (base.length || 1)]);
    return out;
  }, [items, idx]);

  // "Pazl" o'lchamlari (o'lcham o'zgarmaydi), lekin joylashuv refreshda aralashadi.
  const sizePattern = useMemo(
    () => [
      { key: 'L', className: 'lg:col-span-3 lg:row-span-2' },
      { key: 'M1', className: 'lg:col-span-3 lg:row-span-1' },
      { key: 'S1', className: 'lg:col-span-2 lg:row-span-1' },
      { key: 'S2', className: 'lg:col-span-2 lg:row-span-1' },
      { key: 'M2', className: 'lg:col-span-2 lg:row-span-2' },
      { key: 'S3', className: 'lg:col-span-2 lg:row-span-1' },
      { key: 'S4', className: 'lg:col-span-2 lg:row-span-1' },
      { key: 'M3', className: 'lg:col-span-3 lg:row-span-1' },
      { key: 'S5', className: 'lg:col-span-2 lg:row-span-1' },
      { key: 'S6', className: 'lg:col-span-2 lg:row-span-1' },
      { key: 'M4', className: 'lg:col-span-2 lg:row-span-2' },
      { key: 'S7', className: 'lg:col-span-2 lg:row-span-1' },
    ],
    [],
  );

  const shuffledSlots = useMemo(() => {
    // Fisher–Yates shuffle (seed orqali faqat refreshda qayta hisoblanadi)
    const arr = [...sizePattern];
    let x = layoutSeed;
    const rand = () => {
      // oddiy deterministic PRNG
      x = (x * 1664525 + 1013904223) % 4294967296;
      return x / 4294967296;
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [sizePattern, layoutSeed]);

  // Har 5 minutda “pazl” aylanishi (index siljiydi, tile o‘lchami o‘zgarmaydi)
  useEffect(() => {
    const t = setInterval(() => setIdx((p) => p + 1), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative">
        <div className="h-[340px] w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=60"
            alt="Hotels"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 pb-6">
            <div className="text-white">
              <div className="text-3xl font-bold">Hotels & Hostels</div>
              <div className="text-white/85 mt-1">O‘zbekiston bo‘ylab mehmonxonalar va hostellar</div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <a href="#grid">
                  <Button className="rounded-xl">Ko‘rish</Button>
                </a>
                <Link to="/events">
                  <Button variant="secondary" className="rounded-xl">Tadbirlar</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="grid" className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xl font-semibold text-slate-900">Top joylar</div>
            <div className="text-sm text-slate-600">12 ta pazl ko‘rinishida (refreshda joylashuv aralashadi, 5 minutda kontent siljiydi)</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIdx((p) => Math.max(0, p - 1))}>
              Orqaga
            </Button>
            <Button className="rounded-xl" onClick={() => setIdx((p) => p + 1)}>
              Keyingi
            </Button>
            <Button variant="secondary" className="rounded-xl" onClick={() => setLayoutSeed(Date.now())}>
              Aralashtirish
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 auto-rows-[110px]">
          {shuffledSlots.map((slot, i) => {
            const it = tiles[i];
            const href = it?.id ? `/accommodations/${it.type.toLowerCase()}/${it.id}` : '#';
            return (
              <Link key={`${slot.key}-${it?.type}-${it?.id}-${i}`} to={href} className={slot.className}>
                <Card className="rounded-2xl overflow-hidden h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-0 h-full">
                    <div className="h-full w-full relative bg-slate-200">
                      {it?.images?.[0] ? (
                        <img src={it.images[0]} alt={it.name} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">No image</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">{it?.name || '—'}</div>
                            <div className="text-xs text-white/80 truncate">{it?.city || ''}</div>
                          </div>
                          <Badge variant={it?.type === 'HOTEL' ? 'default' : 'secondary'}>
                            {it?.type === 'HOTEL' ? 'Hotel' : 'Hostel'}
                          </Badge>
                        </div>
                        {it?.stars ? <div className="text-xs text-white/80 mt-1">{it.stars}★</div> : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {!items.length ? <div className="text-sm text-slate-500 mt-6">Hozircha ma’lumot yo‘q.</div> : null}
      </div>
    </div>
  );
}