import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CalendarDays, Home, LayoutDashboard, Shield,
  User, Building2, LogOut, Hotel, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

type NavItem = { label: string; to: string; icon: ReactNode };
type Props   = { title: string; items: NavItem[]; children: ReactNode };

function normalizeUrl(u: string) {
  const [path, search = ''] = u.split('?');
  return { path, search: search ? `?${search}` : '' };
}

function SidebarContent({ title, items, onClose }: { title: string; items: NavItem[]; onClose?: () => void }) {
  const loc = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <CalendarDays className="h-5 w-5 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs text-slate-400">Panel</div>
          <div className="font-semibold text-slate-900 truncate text-sm">{title}</div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition lg:hidden"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it) => {
          const itNorm  = normalizeUrl(it.to);
          const locNorm = { path: loc.pathname, search: loc.search || '' };

          const pathMatch  =
            locNorm.path === itNorm.path ||
            locNorm.path.startsWith(itNorm.path + '/');

          const queryMatch =
            itNorm.search ? locNorm.search === itNorm.search : true;

          const active = pathMatch && queryMatch;

          return (
            <Link key={it.to} to={it.to} className="block" onClick={onClose}>
              <Button
                variant={active ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-2 rounded-xl h-9 text-sm',
                  active && 'bg-indigo-600 hover:bg-indigo-700 text-white'
                )}
              >
                {it.icon}
                <span className="truncate">{it.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link to="/profile" onClick={onClose}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 rounded-xl h-9 text-sm"
          >
            <User className="h-4 w-4" />
            Profil
          </Button>
        </Link>

        <Button
          variant="ghost"
          className="w-full justify-start gap-2 rounded-xl h-9 text-sm text-red-600 hover:text-red-600 hover:bg-red-50"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </Button>

        {user?.email && (
          <div className="text-xs text-slate-400 px-2 pt-1 truncate">
            {user.email}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SidebarLayout({ title, items, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[260px] bg-white shadow-2xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent
          title={title}
          items={items}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      <div className="mx-auto max-w-7xl px-3 py-4 lg:px-3 lg:py-6">

        {/* Mobile topbar */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>

            <span className="font-semibold text-slate-800 truncate text-sm">
              {title}
            </span>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_1fr]">

          {/* Sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-4 h-fit">
            <Card className="rounded-2xl overflow-hidden border-slate-200 shadow-sm">
              <SidebarContent title={title} items={items} />
            </Card>
          </aside>

          {/* Main content */}
          <main className="min-w-0 w-full">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}

export const SidebarIcons = {
  Home: <Home className="h-4 w-4" />,
  Dashboard: <LayoutDashboard className="h-4 w-4" />,
  Admin: <Shield className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Org: <Building2 className="h-4 w-4" />,
  Calendar: <CalendarDays className="h-4 w-4" />,
  Users: <User className="h-4 w-4" />,
  Accommodations: <Hotel className="h-4 w-4" />,
};