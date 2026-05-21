import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Bell, CheckCheck, Mail, CalendarDays, BookOpen, Trophy, Globe, FileText, Flag } from "lucide-react";
import { toast } from "sonner";

const TYPE_ICONS: Record<string, any> = {
  message: Mail,
  meeting: CalendarDays,
  paper: BookOpen,
  congress: Trophy,
  event: Globe,
  document: FileText,
  task: Flag,
  system: Bell,
};

export default function Notifications() {
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery();

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("All notifications marked as read.");
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">{unreadCount} new</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 bg-white/60" onClick={() => markAllReadMutation.mutate()}>
              <CheckCheck className="w-3.5 h-3.5" />Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : notifications?.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-border/30">
            {notifications?.map((n) => {
              const Icon = TYPE_ICONS[n.type] ?? Bell;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 transition-colors ${!n.isRead ? "bg-primary/5" : "hover:bg-muted/30"}`}
                  onClick={() => !n.isRead && markReadMutation.mutate({ id: n.id })}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? "bg-primary/15" : "bg-muted"}`}>
                    <Icon className={`w-4 h-4 ${!n.isRead ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(n.createdAt), "MMM d, yyyy · HH:mm")}
                    </p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
