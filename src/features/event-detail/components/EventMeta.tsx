import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin, Users, Building2 } from "lucide-react";
import { format } from "date-fns";

type Props = {
  title: string;
  description: string;
  locationName: string;
  eventDateTime: string;
  organizationName?: string;
  regCount?: number;
};

export default function EventMeta({
  title,
  description,
  locationName,
  eventDateTime,
  organizationName,
  regCount,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {organizationName && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{organizationName}</span>
          </div>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {locationName}
        </Badge>

        <Badge variant="secondary" className="gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {format(new Date(eventDateTime), "PPP")}
        </Badge>

        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3.5 w-3.5" />
          {format(new Date(eventDateTime), "HH:mm")}
        </Badge>

        <Badge variant="secondary" className="gap-1">
          <Users className="h-3.5 w-3.5" />
          {typeof regCount === "number" ? `${regCount} ta` : "—"}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4 text-sm">
          <div className="font-medium mb-1">Manzil</div>
          <div className="text-muted-foreground">{locationName}</div>
        </CardContent>
      </Card>
    </div>
  );
}
