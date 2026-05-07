import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Loader2, Sparkles, ExternalLink, FileText, Upload, X, Download } from "lucide-react";
import jsPDF from "jspdf";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromFile } from "@/lib/extract-document";
import { useUser } from "@/lib/use-user";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify — Verifact" },
      { name: "description", content: "Paste any text. Verifact extracts factual claims and returns evidence-backed verdicts in seconds." },
      { property: "og:title", content: "Verifact Editor" },
      { property: "og:description", content: "AI claim extraction with color-coded verdicts and source evidence." },
    ],
  }),
  component: Verify,
});

type Verdict = "true" | "false" | "misleading" | "unverified";
interface Claim {
  claim: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  evidence: { title: string; url: string; snippet: string }[];
}
interface Report {
  summary: string;
  credibility_score: number;
  claims: Claim[];
}

const verdictConfig: Record<Verdict, { icon: typeof CheckCircle2; label: string; color: string }> = {
  true: { icon: CheckCircle2, label: "True", color: "verdict-true" },
  false: { icon: XCircle, label: "False", color: "verdict-false" },
  misleading: { icon: AlertTriangle, label: "Misleading", color: "verdict-misleading" },
  unverified: { icon: HelpCircle, label: "Unverified", color: "verdict-unverified" },
};

const SAMPLE = `The Great Wall of China is visible from the Moon with the naked eye. It was built in a single dynasty around 200 BC and stretches over 21,000 kilometers. Albert Einstein won the Nobel Prize for his theory of relativity in 1921.`;

function Verify() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!/\.(pdf|docx|txt|md)$/.test(name)) {
      toast.error("Unsupported file type. Use PDF, DOCX, TXT, or MD.");
      return;
    }
    handleFile(f);
  };

  const handleFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB).");
      return;
    }
    setExtracting(true);
    try {
      const extracted = await extractTextFromFile(file);
      if (!extracted || extracted.length < 10) {
        toast.error("Couldn't extract readable text from this file.");
        return;
      }
      const trimmed = extracted.slice(0, 12000);
      setText(trimmed);
      setFileName(file.name);
      if (extracted.length > 12000) {
        toast.info(`Imported ${file.name} (truncated to 12,000 chars).`);
      } else {
        toast.success(`Imported ${file.name}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearFile = () => {
    setFileName(null);
    setText("");
  };

  const analyze = async () => {
    if (text.trim().length < 10) {
      toast.error("Please enter at least 10 characters.");
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-claims", {
        body: { text },
      });
      if (error) throw error;
      if ((data as { error?: string }).error) throw new Error((data as { error: string }).error);
      const result = data as Report;
      setReport(result);

      if (user) {
        const domains = Array.from(new Set(
          result.claims.flatMap((c) => c.evidence.map((e) => {
            try { return new URL(e.url).hostname.replace(/^www\./, ""); } catch { return null; }
          }).filter((x): x is string => !!x))
        ));
        const { error: insErr } = await supabase.from("verifications").insert({
          user_id: user.id,
          source_text: text.slice(0, 12000),
          source_name: fileName,
          summary: result.summary,
          credibility_score: result.credibility_score,
          claims: result.claims as never,
          domains,
        });
        if (insErr) console.error("save verification:", insErr);
        else toast.success("Saved to your dashboard");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    let y = margin;
    const ensure = (h: number) => { if (y + h > pageH - margin) { doc.addPage(); y = margin; } };
    const writeWrapped = (txt: string, size: number, opts: { bold?: boolean; color?: [number, number, number] } = {}) => {
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(...(opts.color ?? [20, 30, 40]));
      const lines = doc.splitTextToSize(txt, pageW - margin * 2);
      for (const line of lines) { ensure(size + 4); doc.text(line, margin, y); y += size + 4; }
    };

    writeWrapped("Verifact Report", 22, { bold: true, color: [30, 130, 80] });
    writeWrapped(new Date().toLocaleString(), 10, { color: [120, 120, 120] });
    if (fileName) writeWrapped(`Source: ${fileName}`, 10, { color: [120, 120, 120] });
    y += 8;
    writeWrapped(`Credibility Score: ${report.credibility_score}/100`, 14, { bold: true });
    writeWrapped(`Claims analyzed: ${report.claims.length}`, 11, { color: [80, 80, 80] });
    y += 6;
    writeWrapped("Summary", 13, { bold: true });
    writeWrapped(report.summary, 11);
    y += 10;
    writeWrapped("Claims", 13, { bold: true });
    report.claims.forEach((c, i) => {
      y += 6;
      const colors: Record<Verdict, [number, number, number]> = {
        true: [40, 150, 90], false: [200, 50, 50], misleading: [200, 150, 40], unverified: [120, 120, 120],
      };
      writeWrapped(`${i + 1}. [${verdictConfig[c.verdict].label.toUpperCase()}] (${Math.round(c.confidence * 100)}%)`, 11, { bold: true, color: colors[c.verdict] });
      writeWrapped(c.claim, 11);
      writeWrapped(c.reasoning, 10, { color: [90, 90, 90] });
      if (c.evidence.length) {
        writeWrapped("Evidence:", 10, { bold: true, color: [80, 80, 80] });
        c.evidence.forEach((ev) => writeWrapped(`• ${ev.title} — ${ev.url}`, 9, { color: [70, 110, 170] }));
      }
    });
    doc.save(`verifact-report-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <div className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Verification Engine</div>
          <h1 className="font-display text-5xl tracking-tight">The Editor</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Paste an article, social post, or any text. Verifact extracts factual claims and assigns evidence-backed verdicts.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Input */}
          <section className="space-y-4">
            <div
              onDragOver={onDragOver}
              onDragEnter={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative rounded-2xl border bg-card p-1 shadow-[var(--shadow-card)] transition-colors ${dragActive ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                  <FileText className="h-4 w-4 shrink-0" />
                  {fileName ? (
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="truncate text-foreground">{fileName}</span>
                      <button onClick={clearFile} className="text-muted-foreground hover:text-foreground" aria-label="Remove file">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    "Source text"
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={extracting}
                    className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
                  >
                    {extracting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    {extracting ? "Reading…" : "Upload PDF / DOCX"}
                  </button>
                  <button onClick={() => setText(SAMPLE)} className="text-primary hover:underline">
                    Sample
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste any text to fact-check…"
                className="min-h-[360px] resize-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
                maxLength={12000}
              />
              <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
                <span>{text.length} / 12000</span>
                <span>Powered by Gemini</span>
              </div>
              {dragActive && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <Upload className="h-8 w-8" />
                    <div className="font-display text-lg">Drop to import</div>
                    <div className="text-xs text-muted-foreground">PDF, DOCX, TXT, or MD</div>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={analyze}
              disabled={loading || text.trim().length < 10}
              size="lg"
              className="w-full h-12 shadow-[var(--shadow-elegant)]"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Verify claims</>
              )}
            </Button>
          </section>

          {/* Results */}
          <section className="space-y-4">
            {!report && !loading && (
              <div className="grid h-full min-h-[480px] place-items-center rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "var(--gradient-orb)" }}>
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl">Awaiting input</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Verdicts will appear here. Each claim is extracted, scored, and linked to evidence.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="grid h-full min-h-[480px] place-items-center rounded-2xl border border-border bg-card p-12 text-center">
                <div>
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">Extracting claims & cross-referencing…</p>
                </div>
              </div>
            )}

            {report && (
              <>
                {/* Score */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Credibility Index</div>
                      <div className="mt-2 font-display text-5xl tracking-tight">
                        {report.credibility_score}
                        <span className="text-2xl text-muted-foreground">/100</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-muted-foreground">{report.claims.length} claims analyzed</div>
                      <Button size="sm" variant="outline" onClick={downloadReport}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download report
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${report.credibility_score}%`,
                        background: "var(--gradient-orb)",
                      }}
                    />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{report.summary}</p>
                </div>

                {/* Claims */}
                <div className="space-y-3">
                  {report.claims.map((c, i) => {
                    const cfg = verdictConfig[c.verdict];
                    const Icon = cfg.icon;
                    return (
                      <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                        <div className="flex items-start gap-3 border-l-4 p-5" style={{ borderColor: `var(--color-${cfg.color})` }}>
                          <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: `var(--color-${cfg.color})` }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
                                style={{
                                  color: `var(--color-${cfg.color})`,
                                  background: `color-mix(in oklab, var(--color-${cfg.color}) 12%, transparent)`,
                                }}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-xs text-muted-foreground">{Math.round(c.confidence * 100)}% confidence</span>
                            </div>
                            <p className="mt-2 text-[15px] leading-relaxed">{c.claim}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{c.reasoning}</p>

                            {c.evidence.length > 0 && (
                              <div className="mt-4 space-y-2 border-t border-border pt-3">
                                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Evidence</div>
                                {c.evidence.map((ev, j) => (
                                  <a
                                    key={j}
                                    href={ev.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
                                  >
                                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                                    <div className="min-w-0">
                                      <div className="truncate font-medium">{ev.title}</div>
                                      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{ev.snippet}</div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
