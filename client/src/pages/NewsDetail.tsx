import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function NewsDetail() {
  const params = useParams<{ slug: string }>();
  const { data: item, isLoading } = trpc.news.publicBySlug.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <section className="py-16">
        <div className="container max-w-3xl">
          <Link href="/news">
            <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to News
            </Button>
          </Link>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !item ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-muted-foreground">Article not found.</p>
            </div>
          ) : (
            <article className="glass-card rounded-2xl p-8 md:p-12 bracket-accent">
              <div className="flex items-center gap-2 mb-5">
                <Badge variant="secondary">News</Badge>
                {item.publishedAt && (
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(item.publishedAt), "MMMM d, yyyy")}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight mb-4">
                {item.title}
              </h1>

              {item.summary && (
                <p className="text-lg text-muted-foreground leading-relaxed mb-8 line-accent">
                  {item.summary}
                </p>
              )}

              <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-line">
                {item.content}
              </div>
            </article>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
