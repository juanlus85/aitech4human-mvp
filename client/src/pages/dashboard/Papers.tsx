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
import { Plus, BookOpen, Users, ExternalLink, Trash2, ChevronRight, Edit2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const STATUSES = [
  { value: "idea",         label: "Idea",          color: "bg-slate-100 text-slate-700" },
  { value: "draft",        label: "Draft",         color: "bg-blue-100 text-blue-700" },
  { value: "writing",      label: "Writing",       color: "bg-violet-100 text-violet-700" },
  { value: "submitted",    label: "Submitted",     color: "bg-amber-100 text-amber-700" },
  { value: "under_review", label: "Under Review",  color: "bg-orange-100 text-orange-700" },
  { value: "accepted",     label: "Accepted",      color: "bg-emerald-100 text-emerald-700" },
  { value: "published",    label: "Published",     color: "bg-green-100 text-green-700" },
] as const;

type PaperStatus = typeof STATUSES[number]["value"];

function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find((x) => x.value === status);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s?.color ?? "bg-muted text-muted-foreground"}`}>
      {s?.label ?? status}
    </span>
  );
}

export default function Papers() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const emptyForm = {
    title: "", abstract: "", keywords: "", targetJournal: "",
    methodology: "", status: "idea" as PaperStatus, deadlineStr: "", additionalInfo: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [editForm, setEditForm] = useState<Partial<typeof emptyForm & { id: number }>>({});

  const { data: papers, isLoading } = trpc.papers.list.useQuery();
  const { data: detail } = trpc.papers.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const createMutation = trpc.papers.create.useMutation({
    onSuccess: () => {
      utils.papers.list.invalidate();
      setCreateOpen(false);
      setForm(emptyForm);
      setNotifyEmail(false);
      toast.success("Paper added.");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.papers.update.useMutation({
    onSuccess: () => {
      utils.papers.list.invalidate();
      if (selectedId) utils.papers.getById.invalidate({ id: selectedId });
      setEditOpen(false);
      toast.success("Paper updated.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.papers.delete.useMutation({
    onSuccess: () => {
      utils.papers.list.invalidate();
      setSelectedId(null);
      toast.success("Paper deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleContributorMutation = trpc.papers.toggleContributor.useMutation({
    onSuccess: () => {
      if (selectedId) utils.papers.getById.invalidate({ id: selectedId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    createMutation.mutate({
      title: form.title,
      abstract: form.abstract || undefined,
      keywords: form.keywords || undefined,
      targetJournal: form.targetJournal || undefined,
      methodology: form.methodology || undefined,
      status: form.status,
      deadline: form.deadlineStr ? new Date(form.deadlineStr) : undefined,
      additionalInfo: form.additionalInfo || undefined,
      notifyEmail,
    });
  };

  const handleUpdate = () => {
    if (!editForm.id) return;
    updateMutation.mutate({
      id: editForm.id,
      title: editForm.title,
      abstract: editForm.abstract || undefined,
      keywords: editForm.keywords || undefined,
      targetJournal: editForm.targetJournal || undefined,
      methodology: editForm.methodology || undefined,
      status: editForm.status as PaperStatus,
      deadline: editForm.deadlineStr ? new Date(editForm.deadlineStr) : undefined,
      additionalInfo: editForm.additionalInfo || undefined,
    });
  };

  const openEdit = () => {
    if (!detail) return;
    setEditForm({
      id: detail.id,
      title: detail.title ?? "",
      abstract: detail.abstract ?? "",
      keywords: detail.keywords ?? "",
      targetJournal: detail.targetJournal ?? "",
      methodology: detail.methodology ?? "",
      status: detail.status as PaperStatus,
      deadlineStr: detail.deadline ? format(new Date(detail.deadline), "yyyy-MM-dd") : "",
      additionalInfo: detail.additionalInfo ?? "",
    });
    setEditOpen(true);
  };

  const filtered = filterStatus === "all" ? papers : papers?.filter((p) => p.status === filterStatus);
  const isContributor = detail?.contributors?.some((c: any) => c.userId === user?.id);
  const canEdit = detail?.creatorId === user?.id || user?.role === "admin";

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Paper Proposals</h1>
          <Button className="gap-2 font-medium" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />Add Paper
          </Button>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterStatus === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:bg-muted/50"}`}
          >
            All ({papers?.length ?? 0})
          </button>
          {STATUSES.map((s) => {
            const count = papers?.filter((p) => p.status === s.value).length ?? 0;
            return (
              <button
                key={s.value}
                onClick={() => setFilterStatus(s.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterStatus === s.value ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:bg-muted/50"}`}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : filtered?.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No papers in this status.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered?.map((p) => (
              <div key={p.id} onClick={() => setSelectedId(p.id)} className="glass-card rounded-xl p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <StatusBadge status={p.status} />
                      {p.targetJournal && <span className="text-xs text-muted-foreground truncate">{p.targetJournal}</span>}
                    </div>
                    <h3 className="font-serif font-semibold text-foreground line-clamp-2">{p.title}</h3>
                    {p.abstract && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.abstract}</p>}
                    <p className="text-xs text-muted-foreground mt-1.5">{format(new Date(p.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm(emptyForm); }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Add Paper</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Target Journal</Label>
                  <Input value={form.targetJournal} onChange={(e) => setForm({ ...form, targetJournal: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Abstract</Label>
                <Textarea value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} rows={4} />
              </div>
              <div className="space-y-1.5">
                <Label>Keywords</Label>
                <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="AI, education, wellbeing..." />
              </div>
              <div className="space-y-1.5">
                <Label>Methodology</Label>
                <Textarea value={form.methodology} onChange={(e) => setForm({ ...form, methodology: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadlineStr} onChange={(e) => setForm({ ...form, deadlineStr: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Additional Info</Label>
                <Textarea value={form.additionalInfo} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} rows={2} />
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <Checkbox id="notifyEmailPaper" checked={notifyEmail} onCheckedChange={(v) => setNotifyEmail(!!v)} />
                <Label htmlFor="notifyEmailPaper" className="cursor-pointer text-sm font-normal text-muted-foreground">
                  Notify members by email
                </Label>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.title || createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Add Paper"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Edit Paper</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={editForm.title ?? ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editForm.status ?? "idea"} onValueChange={(v: any) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Target Journal</Label>
                  <Input value={editForm.targetJournal ?? ""} onChange={(e) => setEditForm({ ...editForm, targetJournal: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Abstract</Label>
                <Textarea value={editForm.abstract ?? ""} onChange={(e) => setEditForm({ ...editForm, abstract: e.target.value })} rows={4} />
              </div>
              <div className="space-y-1.5">
                <Label>Keywords</Label>
                <Input value={editForm.keywords ?? ""} onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Methodology</Label>
                <Textarea value={editForm.methodology ?? ""} onChange={(e) => setEditForm({ ...editForm, methodology: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={editForm.deadlineStr ?? ""} onChange={(e) => setEditForm({ ...editForm, deadlineStr: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Additional Info</Label>
                <Textarea value={editForm.additionalInfo ?? ""} onChange={(e) => setEditForm({ ...editForm, additionalInfo: e.target.value })} rows={2} />
              </div>
              <Button className="w-full" onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail dialog */}
        <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {detail && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <StatusBadge status={detail.status} />
                      <DialogTitle className="font-serif text-xl mt-2">{detail.title}</DialogTitle>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openEdit}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => { if (confirm("Delete this paper?")) deleteMutation.mutate({ id: detail.id }); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  {detail.abstract && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Abstract</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{detail.abstract}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detail.targetJournal && (
                      <div>
                        <p className="text-xs text-muted-foreground">Target Journal</p>
                        <p className="font-medium text-foreground">{detail.targetJournal}</p>
                      </div>
                    )}
                    {detail.keywords && (
                      <div>
                        <p className="text-xs text-muted-foreground">Keywords</p>
                        <p className="text-foreground">{detail.keywords}</p>
                      </div>
                    )}
                    {detail.deadline && (
                      <div>
                        <p className="text-xs text-muted-foreground">Deadline</p>
                        <p className="text-foreground">{format(new Date(detail.deadline), "MMM d, yyyy")}</p>
                      </div>
                    )}
                    {detail.doiUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground">DOI / URL</p>
                        <a href={detail.doiUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                          <ExternalLink className="w-3 h-3" />Open
                        </a>
                      </div>
                    )}
                  </div>

                  {detail.methodology && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Methodology</p>
                      <p className="text-sm text-muted-foreground">{detail.methodology}</p>
                    </div>
                  )}

                  {detail.additionalInfo && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Additional Info</p>
                      <p className="text-sm text-muted-foreground">{detail.additionalInfo}</p>
                    </div>
                  )}

                  {/* Contributors */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />Contributors ({detail.contributors?.length ?? 0})
                      </p>
                      <Button
                        variant={isContributor ? "default" : "outline"}
                        size="sm"
                        className={!isContributor ? "bg-white/60" : ""}
                        onClick={() => toggleContributorMutation.mutate({ paperId: detail.id })}
                      >
                        {isContributor ? "Contributing ✓" : "Join as contributor"}
                      </Button>
                    </div>
                    {detail.contributors?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {detail.contributors.map((c: any) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">{c.userName ?? `Member #${c.userId}`}</Badge>
                        ))}
                      </div>
                    )}
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
