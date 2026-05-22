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
import { Plus, Trophy, CalendarDays, MapPin, DollarSign, Globe, Trash2, ChevronRight, Star, StarOff, MessageSquarePlus, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const MODALITIES = ["in-person", "online", "hybrid"] as const;
const MODALITY_LABELS: Record<string, string> = { "in-person": "In Person", "online": "Online", "hybrid": "Hybrid" };

const emptyForm = {
  name: "", acronym: "", description: "", topic: "",
  startDateStr: "", endDateStr: "",
  location: "", country: "", modality: "in-person" as typeof MODALITIES[number],
  registrationFee: "", websiteUrl: "", cfpUrl: "",
  abstractDeadlineStr: "", paperDeadlineStr: "", registrationDeadlineStr: "",
  additionalInfo: "",
};

export default function Congresses() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalTopic, setProposalTopic] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", acronym: "", description: "", topic: "", startDateStr: "", endDateStr: "", location: "", country: "", modality: "in-person" as typeof MODALITIES[number], registrationFee: "", websiteUrl: "", cfpUrl: "", abstractDeadlineStr: "", paperDeadlineStr: "", registrationDeadlineStr: "", additionalInfo: "" });
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);

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
      setNotifyEmail(false);
      toast.success("Conference added.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.congresses.delete.useMutation({
    onSuccess: () => {
      utils.congresses.list.invalidate();
      setSelectedId(null);
      toast.success("Conference deleted.");
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

  const { data: congressAttendanceData } = trpc.congresses.getCongressAttendance.useQuery(
    { congressId: selectedId! },
    { enabled: !!selectedId }
  );
  const respondCongressAttendanceMutation = trpc.congresses.respondCongressAttendance.useMutation({
    onSuccess: () => { if (selectedId) utils.congresses.getCongressAttendance.invalidate({ congressId: selectedId }); },
    onError: (e) => toast.error(e.message),
  });
  const removeCongressAttendanceMutation = trpc.congresses.removeCongressAttendance.useMutation({
    onSuccess: () => { if (selectedId) utils.congresses.getCongressAttendance.invalidate({ congressId: selectedId }); },
    onError: (e) => toast.error(e.message),
  });

  const { data: proposalAttendance } = trpc.congresses.getProposalAttendance.useQuery(
    { communicationId: selectedProposalId! },
    { enabled: !!selectedProposalId }
  );

  const respondAttendanceMutation = trpc.congresses.respondProposalAttendance.useMutation({
    onSuccess: () => {
      if (selectedProposalId) utils.congresses.getProposalAttendance.invalidate({ communicationId: selectedProposalId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: form.name,
      acronym: form.acronym || undefined,
      description: form.description || undefined,
      topic: form.topic || undefined,
      startDate: form.startDateStr ? new Date(form.startDateStr) : undefined,
      endDate: form.endDateStr ? new Date(form.endDateStr) : undefined,
      location: form.location || undefined,
      country: form.country || undefined,
      modality: form.modality,
      registrationFee: form.registrationFee || undefined,
      websiteUrl: form.websiteUrl || undefined,
      cfpUrl: form.cfpUrl || undefined,
      abstractDeadline: form.abstractDeadlineStr ? new Date(form.abstractDeadlineStr) : undefined,
      paperDeadline: form.paperDeadlineStr ? new Date(form.paperDeadlineStr) : undefined,
      registrationDeadline: form.registrationDeadlineStr ? new Date(form.registrationDeadlineStr) : undefined,
      additionalInfo: form.additionalInfo || undefined,
      notifyEmail,
    });
  };

  const canEdit = detail?.creatorId === user?.id || user?.role === "admin";
  const canDelete = canEdit;

  const updateMutation = trpc.congresses.update.useMutation({
    onSuccess: () => {
      utils.congresses.list.invalidate();
      if (selectedId) utils.congresses.getById.invalidate({ id: selectedId });
      setEditOpen(false);
      toast.success("Conference updated.");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Conferences</h1>
          <Button className="gap-2 font-medium" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />Add Conference
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : congresses?.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No conferences registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {congresses?.map((c) => (
              <div key={c.id} onClick={() => setSelectedId(c.id)} className="glass-card rounded-xl p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-xs">{MODALITY_LABELS[c.modality ?? ""] ?? c.modality}</Badge>
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
            <DialogHeader><DialogTitle className="font-serif">Add Conference</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Conference Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Acronym</Label>
                  <Input value={form.acronym} onChange={(e) => setForm({ ...form, acronym: e.target.value })} placeholder="e.g. ICML 2026" />
                </div>
                <div className="space-y-1.5">
                  <Label>Topic / Area</Label>
                  <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="AI, HCI, Education..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <Label>Paper Deadline</Label>
                  <Input type="date" value={form.paperDeadlineStr} onChange={(e) => setForm({ ...form, paperDeadlineStr: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Registration Deadline</Label>
                  <Input type="date" value={form.registrationDeadlineStr} onChange={(e) => setForm({ ...form, registrationDeadlineStr: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Registration Fee</Label>
                  <Input value={form.registrationFee} onChange={(e) => setForm({ ...form, registrationFee: e.target.value })} placeholder="e.g. €450" />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City" />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Spain" />
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
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <Checkbox id="notifyEmailCongress" checked={notifyEmail} onCheckedChange={(v) => setNotifyEmail(!!v)} />
                <Label htmlFor="notifyEmailCongress" className="cursor-pointer text-sm font-normal text-muted-foreground">
                  Notify members by email
                </Label>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.name || createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Add Conference"}
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
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setEditForm({ name: detail.name, acronym: detail.acronym ?? "", description: detail.description ?? "", topic: detail.topic ?? "", startDateStr: detail.startDate ? new Date(detail.startDate).toISOString().slice(0, 10) : "", endDateStr: detail.endDate ? new Date(detail.endDate).toISOString().slice(0, 10) : "", location: detail.location ?? "", country: detail.country ?? "", modality: (detail.modality ?? "in-person") as any, registrationFee: detail.registrationFee ?? "", websiteUrl: detail.websiteUrl ?? "", cfpUrl: detail.cfpUrl ?? "", abstractDeadlineStr: detail.abstractDeadline ? new Date(detail.abstractDeadline).toISOString().slice(0, 10) : "", paperDeadlineStr: detail.paperDeadline ? new Date(detail.paperDeadline).toISOString().slice(0, 10) : "", registrationDeadlineStr: detail.registrationDeadline ? new Date(detail.registrationDeadline).toISOString().slice(0, 10) : "", additionalInfo: detail.additionalInfo ?? "" }); setEditOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => { if (confirm("Delete this conference?")) deleteMutation.mutate({ id: detail.id }); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{MODALITY_LABELS[detail.modality ?? ""] ?? detail.modality}</Badge>
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

                  {/* Congress-level attendance */}
                  {(() => {
                    const myCongressAttendance = congressAttendanceData?.find((a: any) => a.userId === user?.id)?.response ?? null;
                    const attendingCount = congressAttendanceData?.filter((a: any) => a.response === "attending").length ?? 0;
                    return (
                      <div className="border border-border/50 rounded-lg p-3 space-y-2 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Will you attend this conference?</p>
                          {attendingCount > 0 && <span className="text-xs text-muted-foreground">{attendingCount} attending</span>}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {(["attending", "maybe", "not_attending"] as const).map((r) => (
                            <Button
                              key={r}
                              size="sm"
                              variant={myCongressAttendance === r ? "default" : "outline"}
                              className={`h-7 text-xs gap-1 ${myCongressAttendance === r ? "" : "bg-white/60"}`}
                              onClick={() => {
                                if (myCongressAttendance === r) {
                                  removeCongressAttendanceMutation.mutate({ congressId: detail.id });
                                } else {
                                  respondCongressAttendanceMutation.mutate({ congressId: detail.id, response: r });
                                }
                              }}
                              disabled={respondCongressAttendanceMutation.isPending || removeCongressAttendanceMutation.isPending}
                            >
                              {r === "attending" ? "✓ Will attend" : r === "maybe" ? "? Not sure" : "✗ Cannot attend"}
                            </Button>
                          ))}
                        </div>
                        {congressAttendanceData && congressAttendanceData.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {congressAttendanceData.map((a: any) => (
                              <span key={a.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                a.response === "attending" ? "bg-emerald-50 text-emerald-700" :
                                a.response === "maybe" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                              }`}>
                                {a.userName ?? "Member"} · {a.response === "attending" ? "attending" : a.response === "maybe" ? "not sure" : "cannot attend"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Communication proposals */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Communication Proposals</p>
                    {detail.proposals?.length === 0 && (
                      <p className="text-sm text-muted-foreground">No proposals yet.</p>
                    )}
                    {detail.proposals?.map((p: any) => {
                      const myInterest = p.interests?.some((i: any) => i.userId === user?.id);
                      const isThisSelected = selectedProposalId === p.id;
                      const myAttendance = isThisSelected ? proposalAttendance?.find((a: any) => a.userId === user?.id)?.response : null;
                      return (
                        <div key={p.id} className="glass-card rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{p.title}</p>
                              {p.topic && <p className="text-xs text-muted-foreground">{p.topic}</p>}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {p.interests?.length ?? 0} interested
                                {isThisSelected && proposalAttendance && proposalAttendance.length > 0 && (
                                  <span className="ml-2">· {proposalAttendance.filter((a: any) => a.response === "attending").length} attending</span>
                                )}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                              <Button
                                variant={myInterest ? "default" : "outline"}
                                size="sm"
                                className={`gap-1 h-7 text-xs ${!myInterest ? "bg-white/60" : ""}`}
                                onClick={() => toggleProposalInterestMutation.mutate({ communicationId: p.id })}
                              >
                                {myInterest ? <Star className="w-3 h-3" /> : <StarOff className="w-3 h-3" />}
                                {myInterest ? "Interested" : "Interested?"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => setSelectedProposalId(isThisSelected ? null : p.id)}
                              >
                                {isThisSelected ? "Hide" : "Attendance"}
                              </Button>
                            </div>
                          </div>
                          {isThisSelected && (
                            <div className="border-t border-border/40 pt-2 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">Your attendance:</p>
                              <div className="flex gap-2 flex-wrap">
                                {(["attending", "maybe", "not_attending"] as const).map((r) => (
                                  <Button
                                    key={r}
                                    size="sm"
                                    variant={myAttendance === r ? "default" : "outline"}
                                    className={`h-7 text-xs gap-1 ${myAttendance === r ? "" : "bg-white/60"}`}
                                    onClick={() => respondAttendanceMutation.mutate({ communicationId: p.id, response: r })}
                                    disabled={respondAttendanceMutation.isPending}
                                  >
                                    {r === "attending" ? "✓ Will attend" : r === "maybe" ? "? Not sure" : "✗ Cannot attend"}
                                  </Button>
                                ))}
                              </div>
                              {proposalAttendance && proposalAttendance.length > 0 && (
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p className="font-medium">Responses:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {proposalAttendance.map((a: any) => (
                                      <span key={a.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                                        a.response === "attending" ? "bg-emerald-50 text-emerald-700" :
                                        a.response === "maybe" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                                      }`}>
                                        {a.userName ?? "Member"} · {a.response === "attending" ? "attending" : a.response === "maybe" ? "not sure" : "cannot attend"}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Edit Conference</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Conference Name *</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Acronym</Label>
                <Input value={editForm.acronym} onChange={(e) => setEditForm({ ...editForm, acronym: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Topic / Area</Label>
                <Input value={editForm.topic} onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Modality</Label>
                <Select value={editForm.modality} onValueChange={(v: any) => setEditForm({ ...editForm, modality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODALITIES.map((m) => <SelectItem key={m} value={m}>{MODALITY_LABELS[m]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={editForm.startDateStr} onChange={(e) => setEditForm({ ...editForm, startDateStr: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={editForm.endDateStr} onChange={(e) => setEditForm({ ...editForm, endDateStr: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Abstract Deadline</Label>
                <Input type="date" value={editForm.abstractDeadlineStr} onChange={(e) => setEditForm({ ...editForm, abstractDeadlineStr: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Paper Deadline</Label>
                <Input type="date" value={editForm.paperDeadlineStr} onChange={(e) => setEditForm({ ...editForm, paperDeadlineStr: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Registration Deadline</Label>
                <Input type="date" value={editForm.registrationDeadlineStr} onChange={(e) => setEditForm({ ...editForm, registrationDeadlineStr: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Registration Fee</Label>
                <Input value={editForm.registrationFee} onChange={(e) => setEditForm({ ...editForm, registrationFee: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Website URL</Label>
                <Input value={editForm.websiteUrl} onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>CFP URL</Label>
                <Input value={editForm.cfpUrl} onChange={(e) => setEditForm({ ...editForm, cfpUrl: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Additional Info</Label>
                <Textarea value={editForm.additionalInfo} onChange={(e) => setEditForm({ ...editForm, additionalInfo: e.target.value })} rows={2} />
              </div>
            </div>
            <Button className="w-full" disabled={!editForm.name || updateMutation.isPending}
              onClick={() => selectedId && updateMutation.mutate({ id: selectedId, name: editForm.name, acronym: editForm.acronym || undefined, description: editForm.description || undefined, topic: editForm.topic || undefined, startDate: editForm.startDateStr ? new Date(editForm.startDateStr) : undefined, endDate: editForm.endDateStr ? new Date(editForm.endDateStr) : undefined, location: editForm.location || undefined, country: editForm.country || undefined, modality: editForm.modality, registrationFee: editForm.registrationFee || undefined, websiteUrl: editForm.websiteUrl || undefined, cfpUrl: editForm.cfpUrl || undefined, abstractDeadline: editForm.abstractDeadlineStr ? new Date(editForm.abstractDeadlineStr) : undefined, paperDeadline: editForm.paperDeadlineStr ? new Date(editForm.paperDeadlineStr) : undefined, registrationDeadline: editForm.registrationDeadlineStr ? new Date(editForm.registrationDeadlineStr) : undefined, additionalInfo: editForm.additionalInfo || undefined })}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
