import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { Plus, Paperclip, Send, Reply, ReplyAll, Inbox, SendHorizonal, Download, UsersRound } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipientIds: [] as number[], subject: "", body: "" });
  const [replyBody, setReplyBody] = useState("");
  const [replyMode, setReplyMode] = useState<"sender" | "all">("sender");
  const attachRef = useRef<HTMLInputElement>(null);
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string; base64: string; mimeType: string; size: number }[]>([]);

  useEffect(() => {
    const messageParam = new URLSearchParams(window.location.search).get("message");
    const messageId = Number(messageParam);
    if (Number.isInteger(messageId) && messageId > 0) {
      setSelectedId(messageId);
    }
  }, []);

  const { data: inbox } = trpc.messages.inbox.useQuery();
  const { data: sent } = trpc.messages.sent.useQuery();
  const { data: recipients } = trpc.messages.recipients.useQuery();
  const { data: selectedMsg } = trpc.messages.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      utils.messages.inbox.invalidate();
      utils.messages.sent.invalidate();
      setComposeOpen(false);
      setComposeForm({ recipientIds: [], subject: "", body: "" });
      setPendingAttachments([]);
      toast.success("Message sent.");
    },
    onError: (e) => toast.error(e.message),
  });

  const replyMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      utils.messages.inbox.invalidate();
      utils.messages.sent.invalidate();
      if (selectedId) utils.messages.getById.invalidate({ id: selectedId });
      setReplyOpen(false);
      setReplyBody("");
      setReplyMode("sender");
      toast.success("Reply sent.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setPendingAttachments((prev) => [...prev, { name: file.name, base64, mimeType: file.type, size: file.size }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const unreadCount = inbox?.filter((m) => !m.isReadByRecipient && m.recipientId === user?.id).length ?? 0;
  const allRecipientsSelected = (recipients?.length ?? 0) > 0 && composeForm.recipientIds.length === recipients?.length;
  const toggleRecipient = (recipientId: number) => {
    setComposeForm((current) => ({
      ...current,
      recipientIds: current.recipientIds.includes(recipientId)
        ? current.recipientIds.filter((id) => id !== recipientId)
        : [...current.recipientIds, recipientId],
    }));
  };
  const toggleAllRecipients = () => {
    setComposeForm((current) => ({
      ...current,
      recipientIds: allRecipientsSelected ? [] : (recipients?.map((recipient) => recipient.id) ?? []),
    }));
  };
  const allReplyRecipientIds = selectedMsg
    ? Array.from(new Set([selectedMsg.senderId, ...(selectedMsg.recipients ?? []).map((recipient: any) => recipient.userId)]))
      .filter((recipientId) => recipientId !== user?.id)
    : [];
  const senderReplyRecipientId = selectedMsg?.senderId === user?.id
    ? allReplyRecipientIds[0]
    : selectedMsg?.senderId;
  const activeReplyRecipientIds = replyMode === "all"
    ? allReplyRecipientIds
    : senderReplyRecipientId ? [senderReplyRecipientId] : [];
  const activeReplyRecipientNames = selectedMsg
    ? activeReplyRecipientIds.map((recipientId) => {
      if (recipientId === selectedMsg.senderId) return selectedMsg.senderName;
      return selectedMsg.recipients?.find((recipient: any) => recipient.userId === recipientId)?.name;
    }).filter(Boolean).join(", ")
    : "";

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Messages</h1>
          <Button className="gap-2 font-medium" onClick={() => setComposeOpen(true)}>
            <Plus className="w-4 h-4" />Compose
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden flex flex-col max-h-[42vh] lg:max-h-none">
            <Tabs defaultValue="inbox" className="flex flex-col h-full">
              <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-10">
                <TabsTrigger value="inbox" className="flex-1 gap-1.5 text-xs">
                  <Inbox className="w-3.5 h-3.5" />Inbox
                  {unreadCount > 0 && (
                    <Badge className="h-4 px-1 text-[10px] bg-primary">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-1 gap-1.5 text-xs">
                  <SendHorizonal className="w-3.5 h-3.5" />Sent
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inbox" className="flex-1 overflow-y-auto p-2 space-y-1 mt-0">
                {inbox?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No messages</p>}
                {inbox?.map((msg) => {
                  const isUnread = !msg.isReadByRecipient && msg.recipientId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedId(msg.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedId === msg.id ? "bg-primary/10" : "hover:bg-muted/50"} ${isUnread ? "font-medium" : ""}`}
                    >
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {(msg.senderName || "?").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm truncate">{msg.senderName}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {format(new Date(msg.createdAt), "MMM d")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.subject}</p>
                        {isUnread && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />}
                      </div>
                      {msg.senderId !== user?.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                          aria-label={`Reply to ${msg.senderName ?? "sender"}`}
                          title="Reply"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(msg.id);
                            setReplyMode("sender");
                            setReplyOpen(true);
                          }}
                        >
                          <Reply className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </TabsContent>
              <TabsContent value="sent" className="flex-1 overflow-y-auto p-2 space-y-1 mt-0">
                {sent?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No sent messages</p>}
                {sent?.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedId(msg.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedId === msg.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(msg.recipientName || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm truncate">To: {msg.recipientName}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {format(new Date(msg.createdAt), "MMM d")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.subject}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Message view */}
          <div className="lg:col-span-3 glass-card rounded-xl overflow-hidden flex flex-col min-h-[360px] lg:min-h-0">
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a message to read</p>
                </div>
              </div>
            ) : selectedMsg ? (
              <>
                <div className="p-4 border-b border-border/50 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif font-semibold text-foreground">{selectedMsg.subject}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      From: {selectedMsg.senderName} · {format(new Date(selectedMsg.createdAt), "MMM d, yyyy · HH:mm")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      To: {selectedMsg.recipients?.map((recipient: any) => recipient.name).join(", ") || "Unknown"}
                    </p>
                  </div>
                  {allReplyRecipientIds.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" className="gap-1.5 bg-white/60" onClick={() => { setReplyMode("sender"); setReplyOpen(true); }}>
                        <Reply className="w-3.5 h-3.5" />Reply
                      </Button>
                      {allReplyRecipientIds.length > 1 && (
                        <Button variant="outline" size="sm" className="gap-1.5 bg-white/60" onClick={() => { setReplyMode("all"); setReplyOpen(true); }}>
                          <ReplyAll className="w-3.5 h-3.5" />Reply all
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{selectedMsg.body}</p>
                  {selectedMsg.attachments?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attachments</p>
                      {selectedMsg.attachments.map((att: any) => (
                        <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Download className="w-3.5 h-3.5" />{att.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            )}
          </div>
        </div>

        {/* Compose dialog */}
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-serif">New Message</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMutation.mutate({
                  recipientIds: composeForm.recipientIds,
                  subject: composeForm.subject,
                  body: composeForm.body,
                  attachments: pendingAttachments.map((attachment) => ({
                    base64: attachment.base64,
                    fileName: attachment.name,
                    mimeType: attachment.mimeType,
                    fileSize: attachment.size,
                  })),
                });
              }}
              className="space-y-4 mt-2"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Recipients *</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary" onClick={toggleAllRecipients} disabled={!recipients?.length}>
                    <UsersRound className="w-3.5 h-3.5 mr-1" />{allRecipientsSelected ? "Clear all" : "Select all"}
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40 bg-muted/10">
                  {recipients?.map((recipient) => {
                    const checked = composeForm.recipientIds.includes(recipient.id);
                    return (
                      <label key={recipient.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                        <Checkbox checked={checked} onCheckedChange={() => toggleRecipient(recipient.id)} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground truncate">
                            {recipient.name}{recipient.id === user?.id && <Badge variant="secondary" className="h-4 px-1 text-[9px]">Me</Badge>}
                          </span>
                          <span className="block text-xs text-muted-foreground truncate">{recipient.email}</span>
                        </span>
                      </label>
                    );
                  })}
                  {!recipients?.length && <p className="px-3 py-4 text-sm text-muted-foreground">Loading members...</p>}
                </div>
                <p className="text-xs text-muted-foreground">{composeForm.recipientIds.length === 0 ? "Select one or more recipients." : `${composeForm.recipientIds.length} recipient${composeForm.recipientIds.length === 1 ? "" : "s"} selected.`}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={composeForm.subject} onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea value={composeForm.body} onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })} rows={5} required />
              </div>
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pendingAttachments.map((a, i) => (
                    <Badge key={i} variant="secondary" className="text-xs gap-1">
                      <Paperclip className="w-3 h-3" />{a.name}
                      <button type="button" onClick={() => setPendingAttachments((prev) => prev.filter((_, j) => j !== i))} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5 bg-white/60" onClick={() => attachRef.current?.click()}>
                  <Paperclip className="w-3.5 h-3.5" />Attach
                </Button>
                <input ref={attachRef} type="file" multiple className="hidden" onChange={handleAttach} />
                <Button type="submit" className="flex-1 gap-1.5" disabled={sendMutation.isPending || composeForm.recipientIds.length === 0}>
                  <Send className="w-3.5 h-3.5" />{sendMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reply dialog */}
        <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-serif">Reply</DialogTitle></DialogHeader>
            {!selectedMsg ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading message details…</p>
            ) : (
              <>
              <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedMsg || activeReplyRecipientIds.length === 0) return;
                replyMutation.mutate({
                  recipientIds: activeReplyRecipientIds,
                  subject: `Re: ${selectedMsg.subject}`,
                  body: replyBody,
                  parentId: selectedMsg.id,
                });
              }}
              className="space-y-4 mt-2"
            >
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{replyMode === "all" ? "Replying to all" : "Replying to"}</p>
                <p className="mt-1 text-sm text-foreground truncate">{activeReplyRecipientNames || "Original sender"}</p>
              </div>
              {allReplyRecipientIds.length > 1 && (
                <div className="flex items-center gap-5 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="replyMode" checked={replyMode === "sender"} onChange={() => setReplyMode("sender")} />
                    Reply to sender
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="replyMode" checked={replyMode === "all"} onChange={() => setReplyMode("all")} />
                    Reply all
                  </label>
                </div>
              )}
              <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={5} placeholder="Write your reply..." required />
              <Button type="submit" className="w-full gap-1.5" disabled={replyMutation.isPending || activeReplyRecipientIds.length === 0}>
                <Send className="w-3.5 h-3.5" />{replyMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </form>
              <div className="border-t border-border/40 pt-3 mt-1 space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  ——— Original message from {selectedMsg.senderName ?? "Unknown"} · {format(new Date(selectedMsg.createdAt), "MMM d, yyyy 'at' HH:mm")} ———
                </p>
                <p className="text-xs font-semibold text-muted-foreground">{selectedMsg.subject}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed border-l-2 border-border/50 pl-3 max-h-32 overflow-y-auto">{selectedMsg.body}</p>
              </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
