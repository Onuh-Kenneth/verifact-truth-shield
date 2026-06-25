import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Verifact" },
      { name: "description", content: "The terms that govern your use of Verifact." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Legal</div>
        <h1 className="font-display text-5xl tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: June 25, 2026</p>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display text-2xl">1. Acceptance</h2>
            <p className="text-muted-foreground">By using Verifact you agree to these terms. If you do not agree, please don't use the service.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">2. What Verifact is — and isn't</h2>
            <p className="text-muted-foreground">Verifact is an AI-assisted fact-checking tool. Verdicts are generated automatically and may be wrong. They are not legal, medical, financial, or journalistic advice. Always cross-reference critical claims with primary sources before acting on them.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">3. Acceptable use</h2>
            <p className="text-muted-foreground">Don't submit content that is illegal, harassing, or that infringes someone else's rights. Don't attempt to overload, reverse-engineer, or abuse the service. We may rate-limit or suspend accounts that do.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">4. Your content</h2>
            <p className="text-muted-foreground">You retain ownership of text you submit. By marking a verification public, you grant us a non-exclusive license to display it on the public trust page URL you've chosen to share.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">5. Disclaimer</h2>
            <p className="text-muted-foreground">Verifact is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we are not liable for any decisions made based on its output.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">6. Changes</h2>
            <p className="text-muted-foreground">We may update these terms. Material changes will be announced on the site at least 14 days before they take effect.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">7. Contact</h2>
            <p className="text-muted-foreground">Questions about these terms: <a className="text-primary hover:underline" href="mailto:legal@verifact.app">legal@verifact.app</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
