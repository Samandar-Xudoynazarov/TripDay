import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImageSlider({ images }: { images: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
  }, [images?.length]);

  if (!images || images.length === 0) {
    return (
      <div className="h-80 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
        Rasm yo‘q
      </div>
    );
  }

  const prev = () => setI((p) => (p - 1 + images.length) % images.length);
  const next = () => setI((p) => (p + 1) % images.length);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <img src={images[i]} alt="" className="h-80 w-full object-cover" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent" />

      <div className="absolute inset-y-0 left-3 flex items-center">
        <Button variant="secondary" size="icon" className="rounded-full" onClick={prev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-3 flex items-center">
        <Button variant="secondary" size="icon" className="rounded-full" onClick={next}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs bg-black/50 text-white px-2 py-1 rounded-full">
        {i + 1}/{images.length}
      </div>
    </div>
  );
}