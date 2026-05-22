import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ExternalLink, Trash2, Pencil, Link2, Search } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";

const emptyForm = { title: "", url: "", description: "", category: "" };

export default function Links() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: links = [], isLoading } = trpc.links.list.useQuery();

  const createMutation = trpc.links.create.useMutation({
    onSuccess: () => {
      utils.links.list.invalidate();
      setCreateOpen(false);
      setForm(emptyForm);
      toast.success("Link added successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.links.update.useMutation({
    onSuccess: () => {
      utils.links.list.invalidate();
      setEditId(null);
      setForm(emptyForm);
      toast.success("Link updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.links.delete.useMutation({
    onSuccess: () => { utils.links.list.invalidate(); toast.success("Link removed"); },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.title.trim() || !form.url.trim()) return;
    createMutation.mutate({
      title: form.title,
      url: form.url,
      description: form.description || undefined,
      category: form.category || undefined,
    });
  };

  const handleEdit = (link: any) => {
    setEditId(link.id);
    setForm({ title: link.title, url: link.url, description: link.description ?? "", category: link.category ?? "" });
  };

  const handleUpdate = () => {
    if (!editId) return;
    updateMutation.mutate({
      id: editId,
      title: form.title,
      url: form.url,
      description: form.description || undefined,
      category: form.category || undefined,
    });
  };

  const filtered = links.filter((l: any) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.url.toLowerCase().includes(search.toLowerCase()) ||
    (l.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (l.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Links</h1>
              <p className="text-sm text-muted-foreground">Shared resources and interesting links</p>
            </div>
          </div>
          <Button
            onClick={() => { setForm(emptyForm); setCreateOpen(true); }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Link
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Links grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? "No links match your search" : "No links yet"}</p>
            {!search && <p className="text-sm mt-1">Add the first interesting link for the community</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((link: any) => (
              <Card key={link.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold leading-tight line-clamp-1">{link.title}</CardTitle>
                      <a
                        href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 truncate"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{link.url}</span>
                      </a>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(user?.id === link.creatorId || user?.role === "admin") && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(link)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate({ id: link.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {link.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{link.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {link.category && <Badge variant="secondary" className="text-xs">{link.category}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {link.creatorName ?? "Member"} · {format(new Date(link.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. arXiv AI Papers"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of this resource..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  placeholder="e.g. Research, Tools, Conferences..."
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={!form.title.trim() || !form.url.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Adding..." : "Add Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={editId !== null} onOpenChange={(o) => { if (!o) setEditId(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. arXiv AI Papers"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of this resource..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  placeholder="e.g. Research, Tools, Conferences..."
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditId(null)}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={handleUpdate}
                disabled={!form.title.trim() || !form.url.trim() || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
