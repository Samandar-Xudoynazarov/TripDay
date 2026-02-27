import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type Props = {
  lat: number;
  lng: number;
  title: string;
  locationName: string;
};

export default function EventMap({ lat, lng, title, locationName }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <MapContainer center={[lat, lng]} zoom={13} style={{ height: 320, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold">{title}</div>
              <div className="text-sm">{locationName}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
