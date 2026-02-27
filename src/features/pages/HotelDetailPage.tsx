import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { accommodationsApi , safeArray} from '@/lib/api';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import ImageSlider from "@/components/ImageSlider";

// Agar senga Leaflet allaqachon loyihada bo'lsa ishlaydi.
// Yo'q bo'lsa: pnpm add leaflet react-leaflet
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function pickImages(item: any): string[] {
  const imgs = item?.images || item?.imageUrls || item?.photos || item?.files;
  return Array.isArray(imgs) ? imgs.map(String) : [];
}

export default function HotelDetailPage() {
  const { id } = useParams();
  const hotelId = Number(id);

  const [all, setAll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    accommodationsApi
      .getHotels()
      .then((r) => {
        setAll(safeArray(r));
      })
      .finally(() => setLoading(false));
  }, []);

  const hotel = useMemo(() => all.find((x) => Number(x.id) === hotelId), [all, hotelId]);
  const images = useMemo(() => pickImages(hotel), [hotel]);

  if (loading) return <div className="p-6">Yuklanmoqda...</div>;
  if (!hotel) return <div className="p-6">Hotel topilmadi.</div>;

  const lat = Number(hotel.latitude);
  const lng = Number(hotel.longitude);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/hotels-hostels" className="text-sm text-indigo-600 hover:underline">
            ← Orqaga
          </Link>
          <Badge>Hotel</Badge>
        </div>

        <ImageSlider images={images} />

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">{hotel.name}</h1>
            <p className="text-slate-600">{hotel.description}</p>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              <span>{hotel.city || ""}</span>
              <span>•</span>
              <span>{hotel.address || ""}</span>
            </div>

            {hotel.stars ? <div className="text-sm text-slate-600">{hotel.stars}★</div> : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[420px]">
              <MapContainer center={[lat, lng]} zoom={14} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[lat, lng]}>
                  <Popup>{hotel.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}