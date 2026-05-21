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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { Plus, Paperclip, Send, Reply, Inbox, SendHorizonal, Download } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipientId: "", subject: "", body: "" });
  const [replyBody, setReplyBody] = useState("");
  const attachRef = useRef<HTMLInputElement>(null);
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string; base64: string; mimeType: string; size: number }[]>([]);

  const { data: inbox } = trpc.messages.inbox.useQuery();
  const { data: sent } = trpc.messages.sent.useQuery();
  const { data: selectedMsg } = trpc.messages.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );
  const { data: members } = trpc.profiles.publicList.useQuery();

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: async (msg) => {
      utils.messages.inbox.invalidate();
      utils.messages.sent.invalidate();
      // Upload attachments if any
      for (const att of pendingAttachments) {
        if (msg?.id) {
          await uploadAttachmentMutation.mutateAsync({
            messageId: msg.id,
            base64: att.base64,
            fileName: att.name,
            mimeType: att.mimeType,
            fileSize: att.size,
          });
        }
      }
      setComposeOpen(false);
      setComposeForm({ recipientId: "", subject: "", body: "" });
      setPendingAttachments([]);
      toast.success("Message sent.");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadAttachmentMutation = trpc.messages.uploadAttachment.useMutation();

  const replyMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      utils.messages.inbox.invalidate();
      utils.messages.sent.invalidate();
      if (selectedId) utils.messages.getById.invalidate({ id: selectedId });
      setReplyOpen(false);
      setReplyBody("");
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Messages</h1>
          <Button className="gap-2 font-medium" onClick={() => setComposeOpen(true)}>
            <Plus className="w-4 h-4" />Compose
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden flex flex-col">
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
          <div className="lg:col-span-3 glass-card rounded-xl overflow-hidden flex flex-col">
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
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 bg-white/60 shrink-0" onClick={() => setReplyOpen(true)}>
                    <Reply className="w-3.5 h-3.5" />Reply
                  </Button>
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
                  recipientId: parseInt(composeForm.recipientId),
                  subject: composeForm.subject,
                  body: composeForm.body,
                });
              }}
              className="space-y-4 mt-2"
            >
              <div className="space-y-1.5">
                <Label>To</Label>
                <Select value={composeForm.recipientId} onValueChange={(v) => setComposeForm({ ...composeForm, recipientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select recipient..." /></SelectTrigger>
                  <SelectContent>
                    {members?.filter((m) => m.userId !== user?.id).map((m) => (
                      <SelectItem key={m.userId} value={String(m.userId)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5 bg-white/60" onClick={() => attachRef.current?.click()}>
                  <Paperclip className="w-3.5 h-3.5" />Attach
                </Button>
                <input ref={attachRef} type="file" multiple className="hidden" onChange={handleAttach} />
                <Button type="submit" className="flex-1 gap-1.5" disabled={sendMutation.isPending}>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedMsg) return;
                replyMutation.mutate({
                  recipientId: selectedMsg.senderId === user?.id ? selectedMsg.recipientId : selectedMsg.senderId,
                  subject: `Re: ${selectedMsg.subject}`,
                  body: replyBody,
                  parentId: selectedMsg.id,
                });
              }}
              className="space-y-4 mt-2"
            >
              <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={5} placeholder="Write your reply..." required />
              <Button type="submit" className="w-full gap-1.5" disabled={replyMutation.isPending}>
                <Send className="w-3.5 h-3.5" />{replyMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
