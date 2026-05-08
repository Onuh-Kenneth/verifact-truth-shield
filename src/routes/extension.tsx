import { createFileRoute } from "@tanstack/react-router";
import { Download, Chrome, MousePointerClick, ShieldCheck, Monitor, Keyboard, Zap } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/extension")({
  head: () => ({
    meta: [
      { title: "Apps & Extension — Verifact" },
      { name: "description", content: "Install Verifact as a desktop app or browser extension. Highlight any text, anywhere, and verify it instantly." },
    ],
  }),
  component: ExtensionPage,
});

function downloadFile(filename: string, label: string) {
  return () => {
    fetch(`/${filename}`)
      .then((r) => { if (!r.ok) throw new Error(`Download failed: ${r.status}`); return r.blob(); })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`${label} download started`);
      })
      .catch((e) => toast.error(e.message));
  };
}

function ExtensionPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Universal Layer</div>
        <h1 className="font-display text-5xl tracking-tight">Verifact, everywhere you read</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Like Grammarly — but for truth. Highlight any claim in any app or website and get an instant verdict.
        </p>

        {/* Desktop App — primary */}
        <section className="mt-12 rounded-2xl border-2 border-primary/40 bg-card p-8 shadow-[var(--shadow-elegant)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Zap className="h-3 w-3" /> Recommended
              </div>
              <h2 className="font-display text-3xl">Verifact Desktop</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Runs quietly in your menu bar / system tray. Works with research papers, PDFs, Word docs,
                Apple Notes, Slack — anywhere you can copy text. One global hotkey, instant verdicts.
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-xl" style={{ background: "var(--gradient-orb)" }}>
              <Monitor className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Mini Icon={Keyboard} title="Global hotkey" body="⌘⇧V / Ctrl+Shift+V to verify clipboard from any app." />
            <Mini Icon={MousePointerClick} title="Tray menu" body="Click the green ✓ to fact-check on demand." />
            <Mini Icon={ShieldCheck} title="Background mode" body="No Dock icon on Mac, no taskbar clutter on Windows." />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={downloadFile("verifact-desktop.zip", "Desktop app")} size="lg" className="shadow-[var(--shadow-elegant)]">
              <Download className="mr-2 h-4 w-4" /> Download for Mac / Windows / Linux
            </Button>
            <span className="text-xs text-muted-foreground">Requires Node.js 18+ to run</span>
          </div>

          <details className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Setup instructions (≈30 seconds)</summary>
            <ol className="mt-3 space-y-2 list-decimal pl-5 text-muted-foreground">
              <li>Unzip the downloaded file.</li>
              <li>Open a terminal in the unzipped folder.</li>
              <li>Run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm install</code></li>
              <li>Run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm start</code></li>
              <li>Look for the green ✓ in your menu bar / system tray.</li>
              <li>Highlight text anywhere → copy (⌘C / Ctrl+C) → press <b>⌘⇧V</b> / <b>Ctrl+Shift+V</b>.</li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Don't have Node.js? Get it from{" "}
              <a className="text-primary underline" href="https://nodejs.org" target="_blank" rel="noreferrer">nodejs.org</a>.
            </p>
          </details>
        </section>

        {/* Browser extension */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl">Browser Extension</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                For verifying claims while you browse the web. Right-click any selection.
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
              <Chrome className="h-6 w-6 text-primary" />
            </div>
          </div>
          <Button onClick={downloadFile("verifact-extension.zip", "Extension")} variant="outline" size="lg" className="mt-5">
            <Download className="mr-2 h-4 w-4" /> Download extension (.zip)
          </Button>
          <ol className="mt-5 space-y-1.5 text-sm text-muted-foreground list-decimal pl-5">
            <li>Unzip the file.</li>
            <li>Open <code className="rounded bg-muted px-1.5 py-0.5 text-xs">chrome://extensions</code></li>
            <li>Enable <b>Developer mode</b> (top-right).</li>
            <li>Click <b>Load unpacked</b> and select the unzipped folder.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

function Mini({ Icon, title, body }: { Icon: typeof Chrome; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
