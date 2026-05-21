import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, KanbanSquare, Trash2, ChevronRight, Flag } from "lucide-react";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "border-slate-300" },
  { id: "in_progress", label: "In Progress", color: "border-blue-400" },
  { id: "done", label: "Done", color: "border-emerald-400" },
];

const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_COLORS: Record<string, string> = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-red-500",
};

export default function Tasks() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium", dueDate: "", assigneeId: "",
  });

  const { data: tasks, isLoading } = trpc.tasks.list.useQuery();
  const { data: members } = trpc.profiles.publicList.useQuery();

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setCreateOpen(false);
      setForm({ title: "", description: "", priority: "medium", dueDate: "", assigneeId: "" });
      toast.success("Task created.");
    },
    onError: (e) => toast.error(e.message),
  });

  const moveTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); setSelected(null); toast.success("Task deleted."); },
  });

  const tasksByStatus = (status: string) => tasks?.filter((t) => t.status === status) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Tasks</h1>
          <Button className="gap-2 font-medium" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />New Task
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus(col.id);
              return (
                <div key={col.id} className={`glass-card rounded-xl p-4 border-t-2 ${col.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                    <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-2.5">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelected(task)}
                        className="bg-white/60 rounded-lg p-3 cursor-pointer hover:bg-white/80 transition-colors shadow-sm"
                      >
                        <div className="flex items-start gap-2">
                          <Flag className={`w-3 h-3 mt-0.5 shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
                          <p className="text-sm font-medium text-foreground line-clamp-2">{task.title}</p>
                        </div>
                        {task.dueDate && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            Due {format(new Date(task.dueDate), "MMM d")}
                          </p>
                        )}
                        {task.assigneeName && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-[8px] text-primary font-bold">{task.assigneeName.charAt(0)}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{task.assigneeName}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-serif">New Task</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ title: form.title, description: form.description || undefined, priority: form.priority as any, dueDate: form.dueDate ? new Date(form.dueDate) : undefined, assigneeId: form.assigneeId ? parseInt(form.assigneeId) : undefined }); }} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Assign to</Label>
                <Select value={form.assigneeId} onValueChange={(v) => setForm({ ...form, assigneeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
                    <SelectContent>
                      {members?.map((m) => <SelectItem key={m.userId} value={String(m.userId)}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-md">
            {selected && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-2">
                    <DialogTitle className="font-serif text-lg">{selected.title}</DialogTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                      onClick={() => { if (confirm("Delete this task?")) deleteMutation.mutate({ id: selected.id }); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={`capitalize ${PRIORITY_COLORS[selected.priority]}`}>
                      <Flag className="w-3 h-3 mr-1" />{selected.priority} priority
                    </Badge>
                    {selected.dueDate && (
                      <Badge variant="outline" className="text-xs">Due {format(new Date(selected.dueDate), "MMM d, yyyy")}</Badge>
                    )}
                  </div>
                  {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Move to</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLUMNS.map((col) => (
                        <Button
                          key={col.id}
                          variant={selected.status === col.id ? "default" : "outline"}
                          size="sm"
                          className={selected.status !== col.id ? "bg-white/60" : ""}
                          onClick={() => {
                            moveTaskMutation.mutate({ id: selected.id, status: col.id as "todo" | "in_progress" | "done" });
                            setSelected({ ...selected, status: col.id });
                          }}
                        >
                          {col.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
