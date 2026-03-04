import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

/**
 * Optional realtime bridge.
 * Set VITE_WS_URL, e.g. ws://localhost:8080/ws
 * Backend may accept token via query (?token=...).
 */
export default function WebSocketBridge() {
  const { token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const base = import.meta.env.VITE_WS_URL as string | undefined;
    if (!base) return;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      try {
        const url = new URL(base);
        if (token) url.searchParams.set("token", token);

        const ws = new WebSocket(url.toString());
        wsRef.current = ws;

        ws.onopen = () => {
          retryRef.current = 0;
        };

        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            const msg = String(data?.message ?? "").trim();
            const type = String(data?.type ?? "").trim();
            toast(msg || type || "New update");
          } catch {
            const msg = String(ev.data ?? "").trim();
            if (msg) toast(msg);
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          const retry = Math.min(30000, 1000 * Math.pow(2, retryRef.current++));
          if (timerRef.current) window.clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(connect, retry) as any;
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch {}
        };
      } catch {
        // ignore
      }
    };

    connect();
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    };
  }, [token]);

  return null;
}
