import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Lightbulb, Pencil, Trash2, Heart, Users, ChevronDown, ChevronUp } from "lucide-react";

const STATUSES = [
  { value: "idea",       label: "Idea",       color: "bg-slate-100 text-slate-700" },
  { value: "draft",      label: "Draft",      color: "bg-blue-100 text-blue-700" },
  { value: "submitted",  label: "Submitted",  color: "bg-amber-100 text-amber-700" },
  { value: "approved",   label: "Approved",   color: "bg-emerald-100 text-emerald-700" },
  { value: "rejected",   label: "Rejected",   color: "bg-red-100 text-red-700" },
  { value: "active",     label: "Active",     color: "bg-green-100 text-green-700" },
  { value: "completed",  label: "Completed",  color: "bg-purple-100 text-purple-700" },
] as const;

type ProposalStatus = typeof STATUSES[number]["value"];

function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find((x) => x.value === status);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s?.color ?? "bg-muted text-muted-foreground"}`}>
      {s?.label ?? status}
    </span>
  );
}

const emptyForm = {
  title: "",
  description: "",
  objectives: "",
  methodology: "",
  expectedOutcomes: "",
  fundingSource: "",
  budget: "",
  startDateStr: "",
  endDateStr: "",
  status: "idea" as ProposalStatus,
  keywords: "",
  additionalInfo: "",
};

export default function ProjectProposals() {
  const { user, isAdmin } = useAuth();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editProposal, setEditProposal] = useState<(typeof emptyForm & { id: number }) | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState(emptyForm);

  const { data: proposals = [], isLoading } = trpc.projectProposals.list.useQuery();
  const { data: detail } = trpc.projectProposals.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );
  const { data: interests } = trpc.projectProposals.getInterests.useQuery(
    { proposalId: selectedId! },
    { enabled: !!selectedId }
  );

  const createMutation = trpc.projectProposals.create.useMutation({
    onSuccess: () => {
      utils.projectProposals.list.invalidate();
      setCreateOpen(false);
      setForm(emptyForm);
      toast.success("Project proposal created.");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.projectProposals.update.useMutation({
    onSuccess: () => {
      utils.projectProposals.list.invalidate();
      if (selectedId) utils.projectProposals.getById.invalidate({ id: selectedId });
      setEditProposal(null);
      toast.success("Proposal updated.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.projectProposals.delete.useMutation({
    onSuccess: () => {
      utils.projectProposals.list.invalidate();
      setSelectedId(null);
      toast.success("Proposal deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleInterestMutation = trpc.projectProposals.toggleInterest.useMutation({
    onSuccess: () => {
      if (selectedId) utils.projectProposals.getInterests.invalidate({ proposalId: selectedId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description || undefined,
      objectives: form.objectives || undefined,
      methodology: form.methodology || undefined,
      expectedOutcomes: form.expectedOutcomes || undefined,
      fundingSource: form.fundingSource || undefined,
      budget: form.budget || undefined,
      startDate: form.startDateStr ? new Date(form.startDateStr) : undefined,
      endDate: form.endDateStr ? new Date(form.endDateStr) : undefined,
      status: form.status,
      keywords: form.keywords || undefined,
      additionalInfo: form.additionalInfo || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editProposal) return;
    updateMutation.mutate({
      id: editProposal.id,
      title: editProposal.title,
      description: editProposal.description || undefined,
      objectives: editProposal.objectives || undefined,
      methodology: editProposal.methodology || undefined,
      expectedOutcomes: editProposal.expectedOutcomes || undefined,
      fundingSource: editProposal.fundingSource || undefined,
      budget: editProposal.budget || undefined,
      startDate: editProposal.startDateStr ? new Date(editProposal.startDateStr) : undefined,
      endDate: editProposal.endDateStr ? new Date(editProposal.endDateStr) : undefined,
      status: editProposal.status,
      keywords: editProposal.keywords || undefined,
      additionalInfo: editProposal.additionalInfo || undefined,
    });
  };

  const openEdit = (p: any) => {
    setEditProposal({
      id: p.id,
      title: p.title ?? "",
      description: p.description ?? "",
      objectives: p.objectives ?? "",
      methodology: p.methodology ?? "",
      expectedOutcomes: p.expectedOutcomes ?? "",
      fundingSource: p.fundingSource ?? "",
      budget: p.budget ?? "",
      startDateStr: p.startDate ? format(new Date(p.startDate), "yyyy-MM-dd") : "",
      endDateStr: p.endDate ? format(new Date(p.endDate), "yyyy-MM-dd") : "",
      status: p.status as ProposalStatus,
      keywords: p.keywords ?? "",
      additionalInfo: p.additionalInfo ?? "",
    });
  };

  const filtered = filterStatus === "all" ? proposals : proposals.filter((p) => p.status === filterStatus);

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">Project Proposals</h1>
              <p className="text-sm text-muted-foreground">Research project ideas and proposals</p>
            </div>
          </div>
          <Button className="gap-2 font-medium" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Proposal
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", ...STATUSES.map((s) => s.value)].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : STATUSES.find((x) => x.value === s)?.label ?? s}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No project proposals yet</p>
            <p className="text-sm mt-1">Be the first to propose a research project.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => {
              const isExpanded = expandedId === p.id;
              const isOwner = p.creatorId === user?.id;
              return (
                <div key={p.id} className="glass-card rounded-xl border border-border/50 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-base text-foreground">{p.title}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Proposed by {p.creatorName ?? "Unknown"} · {format(new Date(p.createdAt), "MMM d, yyyy")}
                        </p>
                        {p.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
                        )}
                        {p.keywords && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.keywords.split(",").map((k) => k.trim()).filter(Boolean).map((k) => (
                              <span key={k} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{k}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(isOwner || isAdmin) && (
                          <>
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm("Delete this proposal?")) deleteMutation.mutate({ id: p.id }); }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="border-t border-border/50 px-5 py-2.5 flex items-center gap-4 bg-muted/20">
                    <button
                      onClick={() => {
                        if (isExpanded) { setExpandedId(null); setSelectedId(null); }
                        else { setExpandedId(p.id); setSelectedId(p.id); }
                      }}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>Details & Interest</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {/* Expanded detail */}
                  {isExpanded && selectedId === p.id && (
                    <div className="border-t border-border/50 bg-background/50 p-5 space-y-4">
                      {detail && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {detail.objectives && (
                            <div>
                              <p className="font-medium text-foreground mb-1">Objectives</p>
                              <p className="text-muted-foreground whitespace-pre-wrap">{detail.objectives}</p>
                            </div>
                          )}
                          {detail.methodology && (
                            <div>
                              <p className="font-medium text-foreground mb-1">Methodology</p>
                              <p className="text-muted-foreground whitespace-pre-wrap">{detail.methodology}</p>
                            </div>
                          )}
                          {detail.expectedOutcomes && (
                            <div>
                              <p className="font-medium text-foreground mb-1">Expected Outcomes</p>
                              <p className="text-muted-foreground whitespace-pre-wrap">{detail.expectedOutcomes}</p>
                            </div>
                          )}
                          {(detail.fundingSource || detail.budget) && (
                            <div>
                              <p className="font-medium text-foreground mb-1">Funding</p>
                              {detail.fundingSource && <p className="text-muted-foreground">Source: {detail.fundingSource}</p>}
                              {detail.budget && <p className="text-muted-foreground">Budget: {detail.budget}</p>}
                            </div>
                          )}
                          {(detail.startDate || detail.endDate) && (
                            <div>
                              <p className="font-medium text-foreground mb-1">Timeline</p>
                              {detail.startDate && <p className="text-muted-foreground">Start: {format(new Date(detail.startDate), "MMM d, yyyy")}</p>}
                              {detail.endDate && <p className="text-muted-foreground">End: {format(new Date(detail.endDate), "MMM d, yyyy")}</p>}
                            </div>
                          )}
                          {detail.additionalInfo && (
                            <div className="sm:col-span-2">
                              <p className="font-medium text-foreground mb-1">Additional Info</p>
                              <p className="text-muted-foreground whitespace-pre-wrap">{detail.additionalInfo}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Interest section */}
                      <div className="border-t border-border/30 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-rose-500" />
                            Interested members ({interests?.length ?? 0})
                          </p>
                          <Button
                            size="sm"
                            variant={interests?.some((i) => i.userId === user?.id) ? "default" : "outline"}
                            className="gap-1.5 h-7 text-xs"
                            onClick={() => toggleInterestMutation.mutate({ proposalId: p.id })}
                            disabled={toggleInterestMutation.isPending}
                          >
                            <Heart className="w-3 h-3" />
                            {interests?.some((i) => i.userId === user?.id) ? "Interested ✓" : "I'm Interested"}
                          </Button>
                        </div>
                        {interests && interests.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {interests.map((i) => (
                              <span key={i.id} className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-200">
                                {i.userName ?? "Member"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={(v) => { if (!v) { setCreateOpen(false); setForm(emptyForm); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">New Project Proposal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <ProposalFormFields form={form} setForm={setForm} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setForm(emptyForm); }}>Cancel</Button>
                <Button type="submit" disabled={!form.title.trim() || createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Proposal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editProposal} onOpenChange={(v) => !v && setEditProposal(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Edit Project Proposal</DialogTitle>
            </DialogHeader>
            {editProposal && (
              <div className="space-y-4">
                <ProposalFormFields form={editProposal} setForm={(v) => setEditProposal({ ...editProposal, ...v })} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditProposal(null)}>Cancel</Button>
                  <Button disabled={!editProposal.title.trim() || updateMutation.isPending} onClick={handleUpdate}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function ProposalFormFields({ form, setForm }: {
  form: typeof emptyForm;
  setForm: (v: typeof emptyForm) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project title..." required />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
          <Label>Funding Source</Label>
          <Input value={form.fundingSource} onChange={(e) => setForm({ ...form, fundingSource: e.target.value })} placeholder="e.g. EU Horizon, NSF..." />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief description of the project..." />
      </div>
      <div className="space-y-1.5">
        <Label>Objectives</Label>
        <Textarea value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} rows={3} placeholder="Main objectives..." />
      </div>
      <div className="space-y-1.5">
        <Label>Methodology</Label>
        <Textarea value={form.methodology} onChange={(e) => setForm({ ...form, methodology: e.target.value })} rows={3} placeholder="Research methodology..." />
      </div>
      <div className="space-y-1.5">
        <Label>Expected Outcomes</Label>
        <Textarea value={form.expectedOutcomes} onChange={(e) => setForm({ ...form, expectedOutcomes: e.target.value })} rows={2} placeholder="Expected results and impact..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Budget</Label>
          <Input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="e.g. €150,000" />
        </div>
        <div className="space-y-1.5">
          <Label>Keywords</Label>
          <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="AI, machine learning, ..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" value={form.startDateStr} onChange={(e) => setForm({ ...form, startDateStr: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>End Date</Label>
          <Input type="date" value={form.endDateStr} onChange={(e) => setForm({ ...form, endDateStr: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Additional Info</Label>
        <Textarea value={form.additionalInfo} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} rows={2} placeholder="Any other relevant information..." />
      </div>
    </>
  );
}
