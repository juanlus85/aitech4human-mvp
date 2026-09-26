import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { Download, FileText, FolderCog, FolderOpen, Globe, Lock, MoveRight, Pencil, Plus, Trash2, Upload } from "lucide-react";

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

type EditableDocument = {
  id: number;
  fileName: string;
  folderId: number | null;
};

type EditableFolder = {
  id: number;
  name: string;
} | null;

export default function Documents() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    description: "",
    folderId: "none" as string,
    accessLevel: "all" as "all" | "admin",
  });
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<EditableFolder>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingDocument, setEditingDocument] = useState<EditableDocument | null>(null);
  const [editedDocumentName, setEditedDocumentName] = useState("");
  const [editedDocumentFolderId, setEditedDocumentFolderId] = useState("none");

  const { data: documents, isLoading } = trpc.documents.list.useQuery();
  const { data: folders } = trpc.documents.folders.useQuery();

  const refreshDocuments = () => utils.documents.list.invalidate();
  const refreshFolders = () => utils.documents.folders.invalidate();

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => { refreshDocuments(); toast.success("Document and its stored file deleted."); },
    onError: (error) => toast.error(error.message),
  });

  const updateDocumentMutation = trpc.documents.update.useMutation({
    onSuccess: () => {
      refreshDocuments();
      setEditingDocument(null);
      toast.success("Document updated.");
    },
    onError: (error) => toast.error(error.message),
  });

  const createFolderMutation = trpc.documents.createFolder.useMutation({
    onSuccess: () => {
      refreshFolders();
      closeFolderDialog();
      toast.success("Folder created.");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateFolderMutation = trpc.documents.updateFolder.useMutation({
    onSuccess: () => {
      refreshFolders();
      closeFolderDialog();
      toast.success("Folder renamed.");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteFolderMutation = trpc.documents.deleteFolder.useMutation({
    onSuccess: (_, variables) => {
      refreshFolders();
      refreshDocuments();
      if (selectedFolderId === variables.id) setSelectedFolderId("all");
      toast.success("Folder deleted. Its documents were kept in No folder.");
    },
    onError: (error) => toast.error(error.message),
  });

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      refreshDocuments();
      setUploadOpen(false);
      setSelectedFile(null);
      setUploadForm({ description: "", folderId: "none", accessLevel: "all" });
      setUploading(false);
      toast.success("Document uploaded.");
    },
    onError: (error) => { toast.error(error.message); setUploading(false); },
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
      const base64 = btoa(binary);
      uploadMutation.mutate({
        base64,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
        fileSize: selectedFile.size,
        description: uploadForm.description || undefined,
        folderId: uploadForm.folderId !== "none" ? parseInt(uploadForm.folderId, 10) : undefined,
        accessLevel: uploadForm.accessLevel,
      });
    } catch {
      toast.error("Failed to read file.");
      setUploading(false);
    }
  };

  const filteredDocs = selectedFolderId === "all"
    ? documents
    : documents?.filter((document) => document.folderId === selectedFolderId);

  const canManageFolder = (folder: { creatorId: number }) => folder.creatorId === user?.id || user?.role === "admin";

  function openNewFolder() {
    setEditingFolder(null);
    setFolderName("");
    setFolderDialogOpen(true);
  }

  function openFolderManagement(folder: { id: number; name: string }) {
    setEditingFolder({ id: folder.id, name: folder.name });
    setFolderName(folder.name);
    setFolderDialogOpen(true);
  }

  function closeFolderDialog() {
    setFolderDialogOpen(false);
    setEditingFolder(null);
    setFolderName("");
  }

  function saveFolder() {
    const name = folderName.trim();
    if (!name) return;
    if (editingFolder) updateFolderMutation.mutate({ id: editingFolder.id, name });
    else createFolderMutation.mutate({ name });
  }

  function openDocumentEditor(document: EditableDocument) {
    setEditingDocument(document);
    setEditedDocumentName(document.fileName);
    setEditedDocumentFolderId(document.folderId ? String(document.folderId) : "none");
  }

  function saveDocument() {
    if (!editingDocument || !editedDocumentName.trim()) return;
    updateDocumentMutation.mutate({
      id: editingDocument.id,
      fileName: editedDocumentName.trim(),
      folderId: editedDocumentFolderId === "none" ? null : parseInt(editedDocumentFolderId, 10),
    });
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Resources</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">Documents</h1>
            <p className="mt-1 text-sm text-muted-foreground">Store, organize, rename, move, and securely remove group files.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-white/60" onClick={openNewFolder}>
              <FolderOpen className="h-4 w-4" />New folder
            </Button>
            <Button className="gap-2 font-medium" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" />Upload
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/60 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Folders</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFolderId("all")}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selectedFolderId === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground hover:bg-muted/50"}`}
            >
              All ({documents?.length ?? 0})
            </button>
            {folders?.map((folder) => {
              const count = documents?.filter((document) => document.folderId === folder.id).length ?? 0;
              const isSelected = selectedFolderId === folder.id;
              return (
                <div key={folder.id} className={`flex overflow-hidden rounded-full border text-xs ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground"}`}>
                  <button onClick={() => setSelectedFolderId(folder.id)} className="px-3 py-1.5 transition-colors hover:bg-black/5">
                    📁 {folder.name} ({count})
                  </button>
                  {canManageFolder(folder) && (
                    <button
                      aria-label={`Manage folder ${folder.name}`}
                      onClick={() => openFolderManagement(folder)}
                      className="border-l border-current/15 px-2 transition-colors hover:bg-black/10"
                    >
                      <FolderCog className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : filteredDocs?.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No documents here yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload a file or choose a different folder.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs?.map((document) => {
              const canManageDocument = document.uploaderId === user?.id || user?.role === "admin";
              const folderNameForDocument = document.folderId ? folders?.find((folder) => folder.id === document.folderId)?.name : null;
              return (
                <div key={document.id} className="glass-card flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:gap-4">
                  <span className="shrink-0 text-2xl">{getMimeIcon(document.mimeType)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="max-w-full truncate text-sm font-medium text-foreground">{document.fileName}</p>
                      {document.accessLevel === "admin" ? (
                        <Badge variant="secondary" className="shrink-0 gap-1 text-xs"><Lock className="h-2.5 w-2.5" />Admin only</Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 gap-1 text-xs"><Globe className="h-2.5 w-2.5" />All members</Badge>
                      )}
                      {folderNameForDocument && <Badge variant="outline" className="max-w-[11rem] truncate font-normal">📁 {folderNameForDocument}</Badge>}
                    </div>
                    {document.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{document.description}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatBytes(document.fileSize)} · {format(new Date(document.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                    <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Download ${document.fileName}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                    </a>
                    {canManageDocument && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Rename or move ${document.fileName}`} onClick={() => openDocumentEditor(document)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canManageDocument && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${document.fileName}`} onClick={() => { if (confirm(`Delete “${document.fileName}” and its stored file?`)) deleteMutation.mutate({ id: document.id }); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={uploadOpen} onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) { setSelectedFile(null); setUploadForm({ description: "", folderId: "none", accessLevel: "all" }); }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-serif">Upload document</DialogTitle><DialogDescription>Select a file and assign it to a folder if needed.</DialogDescription></DialogHeader>
            <div className="mt-2 space-y-4">
              <div className="cursor-pointer rounded-xl border-2 border-dashed border-border/50 p-8 text-center transition-colors hover:border-primary/50" onClick={() => fileInputRef.current?.click()}>
                {selectedFile ? <div><p className="text-sm font-medium text-foreground">{selectedFile.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p></div> : <div><Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Click to select a file</p></div>}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
              </div>
              <div className="space-y-1.5"><Label htmlFor="document-description">Description</Label><Textarea id="document-description" value={uploadForm.description} onChange={(event) => setUploadForm({ ...uploadForm, description: event.target.value })} rows={2} placeholder="Optional description..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Folder</Label><Select value={uploadForm.folderId} onValueChange={(value) => setUploadForm({ ...uploadForm, folderId: value })}><SelectTrigger><SelectValue placeholder="No folder" /></SelectTrigger><SelectContent><SelectItem value="none">No folder</SelectItem>{folders?.map((folder) => <SelectItem key={folder.id} value={String(folder.id)}>{folder.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Access level</Label><Select value={uploadForm.accessLevel} onValueChange={(value: "all" | "admin") => setUploadForm({ ...uploadForm, accessLevel: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All members</SelectItem>{user?.role === "admin" && <SelectItem value="admin">Admin only</SelectItem>}</SelectContent></Select></div>
              </div>
              <Button className="w-full" onClick={handleUpload} disabled={!selectedFile || uploading || uploadMutation.isPending}>{uploading || uploadMutation.isPending ? "Uploading..." : "Upload"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={folderDialogOpen} onOpenChange={(open) => { if (!open) closeFolderDialog(); else setFolderDialogOpen(true); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="font-serif">{editingFolder ? "Manage folder" : "New folder"}</DialogTitle><DialogDescription>{editingFolder ? "Rename the folder or remove it while keeping its documents." : "Create a folder to organize shared documents."}</DialogDescription></DialogHeader>
            <div className="mt-2 space-y-4">
              <div className="space-y-1.5"><Label htmlFor="document-folder-name">Folder name *</Label><Input id="document-folder-name" value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="e.g. Meeting notes" /></div>
              <Button className="w-full" onClick={saveFolder} disabled={!folderName.trim() || createFolderMutation.isPending || updateFolderMutation.isPending}>{editingFolder ? "Save folder name" : "Create folder"}</Button>
              {editingFolder && <><div className="border-t border-border/50" /><Button variant="outline" className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={deleteFolderMutation.isPending} onClick={() => { if (confirm(`Delete “${editingFolder.name}”? Documents inside will be moved to No folder.`)) { deleteFolderMutation.mutate({ id: editingFolder.id }); closeFolderDialog(); } }}><Trash2 className="h-4 w-4" />Delete folder</Button></>}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editingDocument !== null} onOpenChange={(open) => !open && setEditingDocument(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-serif">Organize document</DialogTitle><DialogDescription>Rename the file record or move it to another folder. The stored file itself is preserved.</DialogDescription></DialogHeader>
            <div className="mt-2 space-y-4">
              <div className="space-y-1.5"><Label htmlFor="document-file-name">File name *</Label><Input id="document-file-name" value={editedDocumentName} onChange={(event) => setEditedDocumentName(event.target.value)} /></div>
              <div className="space-y-1.5"><Label>Move to folder</Label><Select value={editedDocumentFolderId} onValueChange={setEditedDocumentFolderId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No folder</SelectItem>{folders?.map((folder) => <SelectItem key={folder.id} value={String(folder.id)}>{folder.name}</SelectItem>)}</SelectContent></Select></div>
              <Button className="w-full gap-2" onClick={saveDocument} disabled={!editedDocumentName.trim() || updateDocumentMutation.isPending}>{updateDocumentMutation.isPending ? "Saving..." : <><MoveRight className="h-4 w-4" />Save changes</>}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
