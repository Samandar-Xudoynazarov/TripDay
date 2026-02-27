export interface OrgData {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  verified: boolean;
  rejectionReason?: string;
  ownerName?: string;
}

export interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  roles: any; // backend turli format qaytarishi mumkin
  enabled: boolean;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  locationName: string;
  eventDateTime: string;
  organizationName?: string;
}

/** Backend response array yoki {content: []} bo‘lishi mumkin */
export function toArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  // Axios/Backend ba'zan {data: []} qaytaradi
  if (Array.isArray(data?.data)) return data.data as T[];
  if (Array.isArray(data?.content)) return data.content as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  return [];
}

/** roles undefined/string/array/ROLE_ prefiksli bo‘lsa ham arrayga aylantiradi */
export function normalizeRoles(raw: any): string[] {
  if (!raw) return [];

  let roles: string[] = [];

  if (Array.isArray(raw)) {
    roles = raw.map((r) => String(r));
  } else if (typeof raw === "string") {
    // "ROLE_ADMIN,ROLE_USER" yoki "ROLE_ADMIN ROLE_USER" yoki "ADMIN"
    roles = raw.split(/[, ]+/).filter(Boolean);
  } else if (Array.isArray(raw?.authorities)) {
    // Spring Security: [{authority:"ROLE_ADMIN"}]
    roles = raw.authorities.map((a: any) => String(a?.authority ?? a));
  }

  roles = roles.map((r) => r.replace(/^ROLE_/, ""));
  return Array.from(new Set(roles));
}

/** ✅ Vaqti o‘tib ketgan eventlarni ko‘rsatmaslik uchun */
export function isFutureEvent(eventDateTime: string | Date): boolean {
  const d = eventDateTime instanceof Date ? eventDateTime : new Date(eventDateTime);
  if (Number.isNaN(+d)) return true; // agar sana yaroqsiz bo‘lsa, yashirmaymiz
  return +d >= Date.now();
}

export function onlyFutureEvents<T extends { eventDateTime: string }>(arr: T[]): T[] {
  return (arr || []).filter((e) => isFutureEvent(e.eventDateTime));
}
