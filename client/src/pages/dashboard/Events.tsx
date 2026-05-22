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
import { Plus, Globe, CalendarDays, MapPin, Trash2, ChevronRight, Star, Video } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const MODALITY_LABELS: Record<string, string> = {
  "in-person": "In Person",
  "online": "Online",
  "hybrid": "Hybrid",
};

export default function Events() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const emptyForm = {
    title: "", description: "", topic: "",
    eventDateStr: "", endDateStr: "", location: "",
    modality: "in-person" as "in-person" | "online" | "hybrid",
    websiteUrl: "",
  };
  const [form, setForm] = useState(emptyForm);

  const { data: events, isLoading } = trpc.events.list.useQuery();
  const { data: detail } = trpc.events.getById.useQuery({ id: selected?.id ?? 0 }, { enabled: !!selected?.id });

  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      utils.events.list.invalidate();
      setCreateOpen(false);
      setForm(emptyForm);
      toast.success("Event added.");
    },
    onError: (e) => toast.error(e.message),
  });

  const interestMutation = trpc.events.toggleInterest.useMutation({
    onSuccess: () => utils.events.getById.invalidate({ id: selected?.id ?? 0 }),
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: () => { utils.events.list.invalidate(); setSelected(null); toast.success("Event deleted."); },
  });

  const isInterested = detail?.interests?.some((i: any) => i.userId === user?.id);

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Events</h1>
          <Button className="gap-2 font-medium" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />Add Event
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : events?.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No events registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events?.map((ev) => (
              <div key={ev.id} onClick={() => setSelected(ev)} className="glass-card rounded-xl p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {ev.modality && <Badge variant="outline" className="text-xs">{MODALITY_LABELS[ev.modality] ?? ev.modality}</Badge>}
                      {ev.topic && <Badge variant="secondary" className="text-xs">{ev.topic}</Badge>}
                    </div>
                    <h3 className="font-serif font-semibold text-foreground line-clamp-2">{ev.title}</h3>
                    {ev.eventDate && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(ev.eventDate), "MMM d, yyyy")}
                        {ev.endDate && ` – ${format(new Date(ev.endDate), "MMM d, yyyy")}`}
                      </p>
                    )}
                    {ev.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{ev.location}
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
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Add Event</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Topic / Area</Label>
                <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="AI, Education, HCI..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="datetime-local" value={form.eventDateStr} onChange={(e) => setForm({ ...form, eventDateStr: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="datetime-local" value={form.endDateStr} onChange={(e) => setForm({ ...form, endDateStr: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Modality</Label>
                <Select value={form.modality} onValueChange={(v: any) => setForm({ ...form, modality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In Person</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, venue..." />
              </div>
              <div className="space-y-1.5">
                <Label>Website URL</Label>
                <Input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <Checkbox id="notifyEmailEvent" />
                <Label htmlFor="notifyEmailEvent" className="cursor-pointer text-sm font-normal text-muted-foreground">
                  Notify members by email
                </Label>
              </div>
              <Button className="w-full"
                onClick={() => createMutation.mutate({
                  title: form.title,
                  description: form.description || undefined,
                  eventDate: form.eventDateStr ? new Date(form.eventDateStr) : undefined,
                  endDate: form.endDateStr ? new Date(form.endDateStr) : undefined,
                  location: form.location || undefined,
                  modality: form.modality,
                  websiteUrl: form.websiteUrl || undefined,
                  topic: form.topic || undefined,
                })}
                disabled={!form.title || createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Add Event"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            {detail && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-2">
                    <DialogTitle className="font-serif text-xl flex-1">{detail.title}</DialogTitle>
                    {(detail.creatorId === user?.id || user?.role === "admin") && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                        onClick={() => { if (confirm("Delete this event?")) deleteMutation.mutate({ id: detail.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {detail.modality && <Badge variant="outline">{MODALITY_LABELS[detail.modality] ?? detail.modality}</Badge>}
                    {detail.topic && <Badge variant="secondary">{detail.topic}</Badge>}
                  </div>

                  {detail.eventDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="w-4 h-4" />
                      {format(new Date(detail.eventDate), "EEEE, MMMM d, yyyy")}
                      {detail.endDate && ` – ${format(new Date(detail.endDate), "MMMM d, yyyy")}`}
                    </div>
                  )}

                  {detail.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />{detail.location}
                    </div>
                  )}

                  {detail.websiteUrl && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Globe className="w-4 h-4" />
                      <a href={detail.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{detail.websiteUrl}</a>
                    </div>
                  )}

                  {detail.description && <p className="text-sm text-muted-foreground leading-relaxed">{detail.description}</p>}

                  <div className="pt-2 border-t border-border/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        <Star className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                        {detail.interests?.length ?? 0} member{(detail.interests?.length ?? 0) !== 1 ? "s" : ""} interested
                      </p>
                      <Button
                        variant={isInterested ? "default" : "outline"}
                        size="sm"
                        className={`gap-1.5 ${!isInterested ? "bg-white/60" : ""}`}
                        onClick={() => interestMutation.mutate({ eventId: detail.id })}
                      >
                        <Star className="w-3.5 h-3.5" />
                        {isInterested ? "Interested ✓" : "Mark as interested"}
                      </Button>
                    </div>
                    {detail.interests && detail.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {detail.interests.map((i: any) => (
                          <span key={i.userId} className="text-xs bg-muted/60 text-muted-foreground rounded-full px-2.5 py-1 border border-border/30">
                            {i.userName ?? `Member #${i.userId}`}
                          </span>
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
