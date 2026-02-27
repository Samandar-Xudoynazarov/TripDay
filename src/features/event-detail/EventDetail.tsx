import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from '@/lib/auth';
import EventImages from "./components/EventImages";
import EventMap from "./components/EventMap";
import LikeButton from "./components/LikeButton";
import CommentsSection from "./components/CommentsSection";
import EventMeta from "./components/EventMeta";
import { useEventDetail } from "./hooks/useEventDetail";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? Number(id) : undefined;

  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    event,
    images,
    regCount,
    registered,
    likeCount,
    comments,
    loading,
    regLoading,
    likeLoading,
    commentLoading,
    location,
    actions,
    setters,
    liked,
  } = useEventDetail(eventId, !!user);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border bg-white p-6 text-center">
          <div className="text-lg font-semibold mb-2">Tadbir topilmadi</div>
          <Button asChild variant="outline">
            <Link to="/events">Orqaga</Link>
          </Button>
        </div>
      </div>
    );
  }

  const onRegister = async () => {
    if (!user) return navigate("/login");
    try {
      await actions.register();
      toast.success("Muvaffaqiyatli ro‘yxatdan o‘tdingiz!");
      setters.setRegistered(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ro‘yxatdan o‘tishda xatolik");
    }
  };

  const onLike = async () => {
    if (!user) return navigate("/login");
    try {
      await actions.toggleLike();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Like’da xatolik");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link to="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Orqaga
            </Link>
          </Button>

          {registered ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Ro‘yxatdan o‘tilgan
            </div>
          ) : null}
        </div>

        <EventImages images={images} title={event.title} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">
            <EventMeta
              title={event.title}
              description={event.description}
              locationName={event.locationName}
              eventDateTime={event.eventDateTime}
              organizationName={event.organizationName}
              regCount={user ? regCount : undefined}
            />

            {!user && (
              <div className="rounded-xl border bg-white p-4 text-sm">
                Ro‘yxatdan o‘tganlar soni va ro‘yxatdan o‘tish uchun avval{" "}
                <Link className="text-indigo-600 underline" to="/login">
                  login
                </Link>{" "}
                qiling.
              </div>
            )}

            <CommentsSection
              comments={comments}
              loading={commentLoading}
              onCreate={actions.addComment}
              onDelete={actions.deleteComment}
            />
          </div>

          {/* RIGHT */}
          <div className="space-y-3">
            <div className="rounded-xl border bg-white p-4 space-y-3">
              <Button
                className="w-full"
                onClick={onRegister}
                disabled={regLoading || registered}
              >
                {registered
                  ? "Ro‘yxatdan o‘tilgan"
                  : regLoading
                  ? "Yuborilmoqda..."
                  : "Ro‘yxatdan o‘tish"}
              </Button>

              <LikeButton
                likeCount={likeCount}
                loading={likeLoading}
                onClick={onLike}
                liked={actions.liked} 
              />

              {/* ✅ MAP Like tagida */}
              {location && (
                <div className="rounded-xl border bg-gray-50 p-2">
                  <EventMap
                    lat={location.lat}
                    lng={location.lng}
                    title={event.title}
                    locationName={event.locationName}
                  />
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Like va izohlar uchun login bo‘lish kerak.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}