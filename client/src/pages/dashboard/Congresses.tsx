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
import { Plus, Trophy, CalendarDays, MapPin, DollarSign, Globe, Trash2, ChevronRight, Star, StarOff, MessageSquarePlus } from "lucide-react";

const MODALITIES = ["in-person", "online", "hybrid"] as const;
const MODALITY_LABELS: Record<string, string> = { "in-person": "In Person", "online": "Online", "hybrid": "Hybrid" };

const emptyForm = {
  name: "", description: "", topic: "",
  startDateStr: "", endDateStr: "",
  location: "", modality: "in-person" as typeof MODALITIES[number],
  registrationFee: "", websiteUrl: "", cfpUrl: "",
  abstractDeadlineStr: "", additionalInfo: "",
};

export default function Congresses() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalTopic, setProposalTopic] = useState("");

  const { data: congresses, isLoading } = trpc.congresses.list.useQuery();
  const { data: detail } = trpc.congresses.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const createMutation = trpc.congresses.create.useMutation({
    onSuccess: () => {
      utils.congresses.list.invalidate();
      setCreateOpen(false);
      setForm(emptyForm);
      toast.success("Congress added.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.congresses.delete.useMutation({
    onSuccess: () => {
      utils.congresses.list.invalidate();
      setSelectedId(null);
      toast.success("Congress deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const createProposalMutation = trpc.congresses.createProposal.useMutation({
    onSuccess: () => {
      if (selectedId) utils.congresses.getById.invalidate({ id: selectedId });
      setProposalTitle("");
      setProposalTopic("");
      toast.success("Proposal added.");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleProposalInterestMutation = trpc.congresses.toggleProposalInterest.useMutation({
    onSuccess: () => {
      if (selectedId) utils.congresses.getById.invalidate({ id: selectedId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      topic: form.topic || undefined,
      startDate: form.startDateStr ? new Date(form.startDateStr) : undefined,
      endDate: form.endDateStr ? new Date(form.endDateStr) : undefined,
      location: form.location || undefined,
      modality: form.modality,
      registrationFee: form.registrationFee || undefined,
      websiteUrl: form.websiteUrl || undefined,
      cfpUrl: form.cfpUrl || undefined,
      abstractDeadline: form.abstractDeadlineStr ? new Date(form.abstractDeadlineStr) : undefined,
      additionalInfo: form.additionalInfo || undefined,
    });
  };

  const canDelete = detail?.creatorId === user?.id || user?.role === "admin";

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Congresses</h1>
          <Button className="gap-2 font-medium" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />Add Congress
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : congresses?.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No congresses registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {congresses?.map((c) => (
              <div key={c.id} onClick={() => setSelectedId(c.id)} className="glass-card rounded-xl p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-xs">{MODALITY_LABELS[c.modality] ?? c.modality}</Badge>
                      {c.topic && <Badge variant="secondary" className="text-xs">{c.topic}</Badge>}
                    </div>
                    <h3 className="font-serif font-semibold text-foreground line-clamp-2">{c.name}</h3>
                    {c.startDate && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(c.startDate), "MMM d, yyyy")}
                        {c.endDate && ` – ${format(new Date(c.endDate), "MMM d, yyyy")}`}
                      </p>
                    )}
                    {c.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{c.location}
                      </p>
                    )}
                    {c.abstractDeadline && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                        <CalendarDays className="w-3 h-3" />Abstract deadline: {format(new Date(c.abstractDeadline), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm(emptyForm); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Add Congress</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Congress Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Topic / Area</Label>
                  <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="AI, HCI, Education..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Modality</Label>
                  <Select value={form.modality} onValueChange={(v: any) => setForm({ ...form, modality: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODALITIES.map((m) => <SelectItem key={m} value={m}>{MODALITY_LABELS[m]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDateStr} onChange={(e) => setForm({ ...form, startDateStr: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDateStr} onChange={(e) => setForm({ ...form, endDateStr: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Abstract Deadline</Label>
                  <Input type="date" value={form.abstractDeadlineStr} onChange={(e) => setForm({ ...form, abstractDeadlineStr: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Registration Fee</Label>
                  <Input value={form.registrationFee} onChange={(e) => setForm({ ...form, registrationFee: e.target.value })} placeholder="e.g. €450" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Country" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Website URL</Label>
                  <Input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>CFP URL</Label>
                  <Input value={form.cfpUrl} onChange={(e) => setForm({ ...form, cfpUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Additional Info</Label>
                  <Textarea value={form.additionalInfo} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} rows={2} />
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.name || createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Add Congress"}
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
                    <DialogTitle className="font-serif text-xl flex-1">{detail.name}</DialogTitle>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                        onClick={() => { if (confirm("Delete this congress?")) deleteMutation.mutate({ id: detail.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{MODALITY_LABELS[detail.modality] ?? detail.modality}</Badge>
                    {detail.topic && <Badge variant="secondary">{detail.topic}</Badge>}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detail.startDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="w-4 h-4 shrink-0" />
                        {format(new Date(detail.startDate), "MMM d")}
                        {detail.endDate && ` – ${format(new Date(detail.endDate), "MMM d, yyyy")}`}
                      </div>
                    )}
                    {detail.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />{detail.location}
                      </div>
                    )}
                    {detail.registrationFee && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4 shrink-0" />{detail.registrationFee}
                      </div>
                    )}
                    {detail.websiteUrl && (
                      <a href={detail.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <Globe className="w-4 h-4 shrink-0" />Website
                      </a>
                    )}
                    {detail.cfpUrl && (
                      <a href={detail.cfpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <Globe className="w-4 h-4 shrink-0" />CFP
                      </a>
                    )}
                    {detail.abstractDeadline && (
                      <div className="flex items-center gap-2 text-rose-600">
                        <CalendarDays className="w-4 h-4 shrink-0" />
                        Abstract deadline: {format(new Date(detail.abstractDeadline), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>

                  {detail.description && <p className="text-sm text-muted-foreground leading-relaxed">{detail.description}</p>}
                  {detail.additionalInfo && <p className="text-sm text-muted-foreground italic">{detail.additionalInfo}</p>}

                  {/* Communication proposals */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Communication Proposals</p>
                    {detail.proposals?.length === 0 && (
                      <p className="text-sm text-muted-foreground">No proposals yet.</p>
                    )}
                    {detail.proposals?.map((p: any) => {
                      const myInterest = p.interests?.some((i: any) => i.userId === user?.id);
                      return (
                        <div key={p.id} className="glass-card rounded-lg p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.title}</p>
                            {p.topic && <p className="text-xs text-muted-foreground">{p.topic}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {p.interests?.length ?? 0} interested
                            </p>
                          </div>
                          <Button
                            variant={myInterest ? "default" : "outline"}
                            size="sm"
                            className={`gap-1.5 shrink-0 ${!myInterest ? "bg-white/60" : ""}`}
                            onClick={() => toggleProposalInterestMutation.mutate({ communicationId: p.id })}
                          >
                            {myInterest ? <Star className="w-3.5 h-3.5" /> : <StarOff className="w-3.5 h-3.5" />}
                            {myInterest ? "Interested" : "I'm interested"}
                          </Button>
                        </div>
                      );
                    })}

                    {/* Add proposal */}
                    <div className="glass-card rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Add a proposal</p>
                      <Input
                        placeholder="Proposal title..."
                        value={proposalTitle}
                        onChange={(e) => setProposalTitle(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Topic (optional)"
                        value={proposalTopic}
                        onChange={(e) => setProposalTopic(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => createProposalMutation.mutate({ congressId: detail.id, title: proposalTitle, topic: proposalTopic || undefined })}
                        disabled={!proposalTitle || createProposalMutation.isPending}
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />Add Proposal
                      </Button>
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
