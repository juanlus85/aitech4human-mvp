import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Newspaper } from "lucide-react";
import { format } from "date-fns";

export default function News() {
  const { data: newsList, isLoading } = trpc.news.publicList.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <section className="py-20">
        <div className="container">
          <div className="mb-12">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Updates</p>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">News & Announcements</h1>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-6 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : newsList && newsList.length > 0 ? (
            <div className="space-y-5">
              {newsList.map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`}>
                  <article className="glass-card rounded-xl p-6 md:p-8 hover-lift cursor-pointer">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">News</Badge>
                          {item.publishedAt && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.publishedAt), "MMMM d, yyyy")}
                            </span>
                          )}
                        </div>
                        <h2 className="font-serif text-xl md:text-2xl font-semibold text-foreground mb-2">
                          {item.title}
                        </h2>
                        {item.summary && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.summary}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-primary text-sm font-medium shrink-0">
                        Read more <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-16 text-center">
              <Newspaper className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No news published yet. Check back soon.</p>
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
