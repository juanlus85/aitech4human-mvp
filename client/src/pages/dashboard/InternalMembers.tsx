import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Hash,
  Languages,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  UserRound,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";

type DirectoryMember = {
  userId: number;
  name: string;
  email: string;
  role: "admin" | "member";
  photoUrl: string | null;
  bio: string | null;
  interests: string | null;
  university: string | null;
  department: string | null;
  researchArea: string | null;
  orcid: string | null;
  googleScholar: string | null;
  researchGate: string | null;
  scopus: string | null;
  webOfScience: string | null;
  linkedin: string | null;
  personalWeb: string | null;
  cvPdfUrl: string | null;
  keywords: string | null;
  languages: string | null;
  availableToCollaborate: boolean | null;
};

type AcademicLink = {
  label: string;
  href: string;
  icon: typeof Globe;
};

function getOrcidUrl(orcid: string) {
  return orcid.startsWith("http") ? orcid : `https://orcid.org/${orcid}`;
}

function getAcademicLinks(member: DirectoryMember): AcademicLink[] {
  return [
    member.orcid ? { label: "ORCID", href: getOrcidUrl(member.orcid), icon: UserRound } : null,
    member.googleScholar ? { label: "Google Scholar", href: member.googleScholar, icon: BookOpen } : null,
    member.researchGate ? { label: "ResearchGate", href: member.researchGate, icon: Globe } : null,
    member.scopus ? { label: "Scopus", href: member.scopus, icon: Globe } : null,
    member.webOfScience ? { label: "Web of Science", href: member.webOfScience, icon: Globe } : null,
    member.linkedin ? { label: "LinkedIn", href: member.linkedin, icon: Linkedin } : null,
    member.personalWeb ? { label: "Personal website", href: member.personalWeb, icon: Globe } : null,
  ].filter((link): link is AcademicLink => link !== null);
}

function MemberAvatar({ member, className = "h-14 w-14" }: { member: DirectoryMember; className?: string }) {
  return (
    <Avatar className={className}>
      {member.photoUrl && <AvatarImage src={member.photoUrl} alt={member.name} />}
      <AvatarFallback className="bg-primary/10 font-serif text-lg font-semibold text-primary">
        {member.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/10 p-4 sm:p-5">
      <h3 className="font-serif text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function InternalMembers() {
  const { data: members, isLoading } = trpc.profiles.internalList.useQuery();
  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<DirectoryMember | null>(null);
  const [, navigate] = useLocation();

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return members ?? [];
    return (members ?? []).filter((member) => [
      member.name,
      member.email,
      member.university,
      member.department,
      member.researchArea,
      member.keywords,
    ].some((value) => value?.toLowerCase().includes(normalizedQuery)));
  }, [members, query]);

  const openMessageComposer = (member: DirectoryMember) => {
    navigate(`/dashboard/messages?recipient=${encodeURIComponent(member.userId)}`);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Collaboration directory</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">Members</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Contact colleagues, review their full academic profiles, and start a private conversation.
            </p>
          </div>
          <Badge variant="secondary" className="h-7 w-fit px-3 text-xs">
            {members?.length ?? 0} active member{(members?.length ?? 0) === 1 ? "" : "s"}
          </Badge>
        </div>

        <div className="relative mb-6 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, university, area, or keyword..."
            className="h-10 pl-9"
            aria-label="Search members"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-border/50 p-5">
                <div className="flex gap-3"><Skeleton className="h-14 w-14 rounded-full" /><div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-28" /></div></div>
                <Skeleton className="mt-5 h-16 w-full" />
                <Skeleton className="mt-4 h-9 w-full" />
              </div>
            ))}
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <article key={member.userId} className="flex min-h-[280px] flex-col rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start gap-3">
                  <MemberAvatar member={member} />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-lg font-semibold leading-tight text-foreground">{member.name}</h2>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{member.email}</p>
                    {member.researchArea && <Badge variant="secondary" className="mt-2 max-w-full truncate">{member.researchArea}</Badge>}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {member.university && <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{member.university}</span></p>}
                  {member.department && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{member.department}</span></p>}
                </div>

                {member.bio ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
                ) : (
                  <p className="mt-4 text-sm italic text-muted-foreground">Profile information has not been completed yet.</p>
                )}

                {member.keywords && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {member.keywords.split(",").slice(0, 3).map((keyword) => (
                      <Badge key={keyword.trim()} variant="outline" className="max-w-full truncate font-normal">{keyword.trim()}</Badge>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex gap-2 pt-5">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setSelectedMember(member)}>
                    <UserRound className="h-3.5 w-3.5" /> View profile
                  </Button>
                  <Button size="sm" className="gap-1.5" aria-label={`Message ${member.name}`} onClick={() => openMessageComposer(member)}>
                    <MessageSquare className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Message</span>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 px-6 py-14 text-center">
            <UserRound className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">No members found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different name, university, research area, or keyword.</p>
          </div>
        )}

        <Dialog open={selectedMember !== null} onOpenChange={(open) => !open && setSelectedMember(null)}>
          {selectedMember && (
            <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-4xl overflow-hidden p-0">
              <DialogHeader className="border-b border-border/50 px-5 py-4 sm:px-7 sm:py-5">
                <div className="flex items-start gap-4 pr-7">
                  <MemberAvatar member={selectedMember} className="h-16 w-16 sm:h-20 sm:w-20" />
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="font-serif text-2xl text-foreground sm:text-3xl">{selectedMember.name}</DialogTitle>
                    <DialogDescription className="sr-only">Full internal profile for {selectedMember.name}</DialogDescription>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedMember.researchArea && <Badge variant="secondary">{selectedMember.researchArea}</Badge>}
                      {selectedMember.availableToCollaborate && <Badge className="border-0 bg-emerald-100 text-emerald-700">Open to collaborate</Badge>}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="max-h-[calc(90dvh-12rem)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailSection title="Contact and affiliation">
                    <div className="space-y-2.5">
                      <a href={`mailto:${selectedMember.email}`} className="flex items-center gap-2 break-all hover:text-primary"><Mail className="h-4 w-4 shrink-0 text-primary" />{selectedMember.email}</a>
                      {selectedMember.university && <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4 shrink-0 text-primary" />{selectedMember.university}</p>}
                      {selectedMember.department && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />{selectedMember.department}</p>}
                      <p className="capitalize text-muted-foreground">Platform role: {selectedMember.role}</p>
                    </div>
                  </DetailSection>

                  {selectedMember.languages && (
                    <DetailSection title="Languages">
                      <p className="flex items-center gap-2"><Languages className="h-4 w-4 shrink-0 text-primary" />{selectedMember.languages}</p>
                    </DetailSection>
                  )}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {selectedMember.bio && <DetailSection title="Biography"><p className="whitespace-pre-line">{selectedMember.bio}</p></DetailSection>}
                  {selectedMember.interests && <DetailSection title="Research interests"><p className="whitespace-pre-line">{selectedMember.interests}</p></DetailSection>}
                </div>

                {selectedMember.keywords && (
                  <div className="mt-4"><DetailSection title="Keywords"><div className="flex flex-wrap gap-2">{selectedMember.keywords.split(",").map((keyword) => <Badge key={keyword.trim()} variant="outline" className="font-normal"><Hash className="mr-1 h-3 w-3" />{keyword.trim()}</Badge>)}</div></DetailSection></div>
                )}

                {(getAcademicLinks(selectedMember).length > 0 || selectedMember.cvPdfUrl) && (
                  <div className="mt-4"><DetailSection title="Academic profiles and files"><div className="grid gap-2 sm:grid-cols-2">{getAcademicLinks(selectedMember).map((link) => { const Icon = link.icon; return <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-background hover:text-primary"><Icon className="h-4 w-4 shrink-0" /><span className="flex-1">{link.label}</span><ExternalLink className="h-3.5 w-3.5" /></a>; })}{selectedMember.cvPdfUrl && <a href={selectedMember.cvPdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-background hover:text-primary"><FileText className="h-4 w-4 shrink-0" /><span className="flex-1">Curriculum vitae</span><ExternalLink className="h-3.5 w-3.5" /></a>}</div></DetailSection></div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border/50 bg-background/95 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <Button variant="outline" onClick={() => setSelectedMember(null)}>Close</Button>
                <Button className="gap-2" onClick={() => openMessageComposer(selectedMember)}>
                  <MessageSquare className="h-4 w-4" /> Send message to {selectedMember.name}
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
