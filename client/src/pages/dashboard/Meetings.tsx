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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, CalendarDays, Video, MapPin, Clock, Vote, CheckCircle2, HelpCircle, XCircle, Trash2, ChevronRight, Link2 } from "lucide-react";

const ATTENDANCE = [
  { value: "attending" as const, label: "I will attend", icon: CheckCircle2, color: "text-emerald-600" },
  { value: "maybe" as const, label: "Not sure", icon: HelpCircle, color: "text-amber-600" },
  { value: "not_attending" as const, label: "Cannot attend", icon: XCircle, color: "text-red-500" },
];

const MODALITY_LABELS: Record<string, string> = {
  "online": "Online",
  "in-person": "In Person",
  "hybrid": "Hybrid",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Meetings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "fixed" as "fixed" | "poll",
    modality: "online" as "online" | "in-person" | "hybrid",
    fixedDateStr: "",
    pollDeadlineStr: "",
    location: "",
    meetingLink: "",
    agenda: "",
    dateOptionStrs: ["", ""],
  });

  const { data: meetings, isLoading } = trpc.meetings.list.useQuery();
  const { data: detail } = trpc.meetings.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const createMutation = trpc.meetings.create.useMutation({
    onSuccess: () => {
      utils.meetings.list.invalidate();
      setCreateOpen(false);
      resetForm();
      toast.success("Meeting created.");
    },
    onError: (e) => toast.error(e.message),
  });

  const respondMutation = trpc.meetings.respond.useMutation({
    onSuccess: () => {
      if (selectedId) utils.meetings.getById.invalidate({ id: selectedId });
      toast.success("Response saved.");
    },
    onError: (e) => toast.error(e.message),
  });

  const voteMutation = trpc.meetings.voteDate.useMutation({
    onSuccess: () => {
      if (selectedId) utils.meetings.getById.invalidate({ id: selectedId });
    },
    onError: (e) => toast.error(e.message),
  });

  const finalizeMutation = trpc.meetings.finalizePollDate.useMutation({
    onSuccess: () => {
      if (selectedId) utils.meetings.getById.invalidate({ id: selectedId });
      utils.meetings.list.invalidate();
      toast.success("Date finalized.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => {
      utils.meetings.list.invalidate();
      setSelectedId(null);
      toast.success("Meeting deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({
    title: "", description: "", type: "fixed", modality: "online",
    fixedDateStr: "", pollDeadlineStr: "", location: "", meetingLink: "",
    agenda: "", dateOptionStrs: ["", ""],
  });

  const handleCreate = () => {
    const payload: any = {
      title: form.title,
      description: form.description || undefined,
      modality: form.modality,
      location: form.location || undefined,
      meetingLink: form.meetingLink || undefined,
      agenda: form.agenda || undefined,
      type: form.type,
    };
    if (form.type === "fixed" && form.fixedDateStr) {
      payload.fixedDate = new Date(form.fixedDateStr);
    }
    if (form.type === "poll") {
      if (form.pollDeadlineStr) payload.pollDeadline = new Date(form.pollDeadlineStr);
      payload.dateOptions = form.dateOptionStrs.filter(Boolean).map((s) => new Date(s));
    }
    createMutation.mutate(payload);
  };

  const myAttendance = detail?.attendance?.find((a: any) => a.userId === user?.id);

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Meetings</h1>
          <Button className="gap-2 font-medium" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />Schedule Meeting
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : meetings?.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No meetings yet. Schedule the first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings?.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="glass-card rounded-xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={m.type === "fixed" ? "default" : "secondary"} className="text-xs gap-1">
                        {m.type === "fixed" ? <CalendarDays className="w-3 h-3" /> : <Vote className="w-3 h-3" />}
                        {m.type === "fixed" ? "Fixed date" : "Date poll"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{MODALITY_LABELS[m.modality] ?? m.modality}</Badge>
                    </div>
                    <h3 className="font-serif font-semibold text-foreground line-clamp-1">{m.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {m.type === "fixed" && m.fixedDate
                        ? format(new Date(m.fixedDate), "EEEE, MMMM d, yyyy · HH:mm")
                        : "Awaiting date vote"}
                    </p>
                    {m.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        {m.modality === "online" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {m.location}
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
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Schedule a Meeting</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Meeting Type</Label>
                <RadioGroup value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "fixed" | "poll" })} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="cursor-pointer">Fixed date</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="poll" id="poll" />
                    <Label htmlFor="poll" className="cursor-pointer">Date poll (vote)</Label>
                  </div>
                </RadioGroup>
              </div>

              {form.type === "fixed" ? (
                <div className="space-y-1.5">
                  <Label>Date &amp; Time *</Label>
                  <Input type="datetime-local" value={form.fixedDateStr} onChange={(e) => setForm({ ...form, fixedDateStr: e.target.value })} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Poll Deadline</Label>
                  <Input type="datetime-local" value={form.pollDeadlineStr} onChange={(e) => setForm({ ...form, pollDeadlineStr: e.target.value })} />
                  <Label className="mt-2 block">Proposed Date Options</Label>
                  {form.dateOptionStrs.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="datetime-local"
                        value={opt}
                        onChange={(e) => {
                          const opts = [...form.dateOptionStrs];
                          opts[i] = e.target.value;
                          setForm({ ...form, dateOptionStrs: opts });
                        }}
                      />
                      {form.dateOptionStrs.length > 2 && (
                        <Button type="button" variant="ghost" size="icon"
                          onClick={() => setForm({ ...form, dateOptionStrs: form.dateOptionStrs.filter((_, j) => j !== i) })}>
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setForm({ ...form, dateOptionStrs: [...form.dateOptionStrs, ""] })}>
                    + Add option
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Modality</Label>
                <Select value={form.modality} onValueChange={(v: any) => setForm({ ...form, modality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in-person">In Person</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location / Address</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room, building, or address..." />
              </div>
              <div className="space-y-1.5">
                <Label>Meeting Link</Label>
                <Input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://zoom.us/..." />
              </div>
              <div className="space-y-1.5">
                <Label>Agenda / Topics</Label>
                <Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={3} placeholder="Topics to discuss..." />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.title || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Meeting"}
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
                  <div className="flex items-start justify-between gap-3">
                    <DialogTitle className="font-serif text-xl">{detail.title}</DialogTitle>
                    {(detail.organizerId === user?.id || user?.role === "admin") && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                        onClick={() => { if (confirm("Delete this meeting?")) deleteMutation.mutate({ id: detail.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      {detail.type === "fixed" ? <CalendarDays className="w-3 h-3" /> : <Vote className="w-3 h-3" />}
                      {detail.type === "fixed" ? "Fixed date" : "Date poll"}
                    </Badge>
                    <Badge variant="outline">{MODALITY_LABELS[detail.modality] ?? detail.modality}</Badge>
                    {detail.status && (
                      <Badge className={STATUS_COLORS[detail.status] ?? ""}>{detail.status}</Badge>
                    )}
                  </div>

                  {detail.type === "fixed" && detail.fixedDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {format(new Date(detail.fixedDate), "EEEE, MMMM d, yyyy · HH:mm")}
                    </div>
                  )}

                  {detail.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {detail.modality === "online" ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      {detail.location}
                    </div>
                  )}

                  {detail.meetingLink && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Link2 className="w-4 h-4" />
                      <a href={detail.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{detail.meetingLink}</a>
                    </div>
                  )}

                  {detail.agenda && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Agenda</p>
                      <p className="text-sm text-foreground whitespace-pre-line">{detail.agenda}</p>
                    </div>
                  )}

                  {/* Attendance for fixed meetings */}
                  {detail.type === "fixed" && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Your Attendance</p>
                      <div className="flex gap-2 flex-wrap">
                        {ATTENDANCE.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = myAttendance?.response === opt.value;
                          return (
                            <Button
                              key={opt.value}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={`gap-1.5 ${!isSelected ? "bg-white/60" : ""}`}
                              onClick={() => respondMutation.mutate({ meetingId: detail.id, response: opt.value })}
                            >
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? "" : opt.color}`} />
                              {opt.label}
                            </Button>
                          );
                        })}
                      </div>

                      {detail.attendance?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Responses</p>
                          {detail.attendance.map((a: any) => (
                            <div key={a.id} className="flex items-center justify-between text-sm">
                              <span className="text-foreground">{a.userName ?? `Member #${a.userId}`}</span>
                              <Badge variant="secondary" className="text-xs capitalize">{a.response.replace("_", " ")}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date poll voting */}
                  {detail.type === "poll" && detail.dateOptions?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Vote for a Date</p>
                      <div className="space-y-2">
                        {detail.dateOptions.map((opt: any) => {
                          const hasVoted = opt.votes?.some((v: any) => v.userId === user?.id);
                          const isOrganizer = detail.organizerId === user?.id || user?.role === "admin";
                          return (
                            <div key={opt.id} className="flex items-center justify-between gap-3 p-3 glass-card rounded-lg">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-sm">{format(new Date(opt.proposedDate), "EEE, MMM d · HH:mm")}</span>
                                <Badge variant="secondary" className="text-xs">{opt.votes?.length ?? 0} votes</Badge>
                              </div>
                              <div className="flex gap-1.5">
                                <Button
                                  variant={hasVoted ? "default" : "outline"}
                                  size="sm"
                                  className={`h-7 text-xs ${!hasVoted ? "bg-white/60" : ""}`}
                                  onClick={() => voteMutation.mutate({ dateOptionId: opt.id })}
                                >
                                  {hasVoted ? "Voted ✓" : "Vote"}
                                </Button>
                                {isOrganizer && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs bg-white/60"
                                    onClick={() => finalizeMutation.mutate({ meetingId: detail.id, dateOptionId: opt.id })}
                                  >
                                    Finalize
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
