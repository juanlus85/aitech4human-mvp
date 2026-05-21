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
import { useState, useRef } from "react";
import { format } from "date-fns";
import { Upload, FileText, Download, Trash2, FolderOpen, Lock, Globe, Plus } from "lucide-react";

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeIcon(mime?: string | null) {
  if (!mime) return "📄";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
  if (mime.includes("zip") || mime.includes("compressed")) return "📦";
  return "📄";
}

export default function Documents() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    description: "",
    folderId: "none" as string,
    accessLevel: "all" as "all" | "admin",
  });
  const [folderName, setFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: documents, isLoading } = trpc.documents.list.useQuery();
  const { data: folders } = trpc.documents.folders.useQuery();

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => { utils.documents.list.invalidate(); toast.success("Document deleted."); },
    onError: (e) => toast.error(e.message),
  });

  const createFolderMutation = trpc.documents.createFolder.useMutation({
    onSuccess: () => {
      utils.documents.folders.invalidate();
      setFolderOpen(false);
      setFolderName("");
      toast.success("Folder created.");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      setUploadOpen(false);
      setSelectedFile(null);
      setUploadForm({ description: "", folderId: "none", accessLevel: "all" });
      setUploading(false);
      toast.success("Document uploaded.");
    },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      uploadMutation.mutate({
        base64,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
        fileSize: selectedFile.size,
        description: uploadForm.description || undefined,
        folderId: (uploadForm.folderId && uploadForm.folderId !== "none") ? parseInt(uploadForm.folderId) : undefined,
        accessLevel: uploadForm.accessLevel,
      });
    } catch {
      toast.error("Failed to read file.");
      setUploading(false);
    }
  };

  const filteredDocs = selectedFolderId === "all"
    ? documents
    : documents?.filter((d) => d.folderId === selectedFolderId);

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Documents</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-white/60" onClick={() => setFolderOpen(true)}>
              <FolderOpen className="w-4 h-4" />New Folder
            </Button>
            <Button className="gap-2 font-medium" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" />Upload
            </Button>
          </div>
        </div>

        {/* Folder filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFolderId("all")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedFolderId === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:bg-muted/50"}`}
          >
            All ({documents?.length ?? 0})
          </button>
          {folders?.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedFolderId === f.id ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:bg-muted/50"}`}
            >
              📁 {f.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : filteredDocs?.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No documents here yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs?.map((doc) => (
              <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                <span className="text-2xl shrink-0">{getMimeIcon(doc.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{doc.fileName}</p>
                    {doc.accessLevel === "admin" ? (
                      <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" />Admin only
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1 shrink-0">
                        <Globe className="w-2.5 h-2.5" />All members
                      </Badge>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatBytes(doc.fileSize)} · {format(new Date(doc.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  {(doc.uploaderId === user?.id || user?.role === "admin") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => { if (confirm("Delete this document?")) deleteMutation.mutate({ id: doc.id }); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload dialog */}
        <Dialog open={uploadOpen} onOpenChange={(o) => {
          setUploadOpen(o);
          if (!o) { setSelectedFile(null); setUploadForm({ description: "", folderId: "none", accessLevel: "all" }); }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-serif">Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div
                className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div>
                    <p className="font-medium text-foreground text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatBytes(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select a file</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Folder</Label>
                  <Select value={uploadForm.folderId} onValueChange={(v) => setUploadForm({ ...uploadForm, folderId: v })}>
                    <SelectTrigger><SelectValue placeholder="No folder" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No folder</SelectItem>
                      {folders?.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Access Level</Label>
                  <Select value={uploadForm.accessLevel} onValueChange={(v: any) => setUploadForm({ ...uploadForm, accessLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All members</SelectItem>
                      {user?.role === "admin" && <SelectItem value="admin">Admin only</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleUpload} disabled={!selectedFile || uploading || uploadMutation.isPending}>
                {uploading || uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* New folder dialog */}
        <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="font-serif">New Folder</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Folder Name *</Label>
                <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="e.g. Meeting Notes" />
              </div>
              <Button className="w-full" onClick={() => createFolderMutation.mutate({ name: folderName })} disabled={!folderName || createFolderMutation.isPending}>
                {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
