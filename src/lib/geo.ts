export function parseLatLngFromLink(link: string): { lat: number; lng: number } | null {
  const s = (link || "").trim();

  // Plain lat,lng
  let m = s.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };

  // Google @lat,lng
  m = s.match(/@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };

  // Google q=lat,lng
  m = s.match(/[?&]q=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };

  // Yandex ll=lng%2Clat
  m = s.match(/[?&]ll=(-?\d{1,3}\.\d+)%2C(-?\d{1,3}\.\d+)/);
  if (m) return { lat: Number(m[2]), lng: Number(m[1]) };

  // Yandex pt=lng,lat
  m = s.match(/[?&]pt=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return { lat: Number(m[2]), lng: Number(m[1]) };

  return null;
}