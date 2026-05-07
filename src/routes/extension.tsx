import { createFileRoute } from "@tanstack/react-router";
import { Download, Chrome, MousePointerClick, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/extension")({
  head: () => ({
    meta: [
      { title: "Browser Extension — Verifact" },
      { name: "description", content: "Right-click any sentence on the web to verify it instantly with Verifact." },
    ],
  }),
  component: ExtensionPage,
});

function ExtensionPage() {
  const download = () => {
    fetch("/verifact-extension.zip")
      .then((r) => { if (!r.ok) throw new Error(`Download failed: ${r.status}`); return r.blob(); })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "verifact-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Download started");
      })
      .catch((e) => toast.error(e.message));
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Universal Layer</div>
        <h1 className="font-display text-5xl tracking-tight">Verifact, everywhere you read</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Highlight any claim on any website, right-click, and get an instant verdict — without leaving the page.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: "var(--gradient-orb)" }}>
              <Chrome className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="mt-5 font-display text-2xl">Chrome / Edge / Brave</h2>
            <p className="mt-2 text-sm text-muted-foreground">Manifest V3 extension. Works in any Chromium browser.</p>
            <Button onClick={download} size="lg" className="mt-5 shadow-[var(--shadow-elegant)]">
              <Download className="mr-2 h-4 w-4" /> Download extension (.zip)
            </Button>
            <ol className="mt-6 space-y-2 text-sm text-muted-foreground list-decimal pl-5">
              <li>Unzip the downloaded file.</li>
              <li>Open <code className="rounded bg-muted px-1.5 py-0.5 text-xs">chrome://extensions</code></li>
              <li>Enable <b>Developer mode</b> (top-right).</li>
              <li>Click <b>Load unpacked</b> and select the unzipped folder.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <Feature Icon={MousePointerClick} title="Right-click verification" body="Highlight any sentence, right-click, and choose Verify with Verifact." />
            <Feature Icon={ShieldCheck} title="Overlay results" body="A sleek card appears on the page with verdict, confidence and evidence — no tab-switching." />
          </div>
        </div>
      </main>
    </div>
  );
}

function Feature({ Icon, title, body }: { Icon: typeof Chrome; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 font-display text-xl">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
