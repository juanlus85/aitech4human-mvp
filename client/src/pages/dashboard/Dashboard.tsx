import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, CalendarDays, FileText, Globe, KanbanSquare,
  MessageSquare, Newspaper, Sparkles, Trophy, Users, Bell
} from "lucide-react";
import { format } from "date-fns";

function StatCard({ icon: Icon, label, value, href, color }: {
  icon: any; label: string; value: number | string; href: string; color: string;
}) {
  return (
    <Link href={href}>
      <div className={`glass-card rounded-xl p-5 hover-lift cursor-pointer border border-border/50`}>
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <span className="font-serif text-2xl font-bold text-foreground">{value}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-3 font-medium">{label}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data: meetings } = trpc.meetings.list.useQuery();
  const { data: papers } = trpc.papers.list.useQuery();
  const { data: congresses } = trpc.congresses.list.useQuery();
  const { data: events } = trpc.events.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();
  const { data: inbox } = trpc.messages.inbox.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery();
  const { data: members } = trpc.profiles.publicList.useQuery();

  const unreadMessages = inbox?.filter((m) => !m.isReadByRecipient).length ?? 0;
  const unreadNotifications = notifications?.filter((n) => !n.isRead).length ?? 0;
  const upcomingMeetings = meetings?.filter((m) => m.status === "scheduled").slice(0, 3) ?? [];
  const activePapers = papers?.filter((p) => !["published", "accepted"].includes(p.status)).slice(0, 3) ?? [];
  const pendingTasks = tasks?.filter((t) => t.status !== "done").slice(0, 4) ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl text-foreground">
            {greeting}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(new Date(), "EEEE, MMMM d, yyyy")} · AI&Tech4Human Research Group
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard icon={MessageSquare} label="Unread Messages" value={unreadMessages} href="/dashboard/messages" color="bg-blue-100 text-blue-600" />
          <StatCard icon={Bell} label="Notifications" value={unreadNotifications} href="/dashboard/notifications" color="bg-violet-100 text-violet-600" />
          <StatCard icon={CalendarDays} label="Meetings" value={meetings?.length ?? 0} href="/dashboard/meetings" color="bg-emerald-100 text-emerald-600" />
          <StatCard icon={BookOpen} label="Paper Proposals" value={papers?.length ?? 0} href="/dashboard/papers" color="bg-amber-100 text-amber-600" />
          <StatCard icon={Trophy} label="Conferences" value={congresses?.length ?? 0} href="/dashboard/congresses" color="bg-rose-100 text-rose-600" />
          <StatCard icon={KanbanSquare} label="Open Tasks" value={pendingTasks.length} href="/dashboard/tasks" color="bg-sky-100 text-sky-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Meetings */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Upcoming Meetings</h2>
              <Link href="/dashboard/meetings">
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7">View all</Button>
              </Link>
            </div>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-3">
                {upcomingMeetings.map((m) => (
                  <Link key={m.id} href={`/dashboard/meetings/${m.id}`}>
                    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{m.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.type === "fixed" && m.fixedDate
                            ? format(new Date(m.fixedDate), "MMM d, HH:mm")
                            : m.type === "poll" ? "Date pending vote" : "TBD"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{m.modality}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming meetings</p>
            )}
          </div>

          {/* Active Papers */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Active Paper Proposals</h2>
              <Link href="/dashboard/papers">
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7">View all</Button>
              </Link>
            </div>
            {activePapers.length > 0 ? (
              <div className="space-y-3">
                {activePapers.map((p) => (
                  <Link key={p.id} href={`/dashboard/papers/${p.id}`}>
                    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{p.title}</p>
                        <Badge className={`text-[10px] mt-1 status-${p.status}`}>{p.status.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No active paper proposals</p>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Pending Tasks</h2>
              <Link href="/dashboard/tasks">
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7">View all</Button>
              </Link>
            </div>
            {pendingTasks.length > 0 ? (
              <div className="space-y-2">
                {pendingTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      t.priority === "high" ? "bg-red-400" : t.priority === "medium" ? "bg-amber-400" : "bg-green-400"
                    }`} />
                    <p className="text-sm text-foreground line-clamp-1 flex-1">{t.title}</p>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{t.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">All tasks complete!</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/messages"><Button variant="outline" size="sm" className="gap-1.5 bg-white/60"><MessageSquare className="w-3.5 h-3.5" />New Message</Button></Link>
            <Link href="/dashboard/meetings"><Button variant="outline" size="sm" className="gap-1.5 bg-white/60"><CalendarDays className="w-3.5 h-3.5" />Schedule Meeting</Button></Link>
            <Link href="/dashboard/papers"><Button variant="outline" size="sm" className="gap-1.5 bg-white/60"><BookOpen className="w-3.5 h-3.5" />Add Paper Proposal</Button></Link>
            <Link href="/dashboard/congresses"><Button variant="outline" size="sm" className="gap-1.5 bg-white/60"><Trophy className="w-3.5 h-3.5" />Add Conference</Button></Link>
            <Link href="/dashboard/assistant"><Button variant="outline" size="sm" className="gap-1.5 bg-white/60"><Sparkles className="w-3.5 h-3.5" />AI Assistant</Button></Link>
            {isAdmin && <Link href="/dashboard/admin/users"><Button variant="outline" size="sm" className="gap-1.5 bg-white/60"><Users className="w-3.5 h-3.5" />Manage Users</Button></Link>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
