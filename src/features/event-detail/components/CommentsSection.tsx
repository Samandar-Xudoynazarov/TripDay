import { useMemo, useState } from "react";
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { CommentItem } from "../types";

type Props = {
  comments: CommentItem[];
  loading?: boolean;
  onCreate: (text: string) => Promise<void> | void;
  onDelete: (commentId: number) => Promise<void> | void;
};

export default function CommentsSection({ comments, loading, onCreate, onDelete }: Props) {
  const { user } = useAuth();
  const [text, setText] = useState("");

  const canSend = useMemo(() => text.trim().length > 0 && !loading, [text, loading]);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Izohlar</h3>

      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? "Izoh yozing..." : "Izoh yozish uchun login qiling"}
            disabled={!user || loading}
          />
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (!user) return;
                const t = text.trim();
                if (!t) return;
                await onCreate(t);
                setText("");
              }}
              disabled={!user || !canSend}
            >
              Yuborish
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">Hali izohlar yo‘q.</div>
        ) : (
          comments.map((c) => (
            <Card key={c.id ?? Math.random()}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm">{c.text}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.createdAt ? format(new Date(c.createdAt), "PPpp") : ""}
                      {c.userId ? ` • userId: ${c.userId}` : ""}
                    </div>
                  </div>

                  {!!c.id && user && (user.id === c.userId) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(c.id!)}
                      disabled={loading}
                      title="O‘chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
