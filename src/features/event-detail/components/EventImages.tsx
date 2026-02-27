import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL, publicImagesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Props = { images: string[]; title: string };

export default function EventImages({ images, title }: Props) {
  const [idx, setIdx] = useState(0);

  const rawCurrent = useMemo(() => {
    if (!images?.length) return "";
    return images[Math.min(idx, images.length - 1)] || "";
  }, [images, idx]);

  // Extract token if image url is like /i/{token} or .../i/{token}
  const imageToken = useMemo(() => {
    if (!rawCurrent) return null;
    const m = rawCurrent.match(/\/i\/([^/?#]+)/);
    return m?.[1] || null;
  }, [rawCurrent]);

  const current = useMemo(() => {
    if (!rawCurrent) return "";
    const raw = rawCurrent;
    // agar backend absolute url qaytarsa — o‘sha qoladi
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    // aks holda BACKEND_URL bilan ulab qo‘yamiz (ixtiyoriy)
    return BACKEND_URL ? `${BACKEND_URL}${raw}` : raw;
  }, [rawCurrent]);

  // Track image view via public endpoint (permitAll)
  useEffect(() => {
    if (!imageToken) return;
    publicImagesApi.view(imageToken).catch(() => {});
  }, [imageToken]);

  if (!images?.length) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-white">
      <img
        src={current}
        alt={title}
        className="h-[320px] w-full object-cover"
        loading="lazy"
      />

      {imageToken && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute left-3 bottom-3"
          onClick={async () => {
            try {
              await publicImagesApi.share(imageToken);
            } catch {
              // ignore
            }
            const link = `${window.location.origin}/i/${imageToken}`;
            try {
              await navigator.clipboard.writeText(link);
              toast.success("Rasm linki nusxalandi");
            } catch {
              toast.message("Link:", { description: link });
            }
          }}
        >
          Share
        </Button>
      )}

      {images.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-3 top-1/2 -translate-y-1/2"
            onClick={() => setIdx((v) => (v - 1 + images.length) % images.length)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={() => setIdx((v) => (v + 1) % images.length)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
            {idx + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}
