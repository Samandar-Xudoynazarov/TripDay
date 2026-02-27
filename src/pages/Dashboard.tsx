import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { orgsSvc, eventsSvc } from "@/lib/api";
import Shell from "@/components/Shell";
import { toast } from "sonner";
import {
  Ticket,
  Building2,
  Clock,
  Trash2,
  Eye,
  CheckCircle,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";

import CreateEventDialog from "@/components/CreateEventDialog"; // o'zingdagi pathga mos

type CreateEventPayload = {
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  eventDateTime: string; // "YYYY-MM-DDTHH:mm:ss"
  organizationId: number;
  files: File[];
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const nav = useNavigate();

  const [org, setOrg] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const items = [
    { label: "Dashboard", to: "/dashboard", icon: "dashboard" },
    { label: "Tadbirlar", to: "/events", icon: "events" },
    { label: "Bosh sahifa", to: "/", icon: "home" },
  ];

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      nav("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const [orgs, evs] = await Promise.all([
        orgsSvc.getAll(),
        eventsSvc.getMy(),
      ]);
      const arr = Array.isArray(orgs) ? orgs : [];
      const myOrg =
        arr.find((o: any) => o.userId === user?.id || o.ownerId === user?.id) ||
        arr[0] ||
        null;

      setOrg(myOrg);
      setEvents(Array.isArray(evs) ? evs : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const createOrg = async () => {
    const name = prompt("Tashkilot nomi:");
    if (!name) return;

    const description = prompt("Tavsif:") || "";
    const address = prompt("Manzil:") || "";
    const phone = prompt("Telefon:") || "";

    await orgsSvc.create({ name, description, address, phone });
    toast.success("Tashkilot yaratildi! Admin tasdiqlashini kuting.");
    load();
  };

  // ✅ CreateEventDialog uchun handler
  const onCreateEvent = async (payload: CreateEventPayload) => {
    if (!org) {
      toast.error("Avval tashkilot yarating");
      return;
    }

    // ✅ FINAL GUARD (backendga ketishidan oldin)
    if (
      !Number.isFinite(payload.latitude) ||
      !Number.isFinite(payload.longitude)
    ) {
      toast.error("Latitude/Longitude noto‘g‘ri (undefined/NaN).");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("title", payload.title);
      fd.append("description", payload.description);
      fd.append("locationName", payload.locationName);

      // ✅ endi "undefined" ketmaydi
      fd.append("latitude", String(payload.latitude));
      fd.append("longitude", String(payload.longitude));

      fd.append("eventDateTime", payload.eventDateTime);
      fd.append("organizationId", String(org.id));

      payload.files.forEach((f) => fd.append("files", f));

      await eventsSvc.create(fd as any);

      toast.success("Tadbir yaratildi! Admin tasdiqlashini kuting.");
      await load();
    } catch (er: any) {
      toast.error(er?.response?.data?.message || "Xatolik");
      throw er;
    }
  };

  const deleteEvent = async (id: number) => {
    if (!confirm("Tadbirni o'chirasizmi?")) return;
    await eventsSvc.delete(id);
    setEvents((p) => p.filter((e) => e.id !== id));
    toast.success("O'chirildi");
  };

  if (loading) {
    return (
      <Shell items={items} title="Dashboard">
        <div className="flex items-center justify-center min-h-[100vh]">
          <div className="spinner" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell items={items} title="Dashboard">
      <div style={{ padding: "28px", minHeight: "100vh" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: "var(--text)",
                marginBottom: 4,
              }}
            >
              Tashkilotchi panel
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Tadbirlaringizni boshqaring
            </p>
          </div>

          {/* ✅ eski modal button o‘rniga Dialog */}
          {org ? (
            <CreateEventDialog
              disabled={!org?.verified}
              organizationId={org.id}
              onCreate={onCreateEvent}
            />
          ) : null}
        </div>

        {/* Org card */}
        {!org ? (
          <div
            className="card anim-up"
            style={{ padding: "32px", textAlign: "center", marginBottom: 24 }}
          >
            <Building2
              size={40}
              style={{ margin: "0 auto 14px", opacity: 0.3 }}
            />
            <h3
              style={{
                fontFamily: "Syne,sans-serif",
                fontSize: 18,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              Tashkilot yo'q
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 16,
              }}
            >
              Tadbir yaratish uchun avval tashkilot yarating
            </p>
            <button className="btn btn-primary" onClick={createOrg}>
              Tashkilot yaratish
            </button>
          </div>
        ) : (
          <div
            className="card anim-up"
            style={{
              padding: "20px 22px",
              marginBottom: 24,
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg,var(--accent),var(--accent2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Syne,sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {(org.name || "O")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "var(--text)",
                  marginBottom: 4,
                }}
              >
                {org.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {org.address}
              </div>
            </div>
            {org.verified ? (
              <span className="tag tag-green">
                <CheckCircle size={11} />
                Tasdiqlangan
              </span>
            ) : (
              <span className="tag tag-yellow">
                <Clock size={11} />
                Admin tasdiqlashi kutilmoqda
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          {[
            {
              val: events.length,
              label: "Jami tadbirlar",
              icon: <Ticket size={18} />,
              c: "var(--accent)",
            },
            {
              val: events.filter((e) => {
                const s = String(e.status || "").toUpperCase();
                return (
                  ["APPROVED", "PUBLISHED", "ACTIVE"].includes(s) || e.approved
                );
              }).length,
              label: "Tasdiqlangan",
              icon: <CheckCircle size={18} />,
              c: "#4ade80",
            },
            {
              val: events.filter((e) => {
                const s = String(e.status || "").toUpperCase();
                return (
                  s === "PENDING" || s === "" || (!e.approved && !e.published)
                );
              }).length,
              label: "Kutilmoqda",
              icon: <Clock size={18} />,
              c: "#fbbf24",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: "18px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="stat-top" />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: `${s.c}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.c,
                  }}
                >
                  {s.icon}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 800,
                  fontSize: 26,
                  color: s.c,
                  marginBottom: 4,
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Events list */}
        <div className="card">
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--text)",
              }}
            >
              Mening tadbirlarim
            </span>
          </div>

          {events.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <CalendarDays
                size={36}
                style={{ margin: "0 auto 12px", opacity: 0.25 }}
              />
              <p>Hali tadbir yo'q</p>
            </div>
          ) : (
            events.map((ev) => {
              const d = new Date(ev.eventDateTime);
              const s = String(ev.status || "").toUpperCase();
              const approved =
                ["APPROVED", "PUBLISHED", "ACTIVE"].includes(s) || ev.approved;

              return (
                <div
                  key={ev.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--text)",
                        marginBottom: 4,
                      }}
                    >
                      {ev.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        display: "flex",
                        gap: 12,
                      }}
                    >
                      {!isNaN(d.getTime()) && (
                        <span>
                          <CalendarDays
                            size={11}
                            style={{
                              display: "inline",
                              verticalAlign: "middle",
                              marginRight: 3,
                            }}
                          />
                          {format(d, "dd MMM yyyy")}
                        </span>
                      )}
                      <span>{ev.locationName}</span>
                    </div>
                  </div>

                  <span
                    className={`tag ${approved ? "tag-green" : "tag-yellow"}`}
                    style={{ whiteSpace: "nowrap", fontSize: 10 }}
                  >
                    {approved ? "Tasdiqlangan" : "Kutilmoqda"}
                  </span>

                  <div style={{ display: "flex", gap: 6 }}>
                    <Link
                      to={`/events/${ev.id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ textDecoration: "none", padding: "6px 10px" }}
                    >
                      <Eye size={13} />
                    </Link>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: "6px 10px" }}
                      onClick={() => deleteEvent(ev.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Shell>
  );
}
