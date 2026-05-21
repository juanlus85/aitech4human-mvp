import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink, FileText, BookOpen, Linkedin, Globe,
  GraduationCap, MapPin, ArrowLeft, FlaskConical, Hash
} from "lucide-react";

function SocialLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
      <Icon className="w-4 h-4 group-hover:text-primary" />
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

export default function MemberDetail() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id ?? "0");

  const { data: profile, isLoading: profileLoading } = trpc.profiles.publicGetByUserId.useQuery({ userId }, { enabled: !!userId });
  const { data: allProfiles, isLoading: listLoading } = trpc.profiles.publicList.useQuery();
  const user = allProfiles?.find((p) => p.userId === userId);

  const isLoading = profileLoading || listLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <div className="container py-20 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="glass-card rounded-2xl p-8 space-y-4">
            <div className="flex gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Member not found.</p>
          <Link href="/members"><Button variant="outline" className="mt-4">Back to Members</Button></Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <section className="py-16">
        <div className="container max-w-4xl">
          <Link href="/members">
            <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Members
            </Button>
          </Link>

          {/* Header card */}
          <div className="glass-card rounded-2xl p-8 md:p-10 mb-6 bracket-accent">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary/10 overflow-hidden shrink-0">
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-serif text-4xl font-semibold text-primary">{user.name.charAt(0)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">{user.name}</h1>

                {profile?.researchArea && (
                  <Badge variant="secondary" className="mb-3">{profile.researchArea}</Badge>
                )}

                <div className="space-y-1.5">
                  {profile?.university && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      <span>{profile.university}</span>
                    </div>
                  )}
                  {profile?.department && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{profile.department}</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4 shrink-0" />
                      <a href={`mailto:${user.email}`} className="hover:text-primary transition-colors">{user.email}</a>
                    </div>
                  )}
                </div>

                {profile?.availableToCollaborate && (
                  <Badge className="mt-3 bg-emerald-100 text-emerald-700 border-0">Open to collaborate</Badge>
                )}
              </div>

              {profile?.cvPdfUrl && (
                <div className="shrink-0">
                  <a href={profile.cvPdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2 bg-white/60">
                      <FileText className="w-4 h-4" /> Download CV
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bio & Interests */}
            <div className="md:col-span-2 space-y-6">
              {profile?.bio && (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Biography</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
                </div>
              )}

              {profile?.interests && (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Research Interests</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.interests}</p>
                </div>
              )}

              {profile?.keywords && (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="font-serif text-lg font-semibold text-foreground mb-3">
                    <Hash className="w-4 h-4 inline mr-1 text-primary" />Keywords
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.keywords.split(",").map((kw) => (
                      <span key={kw} className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                        {kw.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: links & academic IDs */}
            <div className="space-y-6">
              {(profile?.orcid || profile?.googleScholar || profile?.researchGate || profile?.scopus || profile?.webOfScience || profile?.linkedin || profile?.personalWeb) && (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="font-serif text-lg font-semibold text-foreground mb-4">Academic Profiles</h2>
                  <div className="space-y-3">
                    {profile?.orcid && <SocialLink href={`https://orcid.org/${profile.orcid}`} icon={FlaskConical} label="ORCID" />}
                    {profile?.googleScholar && <SocialLink href={profile.googleScholar} icon={BookOpen} label="Google Scholar" />}
                    {profile?.researchGate && <SocialLink href={profile.researchGate} icon={Globe} label="ResearchGate" />}
                    {profile?.scopus && <SocialLink href={profile.scopus} icon={Globe} label="Scopus" />}
                    {profile?.webOfScience && <SocialLink href={profile.webOfScience} icon={Globe} label="Web of Science" />}
                    {profile?.linkedin && <SocialLink href={profile.linkedin} icon={Linkedin} label="LinkedIn" />}
                    {profile?.personalWeb && <SocialLink href={profile.personalWeb} icon={Globe} label="Personal Website" />}
                  </div>
                </div>
              )}

              {profile?.languages && (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Languages</h2>
                  <p className="text-sm text-muted-foreground">{profile.languages}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
