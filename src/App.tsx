import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import Guard from '@/components/Guard';

// ─── Pages (existing) ────────────────────────────────────────────────────────
import HomePage             from './pages/Home';
import LoginPage            from './pages/Login';
import RegisterPage         from './pages/Register';
import EventsPage           from './pages/Events';
import EventDetailPage      from './pages/EventDetail';
import HotelsPage           from './pages/Hotels';
import ProfilePage          from './pages/Profile';
import AdminPage            from './pages/Admin';
import AdminEventDetailPage from './pages/AdminEventDetail';
import DashboardPage        from './pages/Dashboard';
import NotFoundPage         from './pages/NotFound';

// ─── Feature pages (previously unused / not routed) ──────────────────────────
import ManagementFeature          from './features/pages/ManagementFeature';
import AdminAccommodationsFeature from './features/pages/AdminAccommodationsFeature';
import CalendarPageFeature        from './features/pages/CalendarPageFeature';
import MyRegistrationsFeature     from './features/pages/MyRegistrationsFeature';
import HotelDetailPage            from './features/pages/HotelDetailPage';
import HostelDetailPage           from './features/pages/HostelDetailPage';
import HotelsHostelsFeature       from './features/pages/HotelsHostelsFeature';
import AccommodationDetailFeature from './features/pages/AccommodationDetailFeature';

const ADMIN = ['ADMIN', 'SUPER_ADMIN'] as const;
const SUPER  = ['SUPER_ADMIN'] as const;

export default function App() {
  return (
    <AuthProvider>
      <Toaster theme="dark" position="bottom-right" />
      <BrowserRouter>
        <Routes>
          {/* ── Public ─────────────────────────────────────────────────── */}
          <Route path="/"            element={<HomePage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />
          <Route path="/events"      element={<EventsPage />} />
          <Route path="/events/:id"  element={<EventDetailPage />} />

          {/* Public accommodations list */}
          <Route path="/accommodations"          element={<HotelsHostelsFeature />} />
          <Route path="/accommodations/:type/:id" element={<AccommodationDetailFeature />} />
          <Route path="/hotels"                  element={<HotelsPage />} />
          <Route path="/hotels/:id"              element={<HotelDetailPage />} />
          <Route path="/hostels/:id"             element={<HostelDetailPage />} />

          {/* ── Auth required ──────────────────────────────────────────── */}
          <Route path="/profile"            element={<Guard><ProfilePage /></Guard>} />
          <Route path="/my-registrations"   element={<Guard><MyRegistrationsFeature /></Guard>} />

          {/* ── Tour Organization ──────────────────────────────────────── */}
          <Route path="/dashboard"          element={<Guard roles={['TOUR_ORGANIZATION']}><DashboardPage /></Guard>} />
          <Route path="/dashboard/calendar" element={<Guard roles={['TOUR_ORGANIZATION']}><CalendarPageFeature /></Guard>} />

          {/* ── Admin ──────────────────────────────────────────────────── */}
          <Route path="/admin"                          element={<Guard roles={[...ADMIN]}><AdminPage /></Guard>} />
          <Route path="/admin/events/:id"               element={<Guard roles={[...ADMIN]}><AdminEventDetailPage /></Guard>} />
          <Route path="/admin/management"               element={<Guard roles={[...ADMIN]}><ManagementFeature /></Guard>} />
          <Route path="/admin/accommodations"           element={<Guard roles={[...ADMIN]}><AdminAccommodationsFeature /></Guard>} />
          <Route path="/admin/accommodations/hotel/:id" element={<Guard roles={[...ADMIN]}><HotelDetailPage /></Guard>} />
          <Route path="/admin/accommodations/hostel/:id"element={<Guard roles={[...ADMIN]}><HostelDetailPage /></Guard>} />
          <Route path="/admin/calendar"                 element={<Guard roles={[...ADMIN]}><CalendarPageFeature /></Guard>} />

          {/* ── Super Admin ────────────────────────────────────────────── */}
          <Route path="/super-admin"                          element={<Guard roles={[...SUPER]}><AdminPage /></Guard>} />
          <Route path="/super-admin/events/:id"               element={<Guard roles={[...SUPER]}><AdminEventDetailPage /></Guard>} />
          <Route path="/super-admin/management"               element={<Guard roles={[...SUPER]}><ManagementFeature /></Guard>} />
          {/* Super admin sees accommodations but can't create (UI enforces this) */}
          <Route path="/super-admin/accommodations"           element={<Guard roles={[...SUPER]}><AdminAccommodationsFeature /></Guard>} />
          <Route path="/super-admin/accommodations/hotel/:id" element={<Guard roles={[...SUPER]}><HotelDetailPage /></Guard>} />
          <Route path="/super-admin/accommodations/hostel/:id"element={<Guard roles={[...SUPER]}><HostelDetailPage /></Guard>} />
          <Route path="/super-admin/calendar"                 element={<Guard roles={[...SUPER]}><CalendarPageFeature /></Guard>} />

          {/* ── 404 ────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
