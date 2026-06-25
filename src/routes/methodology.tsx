import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — How Verifact assigns verdicts" },
      { name: "description", content: "How Verifact extracts claims, scores credibility, and weights evidence sources." },
    ],
  }),
  component: Methodology,
});

const verdicts = [
  { icon: CheckCircle2, color: "verdict-true", label: "True", desc: "The claim is supported by multiple reputable sources with no significant contradicting evidence." },
  { icon: XCircle, color: "verdict-false", label: "False", desc: "The claim is contradicted by reputable sources. Often a long-debunked myth or a verifiable factual error." },
  { icon: AlertTriangle, color: "verdict-misleading", label: "Misleading", desc: "Contains a kernel of truth but is presented in a way that creates a false impression — missing context, cherry-picked data, or wrong attribution." },
  { icon: HelpCircle, color: "verdict-unverified", label: "Unverified", desc: "Not enough reliable evidence to support or refute. The claim may be too new, too niche, or unverifiable in principle." },
];

function Methodology() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">How it works</div>
        <h1 className="font-display text-5xl tracking-tight">Methodology</h1>
        <p className="mt-3 text-muted-foreground">A transparent look at how Verifact turns text into verdicts.</p>

        <section className="mt-12 space-y-3">
          <h2 className="font-display text-2xl">1. Claim extraction</h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">When you submit text, an LLM (Google Gemini) reads it and pulls out only the discrete, factual claims — statements that can in principle be checked against evidence. Opinions, predictions, and rhetorical flourishes are skipped.</p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl">2. Evidence gathering</h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">For each claim, the model is asked to cite supporting or contradicting sources with title, URL, and a short snippet. Sources are not auto-fetched in real time today — they are surfaced by the model and surfaced to you to verify.</p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl">3. The four verdicts</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {verdicts.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.label} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" style={{ color: `var(--color-${v.color})` }} />
                    <span className="font-display text-lg">{v.label}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl">4. Source reputation weighting</h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">Not all sources are equal. Each evidence URL is matched against a reputation table covering peer-reviewed journals, established news outlets, government and academic domains, encyclopedias, and known low-quality sources. The final "Weighted Credibility" score blends the raw verdict score with the average reputation of cited sources.</p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl">5. What we don't claim</h2>
          <ul className="ml-5 list-disc space-y-2 text-[15px] text-muted-foreground">
            <li>We are not a substitute for human journalism or peer review.</li>
            <li>LLMs hallucinate. Always click through to the cited source before acting on a verdict.</li>
            <li>A "True" verdict means "supported by what we found", not "absolute truth".</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl">6. Found a wrong verdict?</h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">Use the <strong>Report</strong> button on any claim card. Your reports help us tune prompts and improve the evidence pipeline.</p>
          <Link to="/verify" className="inline-block mt-2 text-primary hover:underline">Try the Editor →</Link>
        </section>
      </main>
    </div>
  );
}
