/**
 * lib/auth.tsx — Single unified auth provider
 *
 * Used by ALL components (both pages/* and features/*)
 * Exports: AuthProvider, useAuth, normalizeRoles, safeArr, api, noAuth, User
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── API Base ─────────────────────────────────────────────────────────────────
function resolveApiBase(): string {
  const rawApiBase = String(import.meta.env.VITE_API_BASE_URL || '').trim();
  const cleanApiBase = rawApiBase.split('#')[0].trim().replace(/\/$/, '');
  const backendUrl = String(import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '');
  const isBrowser = typeof window !== 'undefined';
  const isLocal = isBrowser
    ? ['localhost', '127.0.0.1'].includes(window.location.hostname)
    : false;

  if (cleanApiBase.startsWith('http://') || cleanApiBase.startsWith('https://')) {
    return cleanApiBase;
  }

  if (cleanApiBase && cleanApiBase !== '/api') {
    return cleanApiBase;
  }

  if (!isLocal && backendUrl) {
    return `${backendUrl}/api`;
  }

  return '/api';
}

export const API = resolveApiBase();

const api = axios.create({ baseURL: API });
const noAuth = axios.create({ baseURL: API });

// Prevent refresh storms (multiple 401s at once)
let refreshPromise: Promise<{ accessToken: string; refreshToken?: string }> | null = null;

// JWT request interceptor — tries 'accessToken' first (new), falls back to 'token' (old)
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  // Send current UI language so backend can return translated content if supported
  const lang = localStorage.getItem('lang') || 'uz';
  cfg.headers['Accept-Language'] = lang;
  return cfg;
});

// 401 refresh interceptor
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const rt = localStorage.getItem('refreshToken');
      if (rt) {
        try {
          // Use noAuth for refresh to avoid sending expired access token again
          if (!refreshPromise) {
            refreshPromise = noAuth
              .post('/auth/refresh', { refreshToken: rt })
              .then((res) => res.data)
              .finally(() => {
                refreshPromise = null;
              });
          }
          const data = await refreshPromise;
          const newToken = data?.accessToken;
          localStorage.setItem('accessToken', newToken);
          localStorage.setItem('token', newToken); // keep both keys in sync
          if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          orig.headers.Authorization = `Bearer ${newToken}`;
          return api(orig);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export { api, noAuth };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
  } catch { return null; }
}

function isJwtExpired(token: string, skewSeconds = 60): boolean {
  const p = parseJwt(token);
  const exp = Number((p as any)?.exp);
  if (!exp) return false; // best-effort
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
}

export function normalizeRoles(raw: any): string[] {
  if (!raw) return [];
  let roles: string[] = [];
  if (Array.isArray(raw)) roles = raw.map(String);
  else if (typeof raw === 'string') roles = raw.split(/[, ]+/).filter(Boolean);
  else if (Array.isArray(raw?.authorities)) roles = raw.authorities.map((a: any) => String(a?.authority ?? a));
  return [...new Set(roles.map(r => r.replace(/^ROLE_/, '')))];
}

export function safeArr<T = any>(res: any): T[] {
  const d = res?.data ?? res;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.content)) return d.content;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  return [];
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  roles: string[];
  enabled: boolean;
  organizationId?: number;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  verifyRegister: (email: string, code: string) => Promise<void>;
  logout: () => void;
  hasRole: (r: string) => boolean;
  /** Used by pages/* */ redirectPath: () => string;
  /** Used by features/* (alias for redirectPath) */ getRedirectPath: () => string;
}

const Ctx = createContext<AuthCtx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const t = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t) {
      setToken(t);
      if (u) {
        try {
          const p = JSON.parse(u);
          const fixed: User = {
            id: Number(p?.id ?? 0),
            fullName: String(p?.fullName ?? ''),
            email: String(p?.email ?? ''),
            phone: String(p?.phone ?? ''),
            country: String(p?.country ?? ''),
            roles: normalizeRoles(p?.roles ?? p?.authorities),
            enabled: Boolean(p?.enabled ?? true),
            organizationId: p?.organizationId !== undefined ? Number(p.organizationId) : undefined,
          };
          setUser(fixed);
          localStorage.setItem('user', JSON.stringify(fixed));
        } catch { localStorage.removeItem('user'); }
      }
    }
    setIsLoading(false);
  }, []);

  // Proactive refresh: keep user logged-in until refresh token expires.
  // Fixes the "qayta-qayta login" issue on reload.
  useEffect(() => {
    const run = async () => {
      const t = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const rt = localStorage.getItem('refreshToken');
      if (!t || !rt) return;
      if (!isJwtExpired(t)) return;
      try {
        const data = await noAuth.post('/auth/refresh', { refreshToken: rt }).then((r) => r.data);
        if (data?.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('token', data.accessToken);
          if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          setToken(data.accessToken);
        }
      } catch {
        // ignore; normal requests will redirect if needed
      }
    };
    run();
  }, []);

  const applyToken = useCallback((accessToken: string, emailFallback?: string) => {
    const p = parseJwt(accessToken) as any;
    const u: User = {
      id: Number(p?.userId ?? 0),
      fullName: String(p?.fullName ?? ''),
      email: String(p?.sub ?? emailFallback ?? ''),
      phone: String(p?.phone ?? ''),
      country: String(p?.country ?? ''),
      roles: normalizeRoles(p?.roles),
      enabled: true,
      organizationId: p?.organizationId !== undefined ? Number(p.organizationId) : undefined,
    };
    setUser(u);
    setToken(accessToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('token', accessToken); // keep both keys in sync
    localStorage.setItem('user', JSON.stringify(u));
  }, []);

  const login = useCallback(async (email: string) => {
    const e = email.trim().toLowerCase();
    try {
      const res = await api.post('/auth/login', { email: e });
      const { accessToken, refreshToken } = res.data ?? {};
      if (!accessToken) {
        const err: any = new Error('needsVerification');
        err.needsVerification = true;
        throw err;
      }
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      applyToken(accessToken, e);
    } catch (err: any) {
      if (err.response?.status === 400) {
        const e2: any = new Error('needsVerification');
        e2.needsVerification = true;
        throw e2;
      }
      throw err;
    }
  }, [applyToken]);

  const verify = useCallback(async (email: string, code: string) => {
    const res = await api.post('/auth/verify-login', { email: email.trim().toLowerCase(), code: code.replace(/\s/g, '').trim() });
    const { accessToken, refreshToken } = res.data ?? {};
    if (!accessToken) throw new Error('No accessToken in verify-login response');
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    applyToken(accessToken, email);
  }, [applyToken]);

  const verifyRegister = useCallback(async (email: string, code: string) => {
    const res = await api.post('/auth/verify-register', { email: email.trim().toLowerCase(), code: code.replace(/\s/g, '').trim() });
    const { accessToken, refreshToken } = res.data ?? {};
    if (!accessToken) throw new Error('No accessToken in verify-register response');
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    applyToken(accessToken, email);
  }, [applyToken]);

  const logout = useCallback(() => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) api.post('/auth/logout', { refreshToken: rt }).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  const hasRole = useCallback((r: string) => {
    return user?.roles?.includes(r.replace(/^ROLE_/, '')) ?? false;
  }, [user]);

  const redirectPath = useCallback((): string => {
    if (!user) return '/login';
    if (user.roles.includes('SUPER_ADMIN')) return '/super-admin';
    if (user.roles.includes('ADMIN')) return '/admin';
    if (user.roles.includes('TOUR_ORGANIZATION')) return '/dashboard';
    return '/';
  }, [user]);

  const ctx: AuthCtx = {
    user, token, isLoading,
    login, verify, verifyRegister, logout,
    hasRole, redirectPath,
    getRedirectPath: redirectPath, // alias for features/*
  };

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be inside AuthProvider');
  return c;
}
