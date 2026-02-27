import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Trash2, Users } from "lucide-react";

type EventItem = {
  id: number;
  title: string;
  eventDateTime: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
};

type Props = {
  events: EventItem[];
  stats: Record<number, { likes: number; comments: number; regsCount: number }>;
  onOpenRegs: (e: EventItem) => void;
  onDelete: (id: number) => void;
};

export default function MyEventsList({ events, stats, onOpenRegs, onDelete }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mening eventlarim</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground">Hali event yo‘q.</div>
        ) : (
          events.map((e) => {
            const s = stats[e.id] ?? { likes: 0, comments: 0, regsCount: 0 };
            const canEditDelete = e.status !== "APPROVED"; // backend qoidaga mos

            return (
              <div key={e.id} className="border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{e.eventDateTime}</div>
                  </div>

                  <Badge
                    variant={
                      e.status === "APPROVED"
                        ? "default"
                        : e.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {e.status ?? "PENDING"}
                  </Badge>
                </div>

                {e.status === "REJECTED" && e.rejectionReason ? (
                  <div className="text-xs text-red-600">Sabab: {e.rejectionReason}</div>
                ) : null}

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">❤️ {s.likes}</Badge>
                  <Badge variant="outline">💬 {s.comments}</Badge>
                  <Badge variant="outline">🧾 {s.regsCount}</Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/events/${e.id}`}>
                    <Button variant="outline" size="sm">
                      Event ichiga kirish
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenRegs(e)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Ro‘yxatdan o‘tganlar
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!canEditDelete}
                    onClick={() => onDelete(e.id)}
                    title={!canEditDelete ? "Admin tasdiqlagan (APPROVED) eventni o‘chirish backendda taqiqlangan" : ""}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    O‘chirish
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}