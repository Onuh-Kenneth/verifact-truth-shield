import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Search, FileText, Zap, Eye, ArrowRight, CheckCircle2, XCircle, AlertTriangle, HelpCircle, FolderOpen, BookOpen, Download } from "lucide-react";
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

const tickerSamples = [
  { v: "true", text: "Water boils at 100°C at sea level" },
  { v: "false", text: "The Great Wall is visible from the Moon" },
  { v: "misleading", text: "Vaccines cause autism in children" },
  { v: "true", text: "Einstein won the 1921 Nobel Prize" },
  { v: "unverified", text: "Coffee linked to longer lifespan" },
  { v: "false", text: "Humans only use 10% of their brains" },
  { v: "true", text: "The Sahara is the largest hot desert" },
  { v: "misleading", text: "Sugar makes children hyperactive" },
] as const;

const verdictIcon = { true: CheckCircle2, false: XCircle, misleading: AlertTriangle, unverified: HelpCircle };

function Index() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SiteHeader />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 -z-10 bg-grid text-foreground" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute -top-10 left-10 -z-10 h-72 w-72 rounded-full opacity-40 blur-3xl animate-float-slow"
          style={{ background: "var(--gradient-orb)" }} />
        <div className="pointer-events-none absolute top-40 right-10 -z-10 h-80 w-80 rounded-full opacity-30 blur-3xl animate-float-rev"
          style={{ background: "radial-gradient(circle, var(--verdict-true), transparent 70%)" }} />

        <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Powered by Gemini · Real-time fact-checking
          </div>
          <h1 className="font-display text-6xl leading-[1.05] tracking-tight md:text-8xl">
            Your personal<br />
            <span className="text-gradient">truth shield.</span>
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
              <Link to="/library">
                <FolderOpen className="mr-2 h-4 w-4" /> Scan a folder
              </Link>
            </Button>
          </div>

          {/* Verdict legend */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            {verdicts.map((v, i) => (
              <div key={v.label}
                className="group relative rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
                style={{ animationDelay: `${i * 100}ms` }}>
                <div className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: `var(--color-${v.color})` }} />
                <v.icon className="h-5 w-5" style={{ color: `var(--color-${v.color})` }} />
                <div className="mt-3 text-sm font-semibold">{v.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live ticker */}
        <div className="relative border-y border-border bg-card/40 py-4 backdrop-blur">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
          <div className="flex animate-marquee gap-4 whitespace-nowrap">
            {[...tickerSamples, ...tickerSamples].map((t, i) => {
              const Icon = verdictIcon[t.v];
              return (
                <div key={i} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-sm">
                  <Icon className="h-3.5 w-3.5" style={{ color: `var(--verdict-${t.v})` }} />
                  <span className="text-muted-foreground">{t.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Research Library spotlight */}
      <section className="relative border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-10 rounded-3xl border border-border bg-card p-10 shadow-[var(--shadow-card)] md:grid-cols-2 md:p-14">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
                <BookOpen className="h-3.5 w-3.5" /> New · Research Library
              </div>
              <h2 className="font-display text-4xl tracking-tight md:text-5xl">
                Drop a folder. Get every paper's <span className="text-gradient">credibility score.</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Point Verifact at a folder of research papers, articles, or reports. It reads each one,
                extracts the factual claims, and ranks them by credibility — without you opening a single PDF.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="shadow-[var(--shadow-elegant)]">
                  <Link to="/library"><FolderOpen className="mr-2 h-4 w-4" /> Open library</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/extension"><Download className="mr-2 h-4 w-4" /> Get desktop app</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-3xl opacity-30 blur-3xl"
                style={{ background: "var(--gradient-orb)" }} />
              <div className="space-y-3 rounded-2xl border border-border bg-background/80 p-5 backdrop-blur">
                {[
                  { name: "climate-policy-2024.pdf", score: 88, tag: "Highly credible", v: "true" as const },
                  { name: "alt-medicine-claims.docx", score: 34, tag: "Low credibility", v: "false" as const },
                  { name: "ai-safety-survey.pdf", score: 71, tag: "Credible", v: "true" as const },
                  { name: "viral-blog-post.txt", score: 52, tag: "Mixed", v: "misleading" as const },
                ].map((p) => {
                  const Icon = verdictIcon[p.v];
                  return (
                    <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                        style={{ background: `color-mix(in oklab, var(--verdict-${p.v}) 15%, transparent)` }}>
                        <Icon className="h-5 w-5" style={{ color: `var(--verdict-${p.v})` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.tag}</div>
                      </div>
                      <div className="font-display text-2xl tracking-tight" style={{ color: `var(--verdict-${p.v})` }}>
                        {p.score}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative border-b border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <div className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">The Engine</div>
            <h2 className="font-display text-5xl tracking-tight">Built for the post-truth internet.</h2>
            <p className="mt-4 text-muted-foreground">An end-to-end pipeline that finds claims, weighs evidence, and explains the logic — in seconds.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group bg-card p-8 transition-all hover:bg-accent/30">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110 group-hover:rotate-3">
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
      <section className="relative py-32">
        <div className="absolute inset-0 -z-10 bg-grid text-foreground opacity-50" />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-5xl tracking-tight md:text-6xl">
            Stop guessing. <span className="shimmer-text">Start verifying.</span>
          </h2>
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
