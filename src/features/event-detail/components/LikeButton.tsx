import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  likeCount: number;
  loading?: boolean;
  onClick: () => void;
  liked?: boolean; // 🔥 qo‘shildi
};

export default function LikeButton({
  likeCount,
  loading,
  onClick,
  liked,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full border rounded-lg py-2 hover:bg-gray-50 transition"
    >
      <Heart
        className={cn(
          "h-5 w-5 transition",
          liked ? "fill-red-500 text-red-500" : "text-gray-500"
        )}
      />
      <span className="text-sm font-medium">{likeCount}</span>
    </button>
  );
}