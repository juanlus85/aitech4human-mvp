import { Link } from "wouter";
import { FlaskConical, Globe } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border/50 mt-24">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-serif font-semibold text-foreground">AI&Tech4Human</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Emerging Technologies for Societal Wellbeing. A European research group within the Ulysseus Alliance.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About the Group" },
                { href: "/members", label: "Members" },
                { href: "/news", label: "News" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partner Universities */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Partner Universities</h4>
            <ul className="space-y-2">
              {[
                "University of Seville",
                "Haaga-Helia University of Applied Sciences",
                "University of Montenegro",
              ].map((uni) => (
                <li key={uni} className="flex items-start gap-2">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{uni}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AI&Tech4Human Research Group · Ulysseus Alliance
          </p>
          <p className="text-xs text-muted-foreground">
            Applied Artificial Intelligence for Business & Education
          </p>
        </div>
      </div>
    </footer>
  );
}
