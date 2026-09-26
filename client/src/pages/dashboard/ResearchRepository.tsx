import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";
import {
  BookOpen,
  BookText,
  CalendarDays,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const PUBLICATION_TYPES = [
  { value: "poster", label: "Poster" },
  { value: "paper", label: "Journal / Conference Paper" },
  { value: "book", label: "Book" },
  { value: "book_chapter", label: "Book Chapter" },
  { value: "report", label: "Report" },
  { value: "other", label: "Other" },
] as const;

type PublicationType = (typeof PUBLICATION_TYPES)[number]["value"];
type UploadedPdf = {
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
};

type RepositoryForm = {
  type: PublicationType;
  title: string;
  authors: string;
  citation: string;
  abstract: string;
  publicationDate: string;
  publicationVenue: string;
  publisher: string;
  volume: string;
  issue: string;
  pages: string;
  isbn: string;
  doi: string;
  externalUrl: string;
  keywords: string;
  language: string;
  notes: string;
  participantIds: number[];
};

const EMPTY_FORM: RepositoryForm = {
  type: "paper",
  title: "",
  authors: "",
  citation: "",
  abstract: "",
  publicationDate: "",
  publicationVenue: "",
  publisher: "",
  volume: "",
  issue: "",
  pages: "",
  isbn: "",
  doi: "",
  externalUrl: "",
  keywords: "",
  language: "",
  notes: "",
  participantIds: [],
};

function typeLabel(type: string) {
  return PUBLICATION_TYPES.find((item) => item.value === type)?.label ?? type;
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function doiUrl(doi: string) {
  if (/^https?:\/\//i.test(doi)) return doi;
  return `https://doi.org/${doi.replace(/^doi:\s*/i, "")}`;
}

function TypeBadge({ type }: { type: string }) {
  return <Badge variant="secondary" className="font-normal">{typeLabel(type)}</Badge>;
}

export default function ResearchRepository() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<PublicationType | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RepositoryForm>(EMPTY_FORM);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [storedPdf, setStoredPdf] = useState<UploadedPdf | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const { data: entries, isLoading } = trpc.repository.list.useQuery();
  const { data: detail } = trpc.repository.getById.useQuery({ id: selectedId! }, { enabled: !!selectedId });
  const { data: members } = trpc.messages.recipients.useQuery();

  const createMutation = trpc.repository.create.useMutation({
    onSuccess: (entry) => {
      utils.repository.list.invalidate();
      if (entry?.id) setSelectedId(entry.id);
      closeEditor();
      toast.success("Repository entry created.");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.repository.update.useMutation({
    onSuccess: (entry) => {
      utils.repository.list.invalidate();
      if (entry?.id) {
        setSelectedId(entry.id);
        utils.repository.getById.invalidate({ id: entry.id });
      }
      closeEditor();
      toast.success("Repository entry updated.");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.repository.delete.useMutation({
    onSuccess: () => {
      utils.repository.list.invalidate();
      setSelectedId(null);
      toast.success("Repository entry deleted.");
    },
    onError: (error) => toast.error(error.message),
  });

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (entries ?? []).filter((entry) => {
      const matchesType = filterType === "all" || entry.type === filterType;
      const matchesSearch = !normalizedSearch || [
        entry.title,
        entry.authors,
        entry.citation,
        entry.publicationVenue,
        entry.publisher,
        entry.doi,
        entry.keywords,
        ...entry.participants.map((participant) => participant.name),
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
      return matchesType && matchesSearch;
    });
  }, [entries, filterType, search]);

  const canManage = detail && (detail.creatorId === user?.id || detail.participants.some((participant) => participant.userId === user?.id) || user?.role === "admin");

  function resetEditor() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPdfFile(null);
    setStoredPdf(null);
    setRemovePdf(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function closeEditor() {
    setEditorOpen(false);
    resetEditor();
  }

  function openCreate() {
    resetEditor();
    setEditorOpen(true);
  }

  function openEdit() {
    if (!detail) return;
    setEditingId(detail.id);
    setForm({
      type: detail.type as PublicationType,
      title: detail.title,
      authors: detail.authors ?? "",
      citation: detail.citation ?? "",
      abstract: detail.abstract ?? "",
      publicationDate: detail.publicationDate ? format(new Date(detail.publicationDate), "yyyy-MM-dd") : "",
      publicationVenue: detail.publicationVenue ?? "",
      publisher: detail.publisher ?? "",
      volume: detail.volume ?? "",
      issue: detail.issue ?? "",
      pages: detail.pages ?? "",
      isbn: detail.isbn ?? "",
      doi: detail.doi ?? "",
      externalUrl: detail.externalUrl ?? "",
      keywords: detail.keywords ?? "",
      language: detail.language ?? "",
      notes: detail.notes ?? "",
      participantIds: detail.participants.map((participant) => participant.userId),
    });
    setStoredPdf(detail.pdfFileKey && detail.pdfFileUrl && detail.pdfFileName ? {
      fileName: detail.pdfFileName,
      fileKey: detail.pdfFileKey,
      fileUrl: detail.pdfFileUrl,
      fileSize: detail.pdfFileSize ?? 0,
    } : null);
    setPdfFile(null);
    setRemovePdf(false);
    setEditorOpen(true);
  }

  function toggleParticipant(userId: number) {
    setForm((current) => ({
      ...current,
      participantIds: current.participantIds.includes(userId)
        ? current.participantIds.filter((id) => id !== userId)
        : [...current.participantIds, userId],
    }));
  }

  async function uploadPdf(): Promise<UploadedPdf | null> {
    if (!pdfFile) return storedPdf;
    if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a PDF file.");
      return null;
    }
    setUploadingPdf(true);
    try {
      const body = new FormData();
      body.append("pdf", pdfFile);
      const response = await fetch("/api/upload/repository-pdf", { method: "POST", credentials: "include", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "PDF upload failed");
      const uploaded = result as UploadedPdf;
      setStoredPdf(uploaded);
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return uploaded;
    } catch (error: any) {
      toast.error(error.message ?? "PDF upload failed.");
      return null;
    } finally {
      setUploadingPdf(false);
    }
  }

  async function saveEntry() {
    if (!form.title.trim()) return;
    const uploadedPdf = await uploadPdf();
    if (pdfFile && !uploadedPdf) return;

    const payload = {
      type: form.type,
      title: form.title.trim(),
      authors: form.authors || undefined,
      citation: form.citation || undefined,
      abstract: form.abstract || undefined,
      publicationDate: form.publicationDate ? new Date(`${form.publicationDate}T12:00:00`) : undefined,
      publicationVenue: form.publicationVenue || undefined,
      publisher: form.publisher || undefined,
      volume: form.volume || undefined,
      issue: form.issue || undefined,
      pages: form.pages || undefined,
      isbn: form.isbn || undefined,
      doi: form.doi || undefined,
      externalUrl: form.externalUrl || "",
      keywords: form.keywords || undefined,
      language: form.language || undefined,
      notes: form.notes || undefined,
      participantIds: form.participantIds,
      removePdf: editingId ? removePdf : undefined,
      pdfFileName: uploadedPdf?.fileName,
      pdfFileKey: uploadedPdf?.fileKey,
      pdfFileUrl: uploadedPdf?.fileUrl,
      pdfFileSize: uploadedPdf?.fileSize,
    };

    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resources</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">Academic Repository</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Shared posters, papers, books, chapters, reports, and other collaborative outputs.</p>
          </div>
          <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Add publication</Button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/60 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search title, author, DOI, keyword, or collaborator..." aria-label="Search repository" />
          </div>
          <Select value={filterType} onValueChange={(value: PublicationType | "all") => setFilterType(value)}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {PUBLICATION_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-xl" />)}</div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-6 py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">No repository entries found</p>
            <p className="mt-1 text-sm text-muted-foreground">Add the first collaborative output or adapt your search and filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEntries.map((entry) => (
              <article key={entry.id} onClick={() => setSelectedId(entry.id)} className="group flex min-h-[250px] cursor-pointer flex-col rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <TypeBadge type={entry.type} />
                  <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <h2 className="mt-3 font-serif text-lg font-semibold leading-snug text-foreground line-clamp-3">{entry.title}</h2>
                {entry.authors && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{entry.authors}</p>}
                {entry.publicationVenue && <p className="mt-2 text-xs text-muted-foreground line-clamp-1"><BookText className="mr-1 inline h-3.5 w-3.5 text-primary" />{entry.publicationVenue}</p>}
                {entry.abstract && <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">{entry.abstract}</p>}
                <div className="mt-auto pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {entry.participants.slice(0, 3).map((participant) => <Badge key={participant.id} variant="outline" className="max-w-full truncate font-normal">{participant.name}</Badge>)}
                    {entry.participants.length > 3 && <Badge variant="outline" className="font-normal">+{entry.participants.length - 3}</Badge>}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{entry.publicationDate ? format(new Date(entry.publicationDate), "MMM yyyy") : "Date not specified"}</span>
                    <span className="flex items-center gap-1">{entry.pdfFileUrl ? <><FileText className="h-3.5 w-3.5 text-primary" />PDF</> : entry.doi || entry.externalUrl ? <><Link2 className="h-3.5 w-3.5 text-primary" />Link</> : null}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Dialog open={editorOpen} onOpenChange={(open) => { if (!open) closeEditor(); else setEditorOpen(true); }}>
          <DialogContent className="flex h-[92dvh] max-h-[92dvh] w-[calc(100vw-2rem)] max-w-4xl flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{editingId ? "Edit repository entry" : "Add repository entry"}</DialogTitle>
              <DialogDescription>Store bibliographic details and identify the group members who participated in this output.</DialogDescription>
            </DialogHeader>
            <div className="mt-2 flex-1 overflow-y-auto pr-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="repository-title">Title *</Label><Input id="repository-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Full title of the publication" /></div>
                <div className="space-y-1.5"><Label>Publication type *</Label><Select value={form.type} onValueChange={(value: PublicationType) => setForm({ ...form, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PUBLICATION_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Publication date</Label><Input type="date" value={form.publicationDate} onChange={(event) => setForm({ ...form, publicationDate: event.target.value })} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Authors (publication order)</Label><Input value={form.authors} onChange={(event) => setForm({ ...form, authors: event.target.value })} placeholder="Surname, Name; Surname, Name..." /></div>
                <div className="space-y-1.5"><Label>Journal, conference, or series</Label><Input value={form.publicationVenue} onChange={(event) => setForm({ ...form, publicationVenue: event.target.value })} /></div>
                <div className="space-y-1.5"><Label>Publisher</Label><Input value={form.publisher} onChange={(event) => setForm({ ...form, publisher: event.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="repository-doi">DOI</Label><Input id="repository-doi" value={form.doi} onChange={(event) => setForm({ ...form, doi: event.target.value })} placeholder="10.xxxx/xxxxx" /></div>
                <div className="space-y-1.5"><Label>External URL</Label><Input type="url" value={form.externalUrl} onChange={(event) => setForm({ ...form, externalUrl: event.target.value })} placeholder="https://..." /></div>
                <div className="grid grid-cols-3 gap-3 sm:col-span-2"><div className="space-y-1.5"><Label>Volume</Label><Input value={form.volume} onChange={(event) => setForm({ ...form, volume: event.target.value })} /></div><div className="space-y-1.5"><Label>Issue</Label><Input value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} /></div><div className="space-y-1.5"><Label>Pages</Label><Input value={form.pages} onChange={(event) => setForm({ ...form, pages: event.target.value })} /></div></div>
                <div className="space-y-1.5"><Label>ISBN</Label><Input value={form.isbn} onChange={(event) => setForm({ ...form, isbn: event.target.value })} /></div>
                <div className="space-y-1.5"><Label>Language</Label><Input value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} placeholder="English" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Full citation</Label><Textarea value={form.citation} onChange={(event) => setForm({ ...form, citation: event.target.value })} rows={3} placeholder="Complete reference in the preferred citation style..." /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Abstract / summary</Label><Textarea value={form.abstract} onChange={(event) => setForm({ ...form, abstract: event.target.value })} rows={5} placeholder="Brief summary of the publication..." /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Keywords</Label><Input value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="AI, human-centred technology, education..." /></div>
              </div>

              <div className="mt-5 space-y-2 rounded-xl border border-border/60 bg-muted/10 p-4">
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><Label>Participating members</Label></div>
                <p className="text-xs text-muted-foreground">Select group members who collaborated on this output. The creator is always retained.</p>
                <div className="max-h-40 divide-y divide-border/40 overflow-y-auto rounded-lg border border-border/50 bg-background/70">
                  {members?.map((member) => {
                    const checked = form.participantIds.includes(member.id);
                    return <label key={member.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"><Checkbox checked={checked} onCheckedChange={() => toggleParticipant(member.id)} /><span className="flex-1 text-sm text-foreground">{member.name}{member.id === user?.id && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}</span></label>;
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-border/70 bg-muted/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><Label>Publication PDF</Label><p className="mt-1 text-xs text-muted-foreground">Optional PDF, up to 20 MB. Replacing it removes the prior file from the Plesk server.</p></div>
                  <Button type="button" variant="outline" className="gap-2 bg-white/60" onClick={() => fileInputRef.current?.click()}><FileUp className="h-4 w-4" />{storedPdf || pdfFile ? "Replace PDF" : "Select PDF"}</Button>
                  <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => { setPdfFile(event.target.files?.[0] ?? null); setRemovePdf(false); }} />
                </div>
                {(pdfFile || storedPdf) && <div className="mt-3 flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm"><FileText className="h-4 w-4 text-primary" /><span className="min-w-0 flex-1 truncate">{pdfFile?.name ?? storedPdf?.fileName}</span><span className="text-xs text-muted-foreground">{formatBytes(pdfFile?.size ?? storedPdf?.fileSize)}</span><button type="button" className="text-xs text-destructive hover:underline" onClick={() => { setPdfFile(null); setStoredPdf(null); setRemovePdf(true); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Remove</button></div>}
              </div>

              <div className="mt-5 space-y-1.5"><Label>Internal notes</Label><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} placeholder="Optional internal context, contribution details, or follow-up notes..." /></div>
            </div>
            <div className="mt-4 flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={closeEditor}>Cancel</Button><Button className="gap-2" onClick={saveEntry} disabled={!form.title.trim() || uploadingPdf || createMutation.isPending || updateMutation.isPending}>{(uploadingPdf || createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}{editingId ? "Save changes" : "Add to repository"}</Button></div>
          </DialogContent>
        </Dialog>

        <Dialog open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
          <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-4xl overflow-y-auto">
            {detail ? <>
              <DialogHeader>
                <div className="flex items-start gap-3 pr-7"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div><div className="min-w-0 flex-1"><TypeBadge type={detail.type} /><DialogTitle className="mt-2 font-serif text-2xl leading-tight">{detail.title}</DialogTitle><DialogDescription className="mt-1">Added by {detail.creatorName ?? "a group member"} · {format(new Date(detail.createdAt), "MMM d, yyyy")}</DialogDescription></div></div>
              </DialogHeader>
              <div className="mt-3 flex flex-col gap-5">
                <div className="flex flex-wrap gap-2">
                  {detail.pdfFileUrl && <a href={detail.pdfFileUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" className="gap-2"><Download className="h-3.5 w-3.5" />Open PDF</Button></a>}
                  {detail.doi && <a href={doiUrl(detail.doi)} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-2 bg-white/60"><ExternalLink className="h-3.5 w-3.5" />Open DOI</Button></a>}
                  {detail.externalUrl && <a href={detail.externalUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-2 bg-white/60"><Link2 className="h-3.5 w-3.5" />External link</Button></a>}
                  {canManage && <Button variant="outline" size="sm" className="gap-2 sm:ml-auto" onClick={openEdit}><Pencil className="h-3.5 w-3.5" />Edit</Button>}
                  {canManage && <Button variant="outline" size="sm" className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { if (confirm("Delete this repository entry and its PDF?")) deleteMutation.mutate({ id: detail.id }); }}><Trash2 className="h-3.5 w-3.5" />Delete</Button>}
                </div>

                {detail.authors && <section><h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Authors</h3><p className="mt-1.5 text-sm leading-relaxed text-foreground">{detail.authors}</p></section>}
                {detail.citation && <section className="rounded-xl border border-border/50 bg-muted/20 p-4"><h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Citation</h3><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">{detail.citation}</p></section>}
                {detail.abstract && <section><h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Abstract / summary</h3><p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground">{detail.abstract}</p></section>}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {detail.publicationDate && <Metadata label="Publication date"><CalendarDays className="h-3.5 w-3.5" />{format(new Date(detail.publicationDate), "MMMM d, yyyy")}</Metadata>}
                  {detail.publicationVenue && <Metadata label="Journal / venue">{detail.publicationVenue}</Metadata>}
                  {detail.publisher && <Metadata label="Publisher">{detail.publisher}</Metadata>}
                  {detail.doi && <Metadata label="DOI">{detail.doi}</Metadata>}
                  {detail.isbn && <Metadata label="ISBN">{detail.isbn}</Metadata>}
                  {(detail.volume || detail.issue || detail.pages) && <Metadata label="Volume / issue / pages">{[detail.volume && `Vol. ${detail.volume}`, detail.issue && `No. ${detail.issue}`, detail.pages && `pp. ${detail.pages}`].filter(Boolean).join(" · ")}</Metadata>}
                  {detail.language && <Metadata label="Language">{detail.language}</Metadata>}
                  {detail.keywords && <Metadata label="Keywords">{detail.keywords}</Metadata>}
                  {detail.pdfFileName && <Metadata label="PDF file"><FileText className="h-3.5 w-3.5" />{detail.pdfFileName} {detail.pdfFileSize ? `(${formatBytes(detail.pdfFileSize)})` : ""}</Metadata>}
                </div>

                <section className="rounded-xl border border-border/50 bg-muted/10 p-4"><h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><Users className="h-3.5 w-3.5" />Participating members</h3><div className="mt-3 flex flex-wrap gap-2">{detail.participants.map((participant) => <Badge key={participant.id} variant="secondary" className="font-normal">{participant.name}</Badge>)}</div></section>
                {detail.notes && <section><h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Internal notes</h3><p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{detail.notes}</p></section>}
              </div>
            </> : <div className="py-12 text-center text-sm text-muted-foreground">Loading repository entry…</div>}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function Metadata({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-border/50 bg-muted/10 p-3"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 flex items-center gap-1.5 break-words text-sm text-foreground">{children}</p></div>;
}
