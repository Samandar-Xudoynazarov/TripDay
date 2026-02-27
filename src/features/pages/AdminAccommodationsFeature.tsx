import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout, { SidebarIcons } from '@/components/layout/SidebarLayout';
import { accommodationsApi, amenitiesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { parseLatLngFromLink } from '@/lib/geo';
import { Link } from 'react-router-dom';

type Amenity = { id: number; name: string };

type Hotel = {
  id: number;
  name: string;
  city?: string;
  address?: string;
  stars?: number;
  images?: string[];
};

type Hostel = {
  id: number;
  name: string;
  city?: string;
  address?: string;
  images?: string[];
};

function pickImages(item: any): string[] {
  const imgs = item?.images || item?.imageUrls || item?.photos || item?.files;
  return Array.isArray(imgs) ? imgs.map(String) : [];
}

export default function AdminAccommodationsFeature() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const basePath = hasRole('SUPER_ADMIN') ? '/super-admin' : '/admin';
  const panelLabel = hasRole('SUPER_ADMIN') ? 'Super Admin' : 'Admin';
  const isSuperAdmin = hasRole('SUPER_ADMIN');

  const sidebarItems = useMemo(
    () => [
      { label: `${panelLabel} panel`, to: basePath, icon: SidebarIcons.Admin },
      { label: 'Management', to: `${basePath}/management`, icon: SidebarIcons.Users },
      { label: 'Hotel / Hostel', to: `${basePath}/accommodations`, icon: SidebarIcons.Accommodations },
      { label: 'Kalendar', to: `${basePath}/calendar`, icon: SidebarIcons.Calendar },
      { label: 'Tadbirlar', to: '/events', icon: SidebarIcons.Dashboard },
      { label: 'Bosh sahifa', to: '/', icon: SidebarIcons.Home },
    ],
    [basePath, panelLabel],
  );

  const [loading, setLoading] = useState(true);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);

  // amenities create
  const [newAmenity, setNewAmenity] = useState('');

  // hotel form
  const [hName, setHName] = useState('');
  const [hDesc, setHDesc] = useState('');
  const [hCity, setHCity] = useState('');
  const [hAddress, setHAddress] = useState('');
  const [hLat, setHLat] = useState('');
  const [hLng, setHLng] = useState('');
  const [hLink, setHLink] = useState('');
  const [hStars, setHStars] = useState('3');
  const [hFiles, setHFiles] = useState<File[]>([]);
  const [hAmenityIds, setHAmenityIds] = useState<number[]>([]);

  // hostel form
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sCity, setSCity] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sLat, setSLat] = useState('');
  const [sLng, setSLng] = useState('');
  const [sLink, setSLink] = useState('');
  const [sFiles, setSFiles] = useState<File[]>([]);
  const [sAmenityIds, setSAmenityIds] = useState<number[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!hasRole('ADMIN') && !hasRole('SUPER_ADMIN')) {
      navigate('/');
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // ✅ ketma-ket: avval amenities, keyin hotels, keyin hostels
      const aRes = await amenitiesApi.getAll();
      {
        const list = Array.isArray(aRes.data) ? aRes.data : Array.isArray((aRes as any)?.data?.data) ? (aRes as any).data.data : [];
        setAmenities(list.map((x: any) => ({ id: Number(x.id), name: String(x.name) })));
      }

      const hRes = await accommodationsApi.getHotels();
      {
        const list = Array.isArray(hRes.data) ? hRes.data : Array.isArray((hRes as any)?.data?.data) ? (hRes as any).data.data : [];
        setHotels(
          list.map((x: any) => ({
          id: Number(x.id),
          name: String(x.name),
          city: x.city,
          address: x.address,
          stars: x.stars,
          images: pickImages(x),
          })),
        );
      }

      const sRes = await accommodationsApi.getHostels();
      {
        const list = Array.isArray(sRes.data) ? sRes.data : Array.isArray((sRes as any)?.data?.data) ? (sRes as any).data.data : [];
        setHostels(
          list.map((x: any) => ({
          id: Number(x.id),
          name: String(x.name),
          city: x.city,
          address: x.address,
          images: pickImages(x),
          })),
        );
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };;

  const toggleAmenity = (id: number, selected: number[], setSelected: (v: number[]) => void) => {
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id));
    else setSelected([...selected, id]);
  };

  const createAmenity = async () => {
    if (isSuperAdmin) return toast.error("SUPER_ADMIN faqat ko‘ra oladi");
    const name = newAmenity.trim();
    if (!name) return toast.error('Amenity nomini kiriting');
    try {
      await amenitiesApi.create(name);
      toast.success("Amenity qo'shildi");
      setNewAmenity('');
      loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Xatolik');
    }
  };

  const deleteAmenity = async (id: number) => {
    if (isSuperAdmin) return toast.error("SUPER_ADMIN faqat ko‘ra oladi");
    try {
      await amenitiesApi.delete(id);
      toast.success("Amenity o'chirildi");
      loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Xatolik');
    }
  };

  const submitHotel = async () => {
    if (isSuperAdmin) return toast.error("SUPER_ADMIN hotel/hostel qo‘sha olmaydi");
    if (!hName.trim() || !hDesc.trim() || !hCity.trim() || !hAddress.trim()) {
      return toast.error("Hotel uchun hamma majburiy maydonlarni to'ldiring");
    }
    const lat = Number(hLat);
    const lng = Number(hLng);
    const stars = Number(hStars);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return toast.error('Latitude/Longitude son bo‘lishi kerak');
    if (Number.isNaN(stars) || stars < 1 || stars > 5) return toast.error('Stars 1..5 bo‘lishi kerak');
    try {
      await accommodationsApi.createHotel({
        name: hName.trim(),
        description: hDesc.trim(),
        city: hCity.trim(),
        address: hAddress.trim(),
        latitude: lat,
        longitude: lng,
        stars,
        amenityIds: hAmenityIds,
        files: hFiles,
      });
      toast.success("Hotel yaratildi");
      setHName('');
      setHDesc('');
      setHCity('');
      setHAddress('');
      setHLat('');
      setHLng('');
      setHStars('3');
      setHFiles([]);
      setHAmenityIds([]);
      loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Xatolik');
    }
  };

  const submitHostel = async () => {
    if (isSuperAdmin) return toast.error("SUPER_ADMIN hotel/hostel qo‘sha olmaydi");
    if (!sName.trim() || !sDesc.trim() || !sCity.trim() || !sAddress.trim()) {
      return toast.error("Hostel uchun hamma majburiy maydonlarni to'ldiring");
    }
    const lat = Number(sLat);
    const lng = Number(sLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return toast.error('Latitude/Longitude son bo‘lishi kerak');
    try {
      await accommodationsApi.createHostel({
        name: sName.trim(),
        description: sDesc.trim(),
        city: sCity.trim(),
        address: sAddress.trim(),
        latitude: lat,
        longitude: lng,
        amenityIds: sAmenityIds,
        files: sFiles,
      });
      toast.success('Hostel yaratildi');
      setSName('');
      setSDesc('');
      setSCity('');
      setSAddress('');
      setSLat('');
      setSLng('');
      setSFiles([]);
      setSAmenityIds([]);
      loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Xatolik');
    }
  };

  return (
    <SidebarLayout title={`${panelLabel} — Hotel/Hostel`} items={sidebarItems}>
      <div className="space-y-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSuperAdmin ? (
              <div className="flex gap-2">
                <Input value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} placeholder="Masalan: Wi‑Fi" />
                <Button onClick={createAmenity}>Qo‘shish</Button>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                SUPER_ADMIN bu bo‘limni faqat ko‘ra oladi (qo‘shish/o‘chirish yo‘q).
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <Badge
                  key={a.id}
                  variant="secondary"
                  className={isSuperAdmin ? '' : 'cursor-pointer'}
                  onClick={() => (!isSuperAdmin ? deleteAmenity(a.id) : undefined)}
                  title={isSuperAdmin ? undefined : "O‘chirish uchun bosing"}
                >
                  {a.name} ×
                </Badge>
              ))}
              {amenities.length === 0 ? <div className="text-sm text-slate-500">Hozircha amenity yo‘q</div> : null}
            </div>
            {!isSuperAdmin ? (
              <div className="text-xs text-slate-500">
                * Amenity badge ustiga bossangiz o‘chadi (oddiy demo). Xohlasangiz alohida confirm dialog qo‘shamiz.
              </div>
            ) : null}
          </CardContent>
        </Card>

        {!isSuperAdmin ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Hotel qo‘shish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
              <Input value={hName} onChange={(e) => setHName(e.target.value)} placeholder="Name" />
              <Textarea value={hDesc} onChange={(e) => setHDesc(e.target.value)} placeholder="Description" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={hCity} onChange={(e) => setHCity(e.target.value)} placeholder="City" />
                <Input value={hStars} onChange={(e) => setHStars(e.target.value)} placeholder="Stars (1..5)" />
              </div>
              <Input value={hAddress} onChange={(e) => setHAddress(e.target.value)} placeholder="Address" />

              <Input
                value={hLink}
                onChange={(e) => {
                  const v = e.target.value;
                  setHLink(v);
                  const parsed = parseLatLngFromLink(v);
                  if (parsed) {
                    setHLat(String(parsed.lat));
                    setHLng(String(parsed.lng));
                  }
                }}
                placeholder="Joylashuv linki (Google/Yandex) — paste qiling"
              />

              <div className="grid grid-cols-2 gap-2">
                <Input value={hLat} onChange={(e) => setHLat(e.target.value)} placeholder="Latitude" />
                <Input value={hLng} onChange={(e) => setHLng(e.target.value)} placeholder="Longitude" />
              </div>

              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium">Amenities (tanlang)</div>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => {
                    const active = hAmenityIds.includes(a.id);
                    return (
                      <Badge
                        key={a.id}
                        variant={active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleAmenity(a.id, hAmenityIds, setHAmenityIds)}
                      >
                        {a.name}
                      </Badge>
                    );
                  })}
                  {amenities.length === 0 ? <div className="text-sm text-slate-500">Avval amenity qo‘shing</div> : null}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Rasmlar</div>
                <Input type="file" multiple accept="image/*" onChange={(e) => setHFiles(Array.from(e.target.files || []))} />
              </div>

              <Button className="w-full" onClick={submitHotel}>
                Hotel yaratish
              </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Hostel qo‘shish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
              <Input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Name" />
              <Textarea value={sDesc} onChange={(e) => setSDesc(e.target.value)} placeholder="Description" />
              <Input value={sCity} onChange={(e) => setSCity(e.target.value)} placeholder="City" />
              <Input value={sAddress} onChange={(e) => setSAddress(e.target.value)} placeholder="Address" />

              <Input
                value={sLink}
                onChange={(e) => {
                  const v = e.target.value;
                  setSLink(v);
                  const parsed = parseLatLngFromLink(v);
                  if (parsed) {
                    setSLat(String(parsed.lat));
                    setSLng(String(parsed.lng));
                  }
                }}
                placeholder="Joylashuv linki (Google/Yandex) — paste qiling"
              />

              <div className="grid grid-cols-2 gap-2">
                <Input value={sLat} onChange={(e) => setSLat(e.target.value)} placeholder="Latitude" />
                <Input value={sLng} onChange={(e) => setSLng(e.target.value)} placeholder="Longitude" />
              </div>

              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium">Amenities (tanlang)</div>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => {
                    const active = sAmenityIds.includes(a.id);
                    return (
                      <Badge
                        key={a.id}
                        variant={active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleAmenity(a.id, sAmenityIds, setSAmenityIds)}
                      >
                        {a.name}
                      </Badge>
                    );
                  })}
                  {amenities.length === 0 ? <div className="text-sm text-slate-500">Avval amenity qo‘shing</div> : null}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Rasmlar</div>
                <Input type="file" multiple accept="image/*" onChange={(e) => setSFiles(Array.from(e.target.files || []))} />
              </div>

              <Button className="w-full" onClick={submitHostel}>
                Hostel yaratish
              </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Hozirgi hotel/hostellar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="font-medium mb-2">Hotels ({hotels.length})</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {hotels.map((h) => (
                  <Link key={h.id} to={`${basePath}/accommodations/hotel/${h.id}`} className="block">
                    <Card className="rounded-2xl hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="font-semibold">{h.name}</div>
                        <div className="text-sm text-slate-600">
                          {(h.city || '').trim()} {h.stars ? `• ${h.stars}★` : ''}
                        </div>
                        {h.address ? <div className="text-xs text-slate-500 mt-1">{h.address}</div> : null}
                        <div className="text-xs text-indigo-600 mt-2">Batafsil →</div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {loading || hotels.length ? null : <div className="text-sm text-slate-500">Hotel yo‘q</div>}
              </div>
            </div>

            <Separator />

            <div>
              <div className="font-medium mb-2">Hostels ({hostels.length})</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {hostels.map((h) => (
                  <Link key={h.id} to={`${basePath}/accommodations/hostel/${h.id}`} className="block">
                    <Card className="rounded-2xl hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="font-semibold">{h.name}</div>
                        <div className="text-sm text-slate-600">{(h.city || '').trim()}</div>
                        {h.address ? <div className="text-xs text-slate-500 mt-1">{h.address}</div> : null}
                        <div className="text-xs text-indigo-600 mt-2">Batafsil →</div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {loading || hostels.length ? null : <div className="text-sm text-slate-500">Hostel yo‘q</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
