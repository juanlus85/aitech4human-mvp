import { trpc } from "@/lib/trpc";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowRight, Users, BookOpen, CalendarDays, Globe } from "lucide-react";

export default function Home() {
  const { data: members } = trpc.profiles.publicList.useQuery();
  const { data: newsList } = trpc.news.publicList.useQuery();

  const previewMembers = members?.slice(0, 6) ?? [];
  const previewNews = newsList?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-violet-200/40 to-pink-100/30 blur-3xl" />
          <div className="absolute top-10 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-mint-100/30 to-lavender-200/40 blur-3xl" style={{ background: "radial-gradient(circle, oklch(0.93 0.04 160 / 0.3), oklch(0.93 0.04 290 / 0.2))" }} />
        </div>

        <div className="container relative">
          <div className="max-w-3xl">
            {/* Editorial bracket decoration */}
            <div className="bracket-corner inline-block px-4 py-2 mb-6">
              <Badge variant="secondary" className="text-xs font-sans tracking-widest uppercase">
                Ulysseus Research & Innovation Group
              </Badge>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl font-semibold leading-tight mb-6 animate-fade-in-up">
              AI &amp; Technology
              <br />
              <span className="gradient-text italic">for Human Wellbeing</span>
            </h1>

            <div className="accent-line mb-8 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                An interdisciplinary European research group exploring how artificial intelligence and emerging technologies can be designed, deployed, and governed to genuinely serve human flourishing.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
              <Button asChild size="lg" className="gap-2 btn-press">
                <Link href="/about">Discover our work <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 bg-white/60 btn-press">
                <Link href="/members">Meet the team</Link>
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-fade-in-up stagger-children" style={{ animationDelay: "240ms" }}>
            {[
              { icon: Users, label: "Researchers", value: members?.length ?? "11" },
              { icon: BookOpen, label: "Publications", value: "-" },
              { icon: CalendarDays, label: "Years active", value: "1" },
              { icon: Globe, label: "Partner universities", value: "3" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass-card rounded-xl p-5 bracket-corner animate-fade-in-up">
                <Icon className="w-5 h-5 text-primary mb-2" />
                <p className="font-serif text-2xl font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-sans">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Members preview ───────────────────────────────────────────────────── */}
      {previewMembers.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-sans mb-2">The Team</p>
                <h2 className="font-serif text-3xl font-semibold text-foreground">Our Researchers</h2>
              </div>
              <Button asChild variant="ghost" className="gap-1.5 text-sm text-primary">
                <Link href="/members">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
              {previewMembers.map((m) => (
                <Link key={m.userId} href={`/members/${m.userId}`}>
                  <div className="glass-card rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer group animate-fade-in-up">
                    <Avatar className="w-14 h-14 mx-auto mb-3 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      <AvatarImage src={m.photoUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-serif text-lg">
                        {m.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-serif text-sm font-medium text-foreground leading-tight">{m.name}</p>
                    {m.university && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{m.university}</p>
                    )}
                    {m.researchArea && (
                      <Badge variant="secondary" className="mt-2 text-[10px] px-1.5 py-0">{m.researchArea}</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── News preview ──────────────────────────────────────────────────────── */}
      {previewNews.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-sans mb-2">Latest</p>
                <h2 className="font-serif text-3xl font-semibold text-foreground">News &amp; Updates</h2>
              </div>
              <Button asChild variant="ghost" className="gap-1.5 text-sm text-primary">
                <Link href="/news">All news <ArrowRight className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-5 stagger-children">
              {previewNews.map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`}>
                  <article className="glass-card rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group animate-fade-in-up h-full flex flex-col">
                    {item.coverImageUrl && (
                      <div className="h-40 overflow-hidden">
                        <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      {item.publishedAt && (
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">
                          {format(new Date(item.publishedAt), "MMMM d, yyyy")}
                        </p>
                      )}
                      <h3 className="font-serif text-base font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.summary && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{item.summary}</p>
                      )}
                      <div className="flex items-center gap-1 mt-3 text-primary text-xs font-medium">
                        Read more <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="glass-card rounded-2xl p-10 md:p-14 bracket-corner text-center max-w-2xl mx-auto">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-sans mb-3">Collaboration</p>
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-4">
              Interested in working with us?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
              We welcome collaborations with researchers, institutions, and organisations committed to responsible AI and human-centred technology.
            </p>
            <Button asChild size="lg" className="gap-2 btn-press">
              <Link href="/contact">Get in touch <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
