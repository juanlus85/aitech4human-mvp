import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Globe, BookOpen, Linkedin, FlaskConical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Members() {
  const { data: members, isLoading } = trpc.profiles.publicList.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <section className="py-20">
        <div className="container">
          <div className="mb-12">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">The Team</p>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">Research Members</h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              An interdisciplinary team of researchers from three European universities, united by a shared commitment to human-centred technology.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-6 space-y-3">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Link key={member.userId} href={`/members/${member.userId}`}>
                  <article className="glass-card rounded-xl p-6 hover-lift cursor-pointer h-full flex flex-col bracket-accent">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 overflow-hidden shrink-0">
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-serif text-xl font-semibold text-primary">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-semibold text-foreground leading-tight">{member.name}</h3>
                        {member.university && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{member.university}</p>
                        )}
                        {member.department && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{member.department}</p>
                        )}
                      </div>
                    </div>

                    {member.researchArea && (
                      <Badge variant="secondary" className="text-xs w-fit mb-3">{member.researchArea}</Badge>
                    )}

                    {member.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{member.bio}</p>
                    )}

                    {member.keywords && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {member.keywords.split(",").slice(0, 3).map((kw) => (
                          <span key={kw} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                      {member.googleScholar && <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />}
                      {member.linkedin && <Linkedin className="w-3.5 h-3.5 text-muted-foreground" />}
                      {member.cvPdfUrl && <FileText className="w-3.5 h-3.5 text-muted-foreground" />}
                      {member.availableToCollaborate && (
                        <Badge className="text-xs ml-auto bg-emerald-100 text-emerald-700 border-0">
                          Open to collaborate
                        </Badge>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-16 text-center">
              <FlaskConical className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Member profiles will appear here once researchers complete their profiles.</p>
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
