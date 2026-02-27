/**
 * lib/api.ts  –  Unified API layer
 *
 * Feature pages import either:
 *   - Old style: orgsSvc, adminSvc, usersSvc, eventsSvc, accomSvc …
 *   - New style: accommodationsApi, eventsApi, managementApi, registrationsApi …
 *
 * This file exports BOTH so nothing breaks.
 * Role notes:
 *   managementApi.getAdmins / getSuperAdmins  → SUPER_ADMIN only
 *   accomSvc.createHotel / createHostel       → ADMIN only (not SUPER_ADMIN)
 *   adminSvc.*                                → ADMIN + SUPER_ADMIN
 */

import { api, safeArr } from './auth';

// ─── safeArray alias ─────────────────────────────────────────────────────────
export function safeArray<T = any>(res: any): T[] { return safeArr<T>(res); }

// ─── URL helpers ──────────────────────────────────────────────────────────────
export const BACKEND     = import.meta.env.VITE_BACKEND_URL || '';
export const BACKEND_URL = BACKEND;

export function imgUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND}${path}`;
}
export function pickImages(item: any): string[] {
  const arr = item?.images || item?.imageUrls || item?.photos || item?.files || [];
  return Array.isArray(arr) ? arr.map(String) : [];
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════════════════════
export const authSvc = {
  login:          (email: string) => api.post('/auth/login', { email: email.trim().toLowerCase() }),
  verify:         (email: string, code: string) => api.post('/auth/verify-login',    { email: email.trim().toLowerCase(), code: code.replace(/\s/g,'').trim() }),
  verifyRegister: (email: string, code: string) => api.post('/auth/verify-register', { email: email.trim().toLowerCase(), code: code.replace(/\s/g,'').trim() }),
  register:       (data: any)      => api.post('/auth/register', data),
  logout:         (rt: string)     => api.post('/auth/logout', { refreshToken: rt }),
  forceLogout:    (userId: number) => api.post(`/auth/force-logout/${userId}`),
};
export const authApi = {
  login:         (email: string) => api.post('/auth/login', { email: email.trim().toLowerCase() }),
  verifyLogin:   (email: string, code: string) => api.post('/auth/verify-login',    { email: email.trim().toLowerCase(), code: code.replace(/\s/g,'').trim() }),
  verifyRegister:(email: string, code: string) => api.post('/auth/verify-register', { email: email.trim().toLowerCase(), code: code.replace(/\s/g,'').trim() }),
  refresh:       (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout:        (refreshToken: string) => api.post('/auth/logout',  { refreshToken }),
  forceLogout:   (userId: number) => api.post(`/auth/force-logout/${userId}`),
};

// ═════════════════════════════════════════════════════════════════════════════
// USERS
// ═════════════════════════════════════════════════════════════════════════════
export const usersSvc = {
  getAll:            () => api.get('/users').then(r => safeArr(r)),
  getById:           (id: number) => api.get(`/users/${id}`).then(r => r.data),
  createDirect:      (data: any) => api.post('/users', data),
  createViaRegister: (data: any) => api.post('/auth/register', data),
  update:            (id: number, data: any) => api.put(`/users/${id}`, data),
  delete:            (id: number) => api.delete(`/users/${id}`),
  setEnabled:        (id: number, enabled: boolean) => api.patch(`/users/${id}/enabled?enabled=${enabled}`),
};
export const usersApi = {
  getAll:            () => api.get('/users'),
  getById:           (id: number) => api.get(`/users/${id}`),
  createDirect:      (data: any) => api.post('/users', data),
  createViaRegister: (data: any) => api.post('/auth/register', data),
  update:            (id: number, data: any) => api.put(`/users/${id}`, data),
  delete:            (id: number) => api.delete(`/users/${id}`),
  setEnabled:        (id: number, enabled: boolean) => api.patch(`/users/${id}/enabled?enabled=${enabled}`),
};

// ═════════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS
// ═════════════════════════════════════════════════════════════════════════════
export const orgsSvc = {
  getAll:      () => api.get('/organizations').then(r => safeArr(r)),
  getVerified: () => api.get('/organizations/verified').then(r => safeArr(r)),
  getById:     (id: number) => api.get(`/organizations/${id}`).then(r => r.data),
  create:      (data: any) => api.post('/organizations', data),
  update:      (id: number, data: any) => api.put(`/organizations/${id}`, data),
  delete:      (id: number) => api.delete(`/organizations/${id}`),
};
export const orgsApi = {
  getAll:      () => api.get('/organizations'),
  getById:     (id: number) => api.get(`/organizations/${id}`),
  getVerified: () => api.get('/organizations/verified'),
  create:      (data: any) => api.post('/organizations', data),
  update:      (id: number, data: any) => api.put(`/organizations/${id}`, data),
  delete:      (id: number) => api.delete(`/organizations/${id}`),
};

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN  (ADMIN + SUPER_ADMIN)
// ═════════════════════════════════════════════════════════════════════════════
export const adminSvc = {
  approveOrg:    (id: number) => api.post(`/admin/organizations/${id}/approve`),
  rejectOrg:     (id: number, reason: string) => api.post(`/admin/organizations/${id}/reject?reason=${encodeURIComponent(reason)}`),
  makeAdmin:     (userId: number) => api.post(`/admin/users/${userId}/make-admin`),
  makeTour:      (userId: number) => api.post(`/admin/users/${userId}/make-tour`),
  pendingEvents: () => api.get('/admin/events/pending').then(r => safeArr(r)),
  approveEvent:  (id: number) => api.post(`/admin/events/${id}/approve`),
  rejectEvent:   (id: number, reason: string) => api.post(`/admin/events/${id}/reject?reason=${encodeURIComponent(reason)}`),
};
export const adminOrgsApi   = { approve: (id: number) => api.post(`/admin/organizations/${id}/approve`), reject: (id: number, reason: string) => api.post(`/admin/organizations/${id}/reject?reason=${encodeURIComponent(reason)}`) };
export const adminEventsApi = { pending: () => api.get('/admin/events/pending'), approve: (id: number) => api.post(`/admin/events/${id}/approve`), reject: (id: number, reason: string) => api.post(`/admin/events/${id}/reject?reason=${encodeURIComponent(reason)}`) };
export const superAdminApi  = { makeAdmin: (userId: number) => api.post(`/admin/users/${userId}/make-admin`) };
export const adminUsersApi  = { makeTourOrganization: (userId: number) => api.post(`/admin/users/${userId}/make-tour`), makeTour: (userId: number) => api.post(`/admin/users/${userId}/make-tour`) };

// ═════════════════════════════════════════════════════════════════════════════
// MANAGEMENT
//   getUsers / getTourOrganizations → ADMIN + SUPER_ADMIN
//   getAdmins / getSuperAdmins      → SUPER_ADMIN only
// ═════════════════════════════════════════════════════════════════════════════
export const mgmtSvc = {
  getUsers:      () => api.get('/management/users').then(r => safeArr(r)),
  getTour:       () => api.get('/management/tour-organizations').then(r => safeArr(r)),
  getAdmins:     () => api.get('/management/admins').then(r => safeArr(r)),
  getSuperAdmins:() => api.get('/management/super-admins').then(r => safeArr(r)),
};
export const managementApi = {
  getUsers:             () => api.get('/management/users'),
  getTourOrganizations: () => api.get('/management/tour-organizations'),
  getAdmins:            () => api.get('/management/admins'),
  getSuperAdmins:       () => api.get('/management/super-admins'),
};

// ═════════════════════════════════════════════════════════════════════════════
// EVENTS
// ═════════════════════════════════════════════════════════════════════════════
export const eventsSvc = {
  getAll:    () => api.get('/events').then(r => safeArr(r)),
  getById:   (id: number) => api.get(`/events/${id}`).then(r => r.data),
  getMy:     () => api.get('/events/my').then(r => safeArr(r)),
  getUpcoming: async () => {
    const all = await api.get('/events').then(r => safeArr(r));
    const now = Date.now();
    return all.filter((e: any) => { const d = +new Date(e.eventDateTime); return !isNaN(d) && d >= now; })
              .sort((a: any, b: any) => +new Date(a.eventDateTime) - +new Date(b.eventDateTime));
  },
  create: (data: any) => {
    if (data instanceof FormData) return api.post('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    const form = new FormData();
    ['title','description','locationName','eventDateTime'].forEach(k => form.append(k, data[k]));
    form.append('latitude',       String(data.latitude));
    form.append('longitude',      String(data.longitude));
    form.append('organizationId', String(data.organizationId));
    (data.files || []).forEach((f: File) => form.append('files', f));
    return api.post('/events', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update:       (id: number, data: any) => api.put(`/events/${id}`, data),
  delete:       (id: number) => api.delete(`/events/${id}`),
  getImages:    (id: number) => api.get(`/events/${id}/images`).then(r => safeArr(r)),
  uploadImages: (eventId: number, files: File[]) => {
    const form = new FormData(); files.forEach(f => form.append('files', f));
    return api.post(`/events/${eventId}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
export const eventsApi = {
  getAll:  () => api.get('/events'),
  getById: (id: number) => api.get(`/events/${id}`),
  getMy:   () => api.get('/events/my'),
  getUpcoming: () => api.get('/events').then(res => {
    const now = new Date();
    const list = Array.isArray(res.data) ? res.data : [];
    return { ...res, data: list.filter((e: any) => { const d = e?.eventDateTime ? new Date(e.eventDateTime) : null; return d && !isNaN(+d) && d >= now; }).sort((a: any, b: any) => +new Date(a.eventDateTime) - +new Date(b.eventDateTime)) };
  }),
  create: (data: { title: string; description: string; locationName: string; latitude: number; longitude: number; eventDateTime: string; organizationId: number; files?: File[] }) => {
    const form = new FormData();
    form.append('title', data.title); form.append('description', data.description); form.append('locationName', data.locationName);
    form.append('latitude', String(data.latitude)); form.append('longitude', String(data.longitude));
    form.append('eventDateTime', data.eventDateTime); form.append('organizationId', String(data.organizationId));
    (data.files || []).forEach(f => form.append('files', f));
    return api.post('/events', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (id: number, data: Record<string, unknown>) => api.put(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
};
export const eventImagesApi = {
  upload:    (eventId: number, files: File[]) => { const form = new FormData(); files.forEach(f => form.append('files', f)); return api.post(`/events/${eventId}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  getImages: (eventId: number) => api.get(`/events/${eventId}/images`),
};

// ═════════════════════════════════════════════════════════════════════════════
// REGISTRATIONS
// ═════════════════════════════════════════════════════════════════════════════
export const regsSvc = {
  register:        (eventId: number) => api.post(`/registrations?eventId=${eventId}`),
  getAll:          () => api.get('/registrations').then(r => safeArr(r)),
  getById:         (id: number) => api.get(`/registrations/${id}`).then(r => r.data),
  getByUser:       (userId: number) => api.get(`/registrations/user/${userId}`).then(r => safeArr(r)),
  getCountByEvent: (eventId: number) => api.get(`/registrations/event/${eventId}/count`).then(r => r.data),
  delete:          (id: number) => api.delete(`/registrations/${id}`),
};
export const registrationsApi = {
  register:        (eventId: number) => api.post(`/registrations?eventId=${eventId}`),
  getAll:          () => api.get('/registrations'),
  getById:         (id: number) => api.get(`/registrations/${id}`),
  getByUser:       (userId: number) => api.get(`/registrations/user/${userId}`),
  getCountByEvent: (eventId: number) => api.get(`/registrations/event/${eventId}/count`),
  delete:          (id: number) => api.delete(`/registrations/${id}`),
};

// ═════════════════════════════════════════════════════════════════════════════
// LIKES / COMMENTS
// ═════════════════════════════════════════════════════════════════════════════
export const likesSvc  = { toggle: (eventId: number) => api.post(`/events/${eventId}/like`), count: (eventId: number) => api.get(`/events/${eventId}/likes`).then(r => r.data) };
export const likesApi  = { toggle: (eventId: number) => api.post(`/events/${eventId}/like`), count: (eventId: number) => api.get(`/events/${eventId}/likes`) };
export const commentsSvc = {
  getAll: (eventId: number) => api.get(`/events/${eventId}/comments`).then(r => safeArr(r)),
  create: (eventId: number, text: string) => api.post(`/events/${eventId}/comments`, { text }),
  delete: (commentId: number) => api.delete(`/events/comments/${commentId}`),
};
export const commentsApi = {
  getAll: (eventId: number) => api.get(`/events/${eventId}/comments`),
  create: (eventId: number, text: string) => api.post(`/events/${eventId}/comments`, { text }),
  delete: (commentId: number) => api.delete(`/events/comments/${commentId}`),
};

// ═════════════════════════════════════════════════════════════════════════════
// ACCOMMODATIONS
//   createHotel / createHostel → ADMIN only (not SUPER_ADMIN)
// ═════════════════════════════════════════════════════════════════════════════
function buildHotelForm(data: any): FormData {
  const form = new FormData();
  ['name','description','city','address'].forEach(k => form.append(k, data[k]));
  form.append('latitude', String(data.latitude)); form.append('longitude', String(data.longitude));
  if (data.stars !== undefined) form.append('stars', String(data.stars));
  (data.amenityIds || []).forEach((id: number) => form.append('amenityIds', String(id)));
  (data.files || []).forEach((f: File) => form.append('files', f));
  return form;
}

export const accomSvc = {
  getHotels:   () => api.get('/accommodations/hotels').then(r => safeArr(r)),
  getHostels:  () => api.get('/accommodations/hostels').then(r => safeArr(r)),
  createHotel: (data: any) => api.post('/accommodations/hotel',  buildHotelForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }),
  createHostel:(data: any) => api.post('/accommodations/hostel', buildHotelForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }),
};
export const accommodationsApi = {
  getHotels:   () => api.get('/accommodations/hotels'),
  getHostels:  () => api.get('/accommodations/hostels'),
  createHotel: (data: any) => api.post('/accommodations/hotel',  buildHotelForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }),
  createHostel:(data: any) => api.post('/accommodations/hostel', buildHotelForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ═════════════════════════════════════════════════════════════════════════════
// AMENITIES
// ═════════════════════════════════════════════════════════════════════════════
export const amenitiesSvc = { getAll: () => api.get('/amenities').then(r => safeArr(r)), create: (name: string) => api.post(`/amenities?name=${encodeURIComponent(name)}`), delete: (id: number) => api.delete(`/amenities/${id}`) };
export const amenitiesApi = { getAll: () => api.get('/amenities'), create: (name: string) => api.post(`/amenities?name=${encodeURIComponent(name)}`), delete: (id: number) => api.delete(`/amenities/${id}`) };

// ═════════════════════════════════════════════════════════════════════════════
// HOSTEL REVIEWS
// ═════════════════════════════════════════════════════════════════════════════
export const reviewsSvc = {
  list:    (hostelId: number) => api.get(`/hostels/${hostelId}/reviews`).then(r => safeArr(r)),
  average: (hostelId: number) => api.get(`/hostels/${hostelId}/reviews/average`).then(r => r.data),
  count:   (hostelId: number) => api.get(`/hostels/${hostelId}/reviews/count`).then(r => r.data),
  create:  (hostelId: number, rating: number, comment: string) => api.post(`/hostels/${hostelId}/reviews?rating=${encodeURIComponent(String(rating))}&comment=${encodeURIComponent(comment)}`),
};
export const hostelReviewsApi = {
  list:    (hostelId: number) => api.get(`/hostels/${hostelId}/reviews`),
  average: (hostelId: number) => api.get(`/hostels/${hostelId}/reviews/average`),
  count:   (hostelId: number) => api.get(`/hostels/${hostelId}/reviews/count`),
  create:  (hostelId: number, rating: number, comment: string) => api.post(`/hostels/${hostelId}/reviews?rating=${encodeURIComponent(String(rating))}&comment=${encodeURIComponent(comment)}`),
};

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC IMAGE STATS
// ═════════════════════════════════════════════════════════════════════════════
export const publicImagesSvc = { view: (token: string) => api.get(`/i/${token}`), share: (token: string) => api.post(`/i/${token}/share`) };
export const publicImagesApi = { view: (token: string) => api.get(`/i/${token}`), share: (token: string) => api.post(`/i/${token}/share`) };

export default api;
