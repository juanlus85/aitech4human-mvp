import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, FlaskConical, LogIn, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

type Status = "active" | "inactive" | "completed";

const STATUS_LABELS: Record<Status, string> = {
  active: "Active",
  inactive: "Inactive",
  completed: "Completed",
};

const STATUS_COLORS: Record<Status, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  completed: "bg-blue-100 text-blue-700",
};

interface FormState {
  title: string;
  description: string;
  objectives: string;
  keywords: string;
  status: Status;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  objectives: "",
  keywords: "",
  status: "active",
};

export default function ResearchLines() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: lines = [], isLoading } = trpc.researchLines.getAll.useQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const createMutation = trpc.researchLines.create.useMutation({
    onSuccess: () => {
      utils.researchLines.getAll.invalidate();
      setCreateOpen(false);
      setForm(emptyForm);
      toast.success("Research line created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.researchLines.update.useMutation({
    onSuccess: () => {
      utils.researchLines.getAll.invalidate();
      setEditOpen(false);
      setEditingId(null);
      toast.success("Research line updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.researchLines.delete.useMutation({
    onSuccess: () => {
      utils.researchLines.getAll.invalidate();
      toast.success("Research line deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const joinMutation = trpc.researchLines.join.useMutation({
    onSuccess: () => {
      utils.researchLines.getAll.invalidate();
      toast.success("You joined this research line");
    },
    onError: (e) => toast.error(e.message),
  });

  const leaveMutation = trpc.researchLines.leave.useMutation({
    onSuccess: () => {
      utils.researchLines.getAll.invalidate();
      toast.success("You left this research line");
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (line: any) => {
    setEditingId(line.id);
    setForm({
      title: line.title ?? "",
      description: line.description ?? "",
      objectives: line.objectives ?? "",
      keywords: line.keywords ?? "",
      status: line.status ?? "active",
    });
    setEditOpen(true);
  };

  const canManage = (line: any) =>
    user?.role === "admin" || line.creatorId === user?.id;

  const isMember = (line: any) =>
    line.members?.some((m: any) => m.userId === user?.id);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Research Lines</h1>
              <p className="text-sm text-muted-foreground">
                {lines.length} line{lines.length !== 1 ? "s" : ""} · Join lines to collaborate or create new ones
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => { setForm(emptyForm); setCreateOpen(true); }}>
            <Plus className="w-4 h-4" /> New Line
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : lines.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No research lines yet</p>
            <p className="text-sm mt-1">Create the first one to start collaborating</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((line: any) => {
              const expanded = expandedId === line.id;
              const memberCount = line.members?.length ?? 0;
              const amMember = isMember(line);
              const canEdit = canManage(line);
              const status = line.status as Status;

              return (
                <div key={line.id} className="border border-border/60 rounded-xl bg-card shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground text-sm leading-snug">{line.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      {line.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{line.description}</p>
                      )}
                      {line.keywords && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {line.keywords.split(",").map((kw: string) => kw.trim()).filter(Boolean).map((kw: string) => (
                            <span key={kw} className="text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded-md">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(line)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Delete this research line?")) {
                                deleteMutation.mutate({ id: line.id });
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {amMember ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 bg-white/60"
                          onClick={() => leaveMutation.mutate({ lineId: line.id })}
                          disabled={leaveMutation.isPending}
                        >
                          <LogOut className="w-3 h-3" /> Leave
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => joinMutation.mutate({ lineId: line.id })}
                          disabled={joinMutation.isPending}
                        >
                          <LogIn className="w-3 h-3" /> Join
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Footer bar */}
                  <div
                    className="px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : line.id)}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
                      {amMember && (
                        <span className="ml-2 text-primary font-medium">· You are a member</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{expanded ? "Hide members" : "View members"}</span>
                      {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Expanded members */}
                  {expanded && (
                    <div className="px-4 py-3 border-t border-border/30 bg-muted/10 space-y-3">
                      {line.objectives && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Objectives</p>
                          <p className="text-sm text-foreground">{line.objectives}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Members ({memberCount})</p>
                        {memberCount === 0 ? (
                          <p className="text-xs text-muted-foreground">No members yet. Be the first to join!</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {line.members.map((m: any) => (
                              <div key={m.userId} className="flex items-center gap-1.5 bg-background border border-border/50 rounded-full px-2.5 py-1">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                  {(m.name ?? m.email ?? "?")[0].toUpperCase()}
                                </div>
                                <span className="text-xs text-foreground">{m.name ?? m.email ?? "Member"}</span>
                                {m.role === "lead" && (
                                  <span className="text-xs text-amber-600 font-medium">Lead</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(line.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Research Line</DialogTitle>
          </DialogHeader>
          <ResearchLineForm form={form} setForm={setForm} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || createMutation.isPending}
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Research Line</DialogTitle>
          </DialogHeader>
          <ResearchLineForm form={form} setForm={setForm} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => editingId && updateMutation.mutate({ id: editingId, ...form })}
              disabled={!form.title || updateMutation.isPending}
            >
              Save changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function ResearchLineForm({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Title *</label>
        <Input
          className="mt-1"
          placeholder="e.g. Human-AI Interaction"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          className="mt-1 resize-none"
          rows={3}
          placeholder="Brief description of this research line..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Objectives</label>
        <Textarea
          className="mt-1 resize-none"
          rows={2}
          placeholder="Main objectives and goals..."
          value={form.objectives}
          onChange={(e) => setForm({ ...form, objectives: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Keywords</label>
        <Input
          className="mt-1"
          placeholder="AI, ethics, wellbeing (comma-separated)"
          value={form.keywords}
          onChange={(e) => setForm({ ...form, keywords: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Status</label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
