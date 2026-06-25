import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Verifact" },
      { name: "description", content: "How Verifact collects, uses, and protects your data." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Legal</div>
        <h1 className="font-display text-5xl tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: June 25, 2026</p>

        <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display text-2xl">1. What we collect</h2>
            <p className="text-muted-foreground">When you create an account we store your email and an authentication identifier. When you run a verification we store the text you submit, the AI-generated verdicts, and the evidence URLs returned. We do not sell or share this data with third-party advertisers.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">2. How we use it</h2>
            <p className="text-muted-foreground">Submitted text is sent to our AI provider (Google Gemini via Lovable AI Gateway) to extract claims and generate verdicts. We store results so you can revisit them in your dashboard and share public trust pages when you choose to.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">3. Public trust pages</h2>
            <p className="text-muted-foreground">If you mark a verification as public, the source text, verdicts, and evidence become viewable at a shareable URL. You can unpublish from your dashboard at any time.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">4. Data retention</h2>
            <p className="text-muted-foreground">Verifications are kept until you delete them or close your account. Deleting your account removes all associated verifications within 30 days.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">5. Your rights</h2>
            <p className="text-muted-foreground">You can request export or deletion of your data at any time by emailing <a className="text-primary hover:underline" href="mailto:privacy@verifact.app">privacy@verifact.app</a>.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">6. Cookies</h2>
            <p className="text-muted-foreground">We use first-party cookies and localStorage only for authentication and UI preferences (e.g. theme). No third-party tracking cookies.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl">7. Contact</h2>
            <p className="text-muted-foreground">Questions? Reach us at <a className="text-primary hover:underline" href="mailto:hello@verifact.app">hello@verifact.app</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
