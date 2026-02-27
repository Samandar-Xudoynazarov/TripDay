import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { OrgData } from "../types";

export default function OrgSummaryCard({ org }: { org: OrgData }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          {org.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-muted-foreground">{org.description}</div>
        <div><span className="font-medium">Manzil:</span> {org.address}</div>
        <div><span className="font-medium">Telefon:</span> {org.phone}</div>
        <div className="pt-2">
          {org.verified ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">Tasdiqlangan</Badge>
          ) : (
            <Badge variant="destructive">Tasdiqlanmagan</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
