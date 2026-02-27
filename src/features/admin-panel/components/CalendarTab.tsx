import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import type { EventItem } from "../helpers";

type Props = {
  allEvents: EventItem[];
  calMonth: Date;
  setCalMonth: (d: Date) => void;
  onOpenEvent: (eventId: number) => void;
};

const WEEKDAYS = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];

export default function CalendarTab({ allEvents, calMonth, setCalMonth, onOpenEvent }: Props) {
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Barcha tadbirlar kalendari</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCalMonth(subMonths(calMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-32 text-center">{format(calMonth, "MMMM yyyy")}</span>
            <Button variant="ghost" size="icon" onClick={() => setCalMonth(addMonths(calMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
              {d}
            </div>
          ))}

          {Array.from({ length: startDay === 0 ? 6 : startDay - 1 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const dayEvents = allEvents.filter((e) => isSameDay(new Date(e.eventDateTime), day));
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] p-1 rounded-lg border text-xs ${
                  isToday ? "border-indigo-300 bg-indigo-50" : "border-gray-100"
                }`}
              >
                <span className={`font-medium ${isToday ? "text-indigo-600" : "text-gray-700"}`}>
                  {format(day, "d")}
                </span>

                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="mt-0.5 bg-indigo-100 text-indigo-700 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-indigo-200"
                    title={ev.title}
                    onClick={() => onOpenEvent(ev.id)}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
