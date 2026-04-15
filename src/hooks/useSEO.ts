/**
 * useSEO — har bir sahifa uchun dinamik meta teglarni o'rnatadi.
 * title, description, og:image, kalit so'zlar va JSON-LD structured data ni boshqaradi.
 * 3 tilda (uz, ru, en) va shaharlar bo'yicha kalit so'zlarni avtomatik qo'shadi.
 */

// Shaharlar va ular bilan bog'liq qidiruv iboralari (3 tilda)
const CITY_KEYWORDS = {
  uz: [
    'Toshkentda tadbirlar', 'Samarqandda tadbirlar', 'Buxoroda tadbirlar',
    'Namanganda tadbirlar', 'Andijondan tadbirlar', "Farg'onada tadbirlar",
    'Xivada tadbirlar', 'Qo\'qonda tadbirlar', 'Nukusda tadbirlar',
    'yaqin tadbirlar', 'bugungi tadbirlar', 'haftalik tadbirlar',
  ],
  ru: [
    'события в Ташкенте', 'события в Самарканде', 'события в Бухаре',
    'события в Намангане', 'события в Андижане', 'события в Фергане',
    'события в Хиве', 'события в Коканде', 'мероприятия Узбекистан',
    'ближайшие мероприятия', 'сегодняшние события', 'концерты Ташкент',
  ],
  en: [
    'events in Tashkent', 'events in Samarkand', 'events in Bukhara',
    'events in Namangan', 'events in Andijan', 'events in Fergana',
    'events in Uzbekistan', 'upcoming events Uzbekistan', 'concerts Tashkent',
    'things to do in Uzbekistan', 'festivals Uzbekistan', 'travel Uzbekistan',
  ],
};

// Saytning umumiy kalit so'zlari (3 tilda)
const BASE_KEYWORDS = [
  // O'zbek
  'tadbirlar', 'tadbir', 'konsert', 'festival', 'forum', "ko'rgazma", 'konferensiya',
  'seminar', 'sayohat', 'mehmonxona', 'hostel', "ro'yxatdan o'tish", 'tripday',
  // Rus
  'мероприятия', 'события', 'концерт', 'фестиваль', 'форум', 'выставка',
  'конференция', 'семинар', 'путешествие', 'гостиница', 'хостел', 'регистрация',
  // Ingliz
  'events', 'concert', 'festival', 'forum', 'exhibition', 'conference',
  'seminar', 'travel', 'hotel', 'hostel', 'registration', 'uzbekistan events',
];

interface SEOOptions {
  title: string;
  description?: string;
  /** Sahifaga xos qo'shimcha kalit so'zlar */
  extraKeywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'event';
  /** JSON-LD structured data (events uchun) */
  structuredData?: Record<string, any>;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setStructuredData(data: Record<string, any>) {
  const id = 'json-ld-structured';
  let el = document.getElementById(id) as HTMLScriptElement;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeStructuredData() {
  document.getElementById('json-ld-structured')?.remove();
}

export function useSEO(options: SEOOptions) {
  const siteUrl = 'https://tripday.uz';
  const siteName = 'TripDay';
  const defaultImg = `${siteUrl}/logo.png`;

  const fullTitle = options.title.includes(siteName)
    ? options.title
    : `${options.title} | ${siteName}`;
  const desc = options.description || 'Tadbirlar, mehmonxonalar va sayohatlarni kashf eting — barchasi bir platformada.';
  const img = options.image || defaultImg;
  const url = options.url || siteUrl;

  // Kalit so'zlarni birlashtirish: asosiy + shaharlar (3 tilda) + sahifaga xos
  const allKeywords = [
    ...BASE_KEYWORDS,
    ...CITY_KEYWORDS.uz,
    ...CITY_KEYWORDS.ru,
    ...CITY_KEYWORDS.en,
    ...(options.extraKeywords || []),
  ].join(', ');

  // <title>
  document.title = fullTitle;

  // Basic meta
  setMeta('description', desc);
  setMeta('keywords', allKeywords);
  setMeta('robots', 'index, follow');

  // Open Graph
  setMeta('og:title', fullTitle, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:image', img, 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:type', options.type || 'website', 'property');
  setMeta('og:site_name', siteName, 'property');

  // Twitter Card
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', fullTitle);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', img);

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;

  // JSON-LD structured data
  if (options.structuredData) {
    setStructuredData(options.structuredData);
  } else {
    removeStructuredData();
  }
}

/** Tadbir uchun JSON-LD structured data yaratadi (Google Rich Results) */
export function buildEventStructuredData(ev: {
  title: string;
  description?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  eventDateTime?: string;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  organizationName?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: ev.description || '',
    image: ev.imageUrl ? [ev.imageUrl] : [],
    startDate: ev.startDate || ev.eventDateTime || '',
    endDate: ev.endDate || ev.startDate || ev.eventDateTime || '',
    location: {
      '@type': 'Place',
      name: ev.locationName || 'Toshkent',
      address: {
        '@type': 'PostalAddress',
        addressLocality: ev.locationName || 'Toshkent',
        addressCountry: 'UZ',
      },
      ...(ev.latitude && ev.longitude
        ? { geo: { '@type': 'GeoCoordinates', latitude: ev.latitude, longitude: ev.longitude } }
        : {}),
    },
    organizer: ev.organizationName
      ? { '@type': 'Organization', name: ev.organizationName }
      : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };
}
