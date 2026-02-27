import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { accommodationsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import { toast } from 'sonner';
import ImageSlider from '@/components/ImageSlider';
import EventMap from '@/features/event-detail/components/EventMap';

function pickImages(item: any): string[] {
  const imgs = item?.images || item?.imageUrls || item?.photos || item?.files;
  return Array.isArray(imgs) ? imgs.map(String) : [];
}

export default function AccommodationDetailFeature() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const loc = useLocation();

  const accType = String(type || '').toLowerCase();
  const accId = Number(id);

  const baseBack = useMemo(() => {
    if (loc.pathname.startsWith('/super-admin')) return '/super-admin/accommodations';
    if (loc.pathname.startsWith('/admin')) return '/admin/accommodations';
    return '/hotels-hostels';
  }, [loc.pathname]);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any | null>(null);

  useEffect(() => {
    if (!accId || Number.isNaN(accId)) {
      navigate(baseBack);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = accType === 'hostel' ? await accommodationsApi.getHostels() : await accommodationsApi.getHotels();
        const arr = Array.isArray(res.data) ? res.data : [];
        const found = arr.find((x: any) => Number(x.id) === accId) || null;
        setItem(found);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Ma’lumotni yuklab bo‘lmadi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accId, accType, baseBack, navigate]);

  const images = useMemo(() => (item ? pickImages(item) : []), [item]);
  const title = item?.name ? String(item.name) : '—';

  const lat = useMemo(() => {
    const v = item?.latitude;
    const n = typeof v === 'string' || typeof v === 'number' ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [item]);

  const lng = useMemo(() => {
    const v = item?.longitude;
    const n = typeof v === 'string' || typeof v === 'number' ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [item]);

  const locationLine = useMemo(() => {
    const parts = [item?.city, item?.address].filter(Boolean).map(String);
    return parts.join(' • ');
  }, [item]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(baseBack)}>
            <ArrowLeft className="w-4 h-4" /> Orqaga
          </Button>
          <Badge variant={accType === 'hotel' ? 'default' : 'secondary'}>
            {accType === 'hotel' ? 'Hotel' : 'Hostel'}
          </Badge>
        </div>

        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : !item ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="text-slate-700">Topilmadi.</div>
              <div className="mt-4">
                <Link to={baseBack} className="text-indigo-600 hover:underline">Ro‘yxatga qaytish</Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <ImageSlider images={images} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="truncate">{title}</span>
                      {accType === 'hotel' && item?.stars ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
                          <Star className="w-4 h-4" /> {Number(item.stars)}★
                        </span>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item?.description ? <div className="text-slate-700 leading-relaxed">{String(item.description)}</div> : null}

                    {locationLine ? (
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mt-0.5 text-slate-500" />
                        <span>{locationLine}</span>
                      </div>
                    ) : null}

                    {lat !== null && lng !== null ? (
                      <div className="text-xs text-slate-500">Lat/Lng: {lat}, {lng}</div>
                    ) : null}
                  </CardContent>
                </Card>

                {images.length > 1 ? (
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Rasmlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {images.slice(0, 9).map((src: string, i: number) => (
                          <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200">
                            <img src={src} alt="" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div className="space-y-5">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Joylashuv</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lat !== null && lng !== null ? (
                      <EventMap
                        lat={lat}
                        lng={lng}
                        title={title}
                        locationName={locationLine || title}
                      />
                    ) : (
                      <div className="text-sm text-slate-600">Koordinata topilmadi.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
