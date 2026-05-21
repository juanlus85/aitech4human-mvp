import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO } from "date-fns";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Users, BookOpen, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: "meeting" | "congress" | "event" | "deadline";
  color: string;
};

const TYPE_CONFIG = {
  meeting: { color: "bg-violet-400", label: "Meeting", icon: Users },
  congress: { color: "bg-rose-400", label: "Congress", icon: BookOpen },
  event: { color: "bg-emerald-400", label: "Event", icon: CalendarDays },
  deadline: { color: "bg-amber-400", label: "Deadline", icon: Clock },
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: meetings } = trpc.meetings.list.useQuery();
  const { data: congresses } = trpc.congresses.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const items: CalendarEvent[] = [];

    meetings?.forEach((m) => {
      if (m.fixedDate) {
        items.push({ id: `meeting-${m.id}`, title: m.title, date: new Date(m.fixedDate), type: "meeting", color: TYPE_CONFIG.meeting.color });
      }
    });

    congresses?.forEach((c) => {
      if (c.startDate) {
        items.push({ id: `congress-${c.id}`, title: c.name, date: new Date(c.startDate), type: "congress", color: TYPE_CONFIG.congress.color });
      }
      if (c.abstractDeadline) {
        items.push({ id: `deadline-${c.id}`, title: `Abstract deadline: ${c.name}`, date: new Date(c.abstractDeadline), type: "deadline", color: TYPE_CONFIG.deadline.color });
      }
    });

    events?.forEach((e) => {
      if (e.eventDate) {
        items.push({ id: `event-${e.id}`, title: e.title, date: new Date(e.eventDate), type: "event", color: TYPE_CONFIG.event.color });
      }
    });

    return items;
  }, [meetings, congresses, events]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month to align with Monday
  const startDow = (monthStart.getDay() + 6) % 7; // 0=Mon
  const paddedDays: (Date | null)[] = [...Array(startDow).fill(null), ...days];

  const eventsForDay = (day: Date) => calendarEvents.filter((e) => isSameDay(e.date, day));

  const upcomingEvents = calendarEvents
    .filter((e) => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 8);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Meetings, congresses, events and deadlines</p>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <Badge key={key} variant="secondary" className="gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                {cfg.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar grid */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-serif text-xl font-semibold text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, idx) => {
                if (!day) return <div key={`pad-${idx}`} />;
                const dayEvents = eventsForDay(day);
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[72px] rounded-lg p-1.5 border transition-colors ${
                      today
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent hover:border-border/50 hover:bg-muted/30"
                    }`}
                  >
                    <span className={`text-xs font-medium block text-center mb-1 w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                      today ? "bg-primary text-white" : "text-muted-foreground"
                    }`}>
                      {format(day, "d")}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className={`${ev.color} rounded text-white text-[9px] px-1 py-0.5 truncate leading-tight`}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-muted-foreground text-center">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming sidebar */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-serif text-base font-semibold text-foreground mb-4">Upcoming</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((ev) => {
                  const cfg = TYPE_CONFIG[ev.type];
                  const Icon = cfg.icon;
                  return (
                    <div key={ev.id} className="flex gap-3 items-start">
                      <div className={`w-7 h-7 rounded-lg ${ev.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground leading-tight truncate">{ev.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{format(ev.date, "MMM d, yyyy")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
