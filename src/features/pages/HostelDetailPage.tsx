import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { accomSvc, safeArray } from '@/lib/api';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import ImageSlider from "@/components/ImageSlider";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function pickImages(item: any): string[] {
  const imgs = item?.images || item?.imageUrls || item?.photos || item?.files;
  return Array.isArray(imgs) ? imgs.map(String) : [];
}

export default function HostelDetailPage() {
  const { id } = useParams();
  const hostelId = Number(id);
  const [all, setAll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    accomSvc.getHostels()
      .then((r) => setAll(safeArray(r)))
      .finally(() => setLoading(false));
  }, []);

  const hostel = useMemo(() => all.find((x) => Number(x.id) === hostelId), [all, hostelId]);
  const images = useMemo(() => pickImages(hostel), [hostel]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );
  if (!hostel) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-600">Hostel topilmadi.</div>
    </div>
  );

  const lat = Number(hostel.latitude);
  const lng = Number(hostel.longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/hotels" className="text-sm text-indigo-600 hover:underline">← Orqaga</Link>
          <Badge variant="secondary">Hostel</Badge>
        </div>

        {images.length > 0 && <ImageSlider images={images} />}

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">{hostel.name}</h1>
            {hostel.description && <p className="text-slate-600">{hostel.description}</p>}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              <span>{hostel.city || ""}</span>
              {hostel.address && <><span>•</span><span>{hostel.address}</span></>}
            </div>
          </CardContent>
        </Card>

        {hasCoords && (
          <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[360px] sm:h-[420px]">
                <MapContainer center={[lat, lng]} zoom={14} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[lat, lng]}>
                    <Popup>{hostel.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
