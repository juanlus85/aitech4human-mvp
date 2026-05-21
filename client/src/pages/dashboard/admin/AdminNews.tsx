import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminNews() {
  const { isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  if (!isAdmin) { navigate("/dashboard"); return null; }

  const { data: newsList, isLoading } = trpc.news.adminList.useQuery();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ title: "", summary: "", content: "", isPublished: false });

  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => { utils.news.adminList.invalidate(); utils.news.publicList.invalidate(); setOpen(false); setForm({ title: "", summary: "", content: "", isPublished: false }); toast.success("News article created."); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => { utils.news.adminList.invalidate(); utils.news.publicList.invalidate(); setEditItem(null); toast.success("Article updated."); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => { utils.news.adminList.invalidate(); utils.news.publicList.invalidate(); toast.success("Article deleted."); },
  });

  const NewsForm = ({ value, onChange, onSubmit, loading, label }: any) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label>Summary <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea value={value.summary} onChange={(e) => onChange({ ...value, summary: e.target.value })} rows={2} placeholder="Brief summary shown in listings..." />
      </div>
      <div className="space-y-1.5">
        <Label>Content</Label>
        <Textarea value={value.content} onChange={(e) => onChange({ ...value, content: e.target.value })} rows={8} required placeholder="Full article content..." />
      </div>
      <div className="flex items-center justify-between">
        <Label>Publish immediately</Label>
        <Switch checked={value.isPublished} onCheckedChange={(v) => onChange({ ...value, isPublished: v })} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : label}
      </Button>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">News Management</h1>
            <p className="text-sm text-muted-foreground mt-1">{newsList?.length ?? 0} articles</p>
          </div>
          <Button className="gap-2 font-medium" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />New Article
          </Button>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : newsList?.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground line-clamp-1">{item.title}</p>
                    {item.summary && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.summary}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isPublished ? "default" : "secondary"} className="gap-1 text-xs">
                      {item.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {item.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {item.publishedAt ? format(new Date(item.publishedAt), "MMM d, yyyy") : format(new Date(item.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItem({ ...item, summary: item.summary ?? "", content: item.content ?? "" })}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Delete this article?")) deleteMutation.mutate({ id: item.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">New Article</DialogTitle></DialogHeader>
            <NewsForm value={form} onChange={setForm} onSubmit={() => createMutation.mutate(form)} loading={createMutation.isPending} label="Create Article" />
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Edit Article</DialogTitle></DialogHeader>
            {editItem && (
              <NewsForm
                value={editItem}
                onChange={setEditItem}
                onSubmit={() => updateMutation.mutate({ id: editItem.id, title: editItem.title, summary: editItem.summary, content: editItem.content, isPublished: editItem.isPublished })}
                loading={updateMutation.isPending}
                label="Save Changes"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
