# TripDay — Event Ticketing Platform

React + TypeScript + Vite frontend for the TripDay platform.

## Tech Stack
- **Framework:** React 18 + TypeScript
- **Build:** Vite 5
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + custom CSS variables
- **HTTP:** Axios
- **Maps:** React Leaflet
- **UI Components:** Radix UI + shadcn/ui
- **Charts:** Recharts
- **Toast:** Sonner

## Project Structure
```
src/
├── components/       # Shared components (Navbar, Shell, Guard, ...)
│   ├── layout/       # SidebarLayout for feature pages
│   └── ui/           # Radix/shadcn UI primitives
├── features/         # Feature modules
│   ├── admin-panel/  # Admin panel components
│   ├── event-detail/ # Event detail page components
│   ├── org-dashboard/# Organization dashboard components
│   └── pages/        # Feature page components (routed in App.tsx)
├── hooks/            # Custom hooks
├── lib/
│   ├── api.ts        # Unified API layer (all endpoints)
│   ├── auth.tsx      # Auth context + provider (single source of truth)
│   ├── geo.ts        # Geo utilities
│   └── utils.ts      # Tailwind merge utility
├── pages/            # Legacy pages (Home, Events, Login, etc.)
└── App.tsx           # Routes
```

## Environment Variables
```env
VITE_API_BASE_URL=/api               # API base path (use /api for proxy)
VITE_BACKEND_URL=http://host:8081    # Backend URL (for static assets)
VITE_API_PROXY_TARGET=http://host:8081  # Vite dev proxy target
```

Copy `.env.example` to `.env` and fill in your values.

## Development
```bash
pnpm install
pnpm dev
```

## Build (for Netlify)
```bash
pnpm build
```

Netlify config is in `netlify.toml`. SPA redirects in `public/_redirects`.

## Roles
| Role | Access |
|------|--------|
| User | Public pages, events, profile |
| TOUR_ORGANIZATION | + Dashboard, create events |
| ADMIN | + Admin panel, approve orgs/events, manage accommodations |
| SUPER_ADMIN | + Management (user roles), full access |
