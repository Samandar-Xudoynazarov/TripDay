import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import type { OrgData } from "../helpers";

type Props = {
  orgs: OrgData[];
  pendingOrgs: OrgData[];
  basePath: string;
  onApprove: (orgId: number) => void;
  onOpenReject: (orgId: number) => void;
};

export default function OrgsTab({ orgs, pendingOrgs, basePath, onApprove, onOpenReject }: Props) {
  return (
    <div className="space-y-6">
      {pendingOrgs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            Kutilayotgan tashkilotlar ({pendingOrgs.length})
          </h3>
          <div className="space-y-3">
            {pendingOrgs.map((org) => (
              <Card key={org.id} className="border-0 shadow-sm border-l-4 border-l-amber-400">
                <CardContent className="p-5 flex items-center justify-between">
                  <Link to={`${basePath}/organizations/${org.id}`} className="min-w-0">
                    <h4 className="font-semibold text-gray-900 hover:underline truncate">{org.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{org.description}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {org.address} • {org.phone}
                    </p>
                    {org.rejectionReason && (
                      <p className="text-xs mt-1 text-red-600">Rad sababi: {org.rejectionReason}</p>
                    )}
                  </Link>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onApprove(org.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Tasdiqlash
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onOpenReject(org.id)}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Rad etish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Barcha tashkilotlar ({orgs.length})</h3>
        <div className="space-y-3">
          {orgs.map((org) => (
            <Card key={org.id} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <Link to={`${basePath}/organizations/${org.id}`} className="min-w-0">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    {org.name}
                    {org.verified ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                        Tasdiqlangan
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                        Kutilmoqda
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-gray-500">{org.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{org.address}</p>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
