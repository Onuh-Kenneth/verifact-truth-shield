import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Search, FileText, Zap, Eye, ArrowRight, CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verifact — Your AI Truth Shield" },
      { name: "description", content: "Verifact is an AI-powered fact-checking suite. Extract claims, verify evidence, and protect yourself from misinformation in real time." },
      { property: "og:title", content: "Verifact — Your AI Truth Shield" },
      { property: "og:description", content: "AI-powered claim extraction and real-time verdicts for any text or document." },
    ],
  }),
  component: Index,
});

const verdicts = [
  { icon: CheckCircle2, label: "True", color: "verdict-true", desc: "Verified by reliable sources" },
  { icon: XCircle, label: "False", color: "verdict-false", desc: "Contradicted by factual data" },
  { icon: AlertTriangle, label: "Misleading", color: "verdict-misleading", desc: "Lacks critical context" },
  { icon: HelpCircle, label: "Unverified", color: "verdict-unverified", desc: "Insufficient evidence" },
];

const features = [
  { icon: Sparkles, title: "AI Claim Extraction", desc: "Verifact scans text and surfaces only specific factual claims — opinions and subjective takes are filtered out automatically." },
  { icon: Search, title: "Evidence Logs", desc: "Every claim ships with a summary of supporting or contradicting evidence and links to reputable sources for manual review." },
  { icon: FileText, title: "Multi-Format Import", desc: "Paste raw text or drop in articles. The engine handles any length up to 12,000 characters per scan." },
  { icon: Zap, title: "Real-Time Verdicts", desc: "Color-coded results in seconds, powered by Gemini and a structured tool-calling pipeline." },
  { icon: Eye, title: "Credibility Index", desc: "Each scan returns an overall credibility percentage so you can gauge a document at a glance." },
  { icon: ShieldCheck, title: "Privacy-First", desc: "Your text is processed securely. Nothing is stored without your account." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Powered by Gemini · Real-time fact-checking
          </div>
          <h1 className="font-display text-6xl leading-[1.05] tracking-tight md:text-8xl">
            Your personal<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-orb)" }}>truth shield.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Verifact reads any text, extracts every factual claim, and assigns a verdict backed by evidence — so you never have to wonder what's real online.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-8 text-base shadow-[var(--shadow-elegant)]">
              <Link to="/verify">
                Verify a claim <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <a href="#features">See how it works</a>
            </Button>
          </div>

          {/* Verdict legend */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            {verdicts.map((v) => (
              <div key={v.label} className="rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)]">
                <v.icon className="h-5 w-5" style={{ color: `var(--color-${v.color})` }} />
                <div className="mt-3 text-sm font-semibold">{v.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <div className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">The Engine</div>
            <h2 className="font-display text-5xl tracking-tight">Built for the post-truth internet.</h2>
            <p className="mt-4 text-muted-foreground">An end-to-end pipeline that finds claims, weighs evidence, and explains the logic — in seconds.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="bg-card p-8 transition-colors hover:bg-accent/30">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-5xl tracking-tight md:text-6xl">Stop guessing. Start verifying.</h2>
          <p className="mt-5 text-lg text-muted-foreground">Open the Verifact editor and run your first scan — no signup required.</p>
          <Button asChild size="lg" className="mt-10 h-12 px-8 text-base shadow-[var(--shadow-elegant)]">
            <Link to="/verify">
              Launch the editor <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Verifact · Built for clarity
      </footer>
    </div>
  );
}
