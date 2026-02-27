import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, LogOut } from "lucide-react";

type Props = {
  panelLabel: string;
  onLogout: () => void;
};

export default function AdminNavbar({ panelLabel, onLogout }: Props) {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">TripDay</span>
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 ml-2">{panelLabel}</Badge>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/events">
            <Button variant="ghost" size="sm">
              Tadbirlar
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-1" />
            Chiqish
          </Button>
        </div>
      </div>
    </nav>
  );
}
