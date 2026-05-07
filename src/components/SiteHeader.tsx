import { Link } from "@tanstack/react-router";
import { Moon, Sun, ShieldCheck } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--gradient-orb)" }}>
            <ShieldCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl">Verifact</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">Overview</Link>
          <Link to="/verify" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">Verify</Link>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild size="sm">
            <Link to="/verify">Open Editor</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
