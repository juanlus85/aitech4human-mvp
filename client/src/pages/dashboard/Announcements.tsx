import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Megaphone, Plus, Reply, Trash2, Pin, ChevronDown, ChevronUp, Paperclip, Send, Pencil, Download, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(d: Date | string | null) {
  if (!d) return "";
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

type PendingAttachment = {
  name: string;
  base64: string;
  mimeType: string;
  fileSize: number;
};

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToAttachment(file: File): Promise<PendingAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.split(",")[1];
      if (!base64) { reject(new Error(`Could not read ${file.name}.`)); return; }
      resolve({ name: file.name, base64, mimeType: file.type || "application/octet-stream", fileSize: file.size });
    };
    reader.readAsDataURL(file);
  });
}

function AnnouncementAttachmentPicker({
  attachments,
  onChange,
  inputId,
  disabled = false,
}: {
  attachments: PendingAttachment[];
  onChange: (attachments: PendingAttachment[]) => void;
  inputId: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    if (remainingSlots <= 0) {
      toast.error(`An announcement can include up to ${MAX_ATTACHMENTS} attachments.`);
      return;
    }
    if (selectedFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more attachment${remainingSlots === 1 ? "" : "s"} can be added.`);
    }
    const validFiles = selectedFiles.slice(0, remainingSlots).filter((file) => {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`“${file.name}” is larger than the 20 MB limit.`);
        return false;
      }
      return true;
    });
    try {
      const added = await Promise.all(validFiles.map(fileToAttachment));
      onChange([...attachments, ...added]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read the selected file.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>Attachments</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">Up to 10 files, 20 MB each.</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 bg-white/60" disabled={disabled || attachments.length >= MAX_ATTACHMENTS} onClick={() => inputRef.current?.click()}>
          <Paperclip className="h-3.5 w-3.5" />Attach files
        </Button>
        <input id={inputId} ref={inputRef} type="file" multiple className="hidden" onChange={addFiles} disabled={disabled} />
      </div>
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/50 bg-muted/15 p-2">
          {attachments.map((attachment, index) => (
            <Badge key={`${attachment.name}-${index}`} variant="secondary" className="max-w-full gap-1 py-1 font-normal">
              <Paperclip className="h-3 w-3 shrink-0" />
              <span className="max-w-[13rem] truncate" title={attachment.name}>{attachment.name}</span>
              <span className="text-muted-foreground">{formatBytes(attachment.fileSize)}</span>
              <button type="button" aria-label={`Remove ${attachment.name}`} disabled={disabled} onClick={() => onChange(attachments.filter((_, attachmentIndex) => attachmentIndex !== index))} className="ml-0.5 rounded-sm hover:text-destructive disabled:opacity-50">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Announcements() {
  return (
    <DashboardLayout>
      <AnnouncementsContent />
    </DashboardLayout>
  );
}

function AnnouncementsContent() {
  const { user, isAdmin } = useAuth();
  const utils = trpc.useUtils();

  const { data: list = [], isLoading } = trpc.announcements.list.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [expandedBodies, setExpandedBodies] = useState<Set<number>>(new Set());
  const [editAnn, setEditAnn] = useState<{ id: number; subject: string; body: string; isPinned: boolean } | null>(null);
  const [editAttachments, setEditAttachments] = useState<PendingAttachment[]>([]);
  const toggleBody = (id: number) => setExpandedBodies((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const { data: detail } = trpc.announcements.getById.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate();
      if (selectedId) setSelectedId(null);
      toast.success("Announcement deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate();
      setEditAnn(null);
      setEditAttachments([]);
      toast.success("Announcement updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAttachmentMutation = trpc.announcements.deleteAttachment.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate();
      if (selectedId) utils.announcements.getById.invalidate({ id: selectedId });
      toast.success("Attachment deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  const toggleReplies = (id: number) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectedId(id);
  };

  const getReplyLabel = (replyCount: number) => {
    if (replyCount <= 0) return "Reply";
    return `Reply (${replyCount} ${replyCount === 1 ? "reply" : "replies"})`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Announcements</h1>
            <p className="text-sm text-muted-foreground">Group announcements and discussions</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No announcements yet</p>
          <p className="text-sm mt-1">Be the first to post an announcement.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((ann) => {
            const isExpanded = expandedReplies.has(ann.id);
            const isOwner = ann.authorId === user?.id;
            return (
              <div key={ann.id} className="glass-card rounded-xl border border-border/50 overflow-hidden">
                {/* Announcement header */}
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {initials(ann.authorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{ann.authorName ?? "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(ann.createdAt)}</span>
                        {ann.isPinned && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Pin className="w-3 h-3" /> Pinned
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-semibold text-base text-foreground mt-1">{ann.subject}</h2>
                      <div className="mt-1">
                        <p
                          className={`text-sm text-muted-foreground whitespace-pre-wrap transition-all ${expandedBodies.has(ann.id) ? '' : 'line-clamp-3'}`}
                        >
                          {ann.body}
                        </p>
                        {ann.body.length > 180 && (
                          <button
                            onClick={() => toggleBody(ann.id)}
                            className="text-xs text-primary hover:underline mt-1 font-medium"
                          >
                            {expandedBodies.has(ann.id) ? 'Show less ▲' : 'Read more ▼'}
                          </button>
                        )}
                      </div>
                      {ann.attachments && ann.attachments.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Attachments</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ann.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex max-w-full items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-xs">
                                <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="max-w-[13rem] truncate text-primary hover:underline" title={attachment.fileName}>
                                  {attachment.fileName}
                                </a>
                                <span className="text-muted-foreground">{formatBytes(attachment.fileSize)}</span>
                                <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Download ${attachment.fileName}`} className="ml-0.5 text-muted-foreground hover:text-foreground">
                                  <Download className="h-3 w-3" />
                                </a>
                                {(isOwner || isAdmin) && (
                                  <button
                                    type="button"
                                    aria-label={`Delete ${attachment.fileName}`}
                                    onClick={() => { if (confirm(`Delete attachment “${attachment.fileName}”?`)) deleteAttachmentMutation.mutate({ id: attachment.id }); }}
                                    className="ml-0.5 text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(isOwner || isAdmin) && (
                        <>
                          <button
                            onClick={() => {
                              setEditAnn({ id: ann.id, subject: ann.subject, body: ann.body, isPinned: !!ann.isPinned });
                              setEditAttachments([]);
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate({ id: ann.id })}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies toggle */}
                <div className="border-t border-border/50 px-5 py-2.5 flex items-center gap-4 bg-muted/20">
                  <button
                    onClick={() => toggleReplies(ann.id)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                    <span>{getReplyLabel(ann.replyCount ?? 0)}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Thread */}
                {isExpanded && selectedId === ann.id && detail && (
                  <ThreadSection
                    announcementId={ann.id}
                    detail={detail}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <CreateAnnouncementDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          utils.announcements.list.invalidate();
          setShowCreate(false);
        }}
      />
      {/* Edit dialog */}
      <Dialog open={!!editAnn} onOpenChange={(v) => !v && setEditAnn(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">Edit Announcement</DialogTitle></DialogHeader>
          {editAnn && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Input value={editAnn.subject} onChange={(e) => setEditAnn({ ...editAnn, subject: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Message *</Label>
                <Textarea value={editAnn.body} onChange={(e) => setEditAnn({ ...editAnn, body: e.target.value })} rows={6} />
              </div>
              <AnnouncementAttachmentPicker attachments={editAttachments} onChange={setEditAttachments} inputId="edit-announcement-attachments" disabled={updateMutation.isPending} />
              <div className="flex items-center gap-2">
                <Checkbox id="editIsPinned" checked={editAnn.isPinned} onCheckedChange={(v) => setEditAnn({ ...editAnn, isPinned: !!v })} />
                <Label htmlFor="editIsPinned" className="cursor-pointer text-sm font-normal">Pin this announcement</Label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setEditAnn(null); setEditAttachments([]); }}>Cancel</Button>
                <Button disabled={!editAnn.subject.trim() || !editAnn.body.trim() || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({
                    id: editAnn.id,
                    subject: editAnn.subject,
                    body: editAnn.body,
                    isPinned: editAnn.isPinned,
                    attachments: editAttachments.map(({ name, ...attachment }) => ({ ...attachment, fileName: name })),
                  })}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ThreadSection({
  announcementId,
  detail,
  currentUserId,
  isAdmin,
}: {
  announcementId: number;
  detail: { replies: Array<{ id: number; authorId: number; authorName?: string | null; body: string; createdAt: Date | string }> };
  currentUserId?: number;
  isAdmin: boolean;
}) {
  const utils = trpc.useUtils();
  const [replyText, setReplyText] = useState("");

  const replyMutation = trpc.announcements.reply.useMutation({
    onSuccess: () => {
      utils.announcements.getById.invalidate({ id: announcementId });
      utils.announcements.list.invalidate();
      setReplyText("");
      toast.success("Reply posted");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteReplyMutation = trpc.announcements.deleteReply.useMutation({
    onSuccess: () => {
      utils.announcements.getById.invalidate({ id: announcementId });
      utils.announcements.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="border-t border-border/50 bg-background/50">
      {/* Existing replies */}
      {detail.replies.length > 0 && (
        <div className="px-5 py-3 space-y-3">
          {detail.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-secondary-foreground shrink-0">
                {initials(reply.authorName)}
              </div>
              <div className="flex-1 min-w-0 bg-muted/40 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{reply.authorName ?? "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                  {(reply.authorId === currentUserId || isAdmin) && (
                    <button
                      onClick={() => deleteReplyMutation.mutate({ id: reply.id })}
                      className="ml-auto p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{reply.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      <div className="px-5 py-3 flex items-end gap-2 border-t border-border/30">
        <Textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write a reply..."
          rows={2}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              if (replyText.trim()) replyMutation.mutate({ announcementId, body: replyText.trim() });
            }
          }}
        />
        <Button
          size="sm"
          disabled={!replyText.trim() || replyMutation.isPending}
          onClick={() => replyMutation.mutate({ announcementId, body: replyText.trim() })}
          className="gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          {replyMutation.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}

function CreateAnnouncementDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

  const resetForm = () => {
    setSubject("");
    setBody("");
    setIsPinned(false);
    setNotifyEmail(false);
    setAttachments([]);
  };

  const closeDialog = () => {
    resetForm();
    onClose();
  };

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      toast.success("Announcement published");
      resetForm();
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    createMutation.mutate({
      subject: subject.trim(),
      body: body.trim(),
      isPinned,
      notifyEmail,
      attachments: attachments.map(({ name, ...attachment }) => ({ ...attachment, fileName: name })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">New Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Announcement subject..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement here..."
              rows={6}
              required
            />
          </div>
          <AnnouncementAttachmentPicker attachments={attachments} onChange={setAttachments} inputId="new-announcement-attachments" disabled={createMutation.isPending} />
          <div className="flex items-center gap-2">
            <Checkbox
              id="isPinned"
              checked={isPinned}
              onCheckedChange={(v) => setIsPinned(!!v)}
            />
            <Label htmlFor="isPinned" className="cursor-pointer text-sm font-normal">
              Pin this announcement to the top
            </Label>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <Checkbox
              id="notifyEmail"
              checked={notifyEmail}
              onCheckedChange={(v) => setNotifyEmail(!!v)}
            />
            <Label htmlFor="notifyEmail" className="cursor-pointer text-sm font-normal text-muted-foreground">
              Notify members by email
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !subject.trim() || !body.trim()}>
              {createMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
