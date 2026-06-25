import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: "var(--gradient-orb)" }}>
            <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span>© {new Date().getFullYear()} Verifact. AI-assisted fact-checking.</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/extension" className="hover:text-foreground transition-colors">Extension</Link>
        </nav>
      </div>
    </footer>
  );
}
