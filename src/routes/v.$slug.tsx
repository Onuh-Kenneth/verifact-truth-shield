import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ExternalLink, ShieldCheck, Code2, Copy } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { reputationForUrl, weightedCredibility } from "@/lib/source-reputation";

type Verdict = "true" | "false" | "misleading" | "unverified";
interface Claim {
  claim: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  evidence: { title: string; url: string; snippet: string }[];
}

interface PublicVerification {
  id: string;
  share_slug: string;
  source_name: string | null;
  summary: string;
  credibility_score: number;
  claims: Claim[];
  domains: string[];
  created_at: string;
}

export const Route = createFileRoute("/v/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("verifications")
      .select("id, share_slug, source_name, summary, credibility_score, claims, domains, created_at")
      .eq("share_slug", params.slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data as unknown as PublicVerification;
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `Verifact Trust Page — ${loaderData.credibility_score}/100` },
      { name: "description", content: loaderData.summary?.slice(0, 155) },
      { property: "og:title", content: `Credibility ${loaderData.credibility_score}/100 — Verifact` },
      { property: "og:description", content: loaderData.summary?.slice(0, 200) },
    ] : [{ title: "Verifact Trust Page" }],
  }),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <p className="text-destructive">{error.message}</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">Back to Verifact</Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-3xl">Trust page not found</h1>
        <p className="mt-2 text-muted-foreground">This share link may have been removed or set private.</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">Go home</Link>
      </div>
    </div>
  ),
  component: PublicTrustPage,
});

const verdictConfig: Record<Verdict, { icon: typeof CheckCircle2; label: string; token: string }> = {
  true:        { icon: CheckCircle2, label: "True",        token: "verdict-true" },
  false:       { icon: XCircle,      label: "False",       token: "verdict-false" },
  misleading:  { icon: AlertTriangle, label: "Misleading", token: "verdict-misleading" },
  unverified:  { icon: HelpCircle,   label: "Unverified",  token: "verdict-unverified" },
};

function PublicTrustPage() {
  const data = Route.useLoaderData();
  const [showEmbed, setShowEmbed] = useState(false);

  const evidenceUrls = data.claims.flatMap((c) => c.evidence.map((e) => e.url));
  const { weighted, avgReputation, delta } = weightedCredibility(data.credibility_score, evidenceUrls);
  const counts = data.claims.reduce<Record<Verdict, number>>(
    (acc, c) => ({ ...acc, [c.verdict]: (acc[c.verdict] || 0) + 1 }),
    { true: 0, false: 0, misleading: 0, unverified: 0 },
  );

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/v/${data.share_slug}` : "";
  const badgeSvg = `${shareUrl.replace(/\/v\/.*/, "")}/api/badge/${data.share_slug}.svg`;
  const embedHtml = `<a href="${shareUrl}" target="_blank" rel="noopener" style="text-decoration:none">
  <img src="${badgeSvg}" alt="Verifact verified — ${weighted}/100" height="32" />
</a>`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header strip */}
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl">
            <span className="grid h-7 w-7 place-items-center rounded-md text-primary-foreground" style={{ background: "var(--gradient-orb)" }}>
              <ShieldCheck className="h-4 w-4" />
            </span>
            Verifact
          </Link>
          <Link to="/verify" className="text-sm text-primary hover:underline">Verify your own →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Public Trust Page</div>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          {data.source_name || "Verified Claim Set"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verified {new Date(data.created_at).toLocaleDateString(undefined, { dateStyle: "long" })} · {data.claims.length} claims analyzed
        </p>

        {/* Score panel */}
        <section className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)] md:grid-cols-[auto_1fr]">
          <div className="grid h-32 w-32 place-items-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-orb)" }}>
            <div className="text-center">
              <div className="font-display text-4xl">{weighted}</div>
              <div className="text-[10px] uppercase tracking-widest opacity-80">/100 weighted</div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-base leading-relaxed">{data.summary}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-muted px-3 py-1">Raw score: {data.credibility_score}</span>
              <span className="rounded-full bg-muted px-3 py-1">Source reputation avg: {avgReputation}/100</span>
              <span className={`rounded-full px-3 py-1 ${delta >= 0 ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"}`}>
                Source weighting: {delta >= 0 ? "+" : ""}{delta}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => copy(shareUrl, "Share URL")}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy share link
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowEmbed((s) => !s)}>
                <Code2 className="mr-1.5 h-3.5 w-3.5" /> {showEmbed ? "Hide embed" : "Embed badge"}
              </Button>
            </div>
            {showEmbed && (
              <div className="mt-2 space-y-2">
                <pre className="overflow-x-auto rounded-xl border border-border bg-muted/30 p-3 text-xs">
                  <code>{embedHtml}</code>
                </pre>
                <Button size="sm" variant="ghost" onClick={() => copy(embedHtml, "Embed code")}>Copy embed HTML</Button>
              </div>
            )}
          </div>
        </section>

        {/* Verdict counts */}
        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(Object.keys(verdictConfig) as Verdict[]).map((v) => {
            const cfg = verdictConfig[v];
            const Icon = cfg.icon;
            return (
              <div key={v} className="rounded-2xl border border-border bg-card p-4 text-center">
                <Icon className="mx-auto h-5 w-5" style={{ color: `var(--color-${cfg.token})` }} />
                <div className="mt-2 font-display text-2xl">{counts[v]}</div>
                <div className="text-xs text-muted-foreground">{cfg.label}</div>
              </div>
            );
          })}
        </section>

        {/* Claims */}
        <section className="mt-8 space-y-3">
          <h2 className="font-display text-2xl">Verified Claims</h2>
          {data.claims.map((c, i) => {
            const cfg = verdictConfig[c.verdict];
            const Icon = cfg.icon;
            return (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-3 border-l-4 pl-4" style={{ borderColor: `var(--color-${cfg.token})` }}>
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: `var(--color-${cfg.token})` }} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
                        style={{
                          color: `var(--color-${cfg.token})`,
                          background: `color-mix(in oklab, var(--color-${cfg.token}) 12%, transparent)`,
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{Math.round(c.confidence * 100)}% confidence</span>
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed">{c.claim}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{c.reasoning}</p>
                    {c.evidence.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-border pt-3">
                        {c.evidence.map((ev, j) => {
                          const rep = reputationForUrl(ev.url);
                          return (
                            <a key={j} href={ev.url} target="_blank" rel="noopener noreferrer"
                              className="group flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm transition-colors hover:border-primary/40">
                              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="truncate font-medium">{ev.title}</div>
                                  {rep && (
                                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                      {rep.label}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{ev.snippet}</div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Verified by <Link to="/" className="text-primary hover:underline">Verifact</Link> · Source reputation weighted using domain authority tiers
        </footer>
      </main>
    </div>
  );
}
