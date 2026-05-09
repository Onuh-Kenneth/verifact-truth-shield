import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, useMemo } from "react";
import {
  FolderOpen, FileText, Loader2, Sparkles, CheckCircle2, XCircle,
  AlertTriangle, HelpCircle, X, BookOpen, TrendingUp, ShieldCheck, Search,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromFile } from "@/lib/extract-document";
import { useUser } from "@/lib/use-user";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Research Library — Verifact" },
      { name: "description", content: "Drop a folder of research papers and Verifact rates each one's credibility automatically — no need to open them." },
      { property: "og:title", content: "Verifact Research Library" },
      { property: "og:description", content: "Batch-scan local PDFs and documents for credibility scores." },
    ],
  }),
  component: Library,
});

type Verdict = "true" | "false" | "misleading" | "unverified";
type Status = "pending" | "extracting" | "verifying" | "done" | "error";
interface Claim {
  claim: string; verdict: Verdict; confidence: number; reasoning: string;
  evidence: { title: string; url: string; snippet: string }[];
}
interface PaperEntry {
  id: string;
  file: File;
  status: Status;
  progress: number;
  error?: string;
  score?: number;
  summary?: string;
  claims?: Claim[];
  text?: string;
}

const ACCEPTED = /\.(pdf|docx|txt|md)$/i;

function scoreColor(s: number) {
  if (s >= 75) return "var(--verdict-true)";
  if (s >= 50) return "var(--verdict-misleading)";
  return "var(--verdict-false)";
}
function scoreLabel(s: number) {
  if (s >= 85) return "Highly credible";
  if (s >= 70) return "Credible";
  if (s >= 50) return "Mixed";
  if (s >= 30) return "Low credibility";
  return "Unreliable";
}

function Library() {
  const { user } = useUser();
  const [papers, setPapers] = useState<PaperEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState<PaperEntry | null>(null);
  const [query, setQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const folderRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => papers.filter((p) => p.file.name.toLowerCase().includes(query.toLowerCase())),
    [papers, query]
  );
  const stats = useMemo(() => {
    const done = papers.filter((p) => p.status === "done" && typeof p.score === "number");
    const avg = done.length ? Math.round(done.reduce((a, b) => a + (b.score || 0), 0) / done.length) : 0;
    const credible = done.filter((p) => (p.score || 0) >= 70).length;
    const flagged = done.filter((p) => (p.score || 0) < 50).length;
    return { total: papers.length, done: done.length, avg, credible, flagged };
  }, [papers]);

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list).filter((f) => ACCEPTED.test(f.name) && f.size <= 20 * 1024 * 1024);
    if (!arr.length) {
      toast.error("No supported files found (PDF, DOCX, TXT, MD ≤ 20MB).");
      return;
    }
    const entries: PaperEntry[] = arr.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      status: "pending",
      progress: 0,
    }));
    setPapers((prev) => [...prev, ...entries]);
    toast.success(`Queued ${arr.length} document${arr.length === 1 ? "" : "s"}`);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const items = e.dataTransfer.items;
    if (items && items.length) {
      // Try directory traversal where supported, fallback to flat files
      const collected: File[] = [];
      const walks: Promise<void>[] = [];
      const walk = (entry: any, path = ""): Promise<void> => new Promise((resolve) => {
        if (!entry) return resolve();
        if (entry.isFile) {
          entry.file((file: File) => { collected.push(file); resolve(); });
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          const readBatch = () => {
            reader.readEntries((ents: any[]) => {
              if (!ents.length) return resolve();
              Promise.all(ents.map((c) => walk(c, path + "/" + entry.name))).then(() => readBatch());
            });
          };
          readBatch();
        } else resolve();
      });
      for (let i = 0; i < items.length; i++) {
        const it = items[i] as any;
        const entry = it.webkitGetAsEntry?.();
        if (entry) walks.push(walk(entry));
      }
      if (walks.length) {
        Promise.all(walks).then(() => addFiles(collected));
        return;
      }
    }
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const update = (id: string, patch: Partial<PaperEntry>) =>
    setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const scanOne = async (entry: PaperEntry) => {
    try {
      update(entry.id, { status: "extracting", progress: 10 });
      const text = await extractTextFromFile(entry.file);
      if (!text || text.length < 30) throw new Error("No readable text");
      const trimmed = text.slice(0, 12000);
      update(entry.id, { status: "verifying", progress: 55, text: trimmed });
      const { data, error } = await supabase.functions.invoke("verify-claims", { body: { text: trimmed } });
      if (error) throw error;
      const result = data as { error?: string; credibility_score: number; summary: string; claims: Claim[] };
      if (result.error) throw new Error(result.error);
      update(entry.id, {
        status: "done", progress: 100,
        score: result.credibility_score, summary: result.summary, claims: result.claims,
      });
      if (user) {
        const domains = Array.from(new Set(
          result.claims.flatMap((c) => c.evidence.map((e) => {
            try { return new URL(e.url).hostname.replace(/^www\./, ""); } catch { return null; }
          }).filter((x): x is string => !!x))
        ));
        await supabase.from("verifications").insert({
          user_id: user.id,
          source_text: trimmed, source_name: entry.file.name,
          summary: result.summary, credibility_score: result.credibility_score,
          claims: result.claims as never, domains,
        });
      }
    } catch (e) {
      update(entry.id, { status: "error", progress: 100, error: e instanceof Error ? e.message : "Failed" });
    }
  };

  const scanAll = async () => {
    const queue = papers.filter((p) => p.status === "pending" || p.status === "error");
    if (!queue.length) { toast.info("Nothing to scan."); return; }
    setScanning(true);
    // Run in batches of 2 to avoid overloading
    const BATCH = 2;
    for (let i = 0; i < queue.length; i += BATCH) {
      await Promise.all(queue.slice(i, i + BATCH).map(scanOne));
    }
    setScanning(false);
    toast.success("Library scan complete");
  };

  const clearAll = () => { setPapers([]); setOpen(null); };
  const removeOne = (id: string) => setPapers((p) => p.filter((x) => x.id !== id));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
              <BookOpen className="h-3.5 w-3.5" /> Research Library
            </div>
            <h1 className="font-display text-5xl tracking-tight">Scan a whole folder.</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Drop a folder of research papers, articles, or PDFs. Verifact rates the credibility of each one
              without you opening a single file.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/verify"><Sparkles className="h-4 w-4 mr-1.5" /> Single document</Link>
          </Button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
            dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card/40"
          }`}
        >
          <div className="absolute inset-0 -z-10 opacity-40" style={{ background: "var(--gradient-hero)" }} />
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl shadow-[var(--shadow-elegant)]"
            style={{ background: "var(--gradient-orb)" }}>
            <FolderOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mt-5 font-display text-3xl">Drop your research folder here</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            PDF · DOCX · TXT · MD &nbsp;·&nbsp; everything stays on your device until you hit scan
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => folderRef.current?.click()} size="lg" className="shadow-[var(--shadow-elegant)]">
              <FolderOpen className="h-4 w-4 mr-1.5" /> Pick folder
            </Button>
            <Button onClick={() => filesRef.current?.click()} size="lg" variant="outline">
              <FileText className="h-4 w-4 mr-1.5" /> Pick files
            </Button>
            <input
              ref={folderRef} type="file" multiple className="hidden"
              // @ts-expect-error - non-standard but widely supported
              webkitdirectory="" directory=""
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <input
              ref={filesRef} type="file" multiple
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>
        </div>

        {/* Stats + controls */}
        {papers.length > 0 && (
          <>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <StatCard icon={FileText} label="Documents" value={stats.total} />
              <StatCard icon={CheckCircle2} label="Credible" value={stats.credible} accent="var(--verdict-true)" />
              <StatCard icon={AlertTriangle} label="Flagged" value={stats.flagged} accent="var(--verdict-false)" />
              <StatCard icon={TrendingUp} label="Avg score" value={stats.done ? `${stats.avg}/100` : "—"} accent={stats.done ? scoreColor(stats.avg) : undefined} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search papers…" className="pl-9" />
              </div>
              <Button onClick={scanAll} disabled={scanning} size="lg" className="shadow-[var(--shadow-elegant)]">
                {scanning ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Scanning…</> :
                  <><Sparkles className="h-4 w-4 mr-1.5" /> Scan all</>}
              </Button>
              <Button variant="ghost" onClick={clearAll} disabled={scanning}>Clear</Button>
            </div>

            {/* Paper grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <PaperCard key={p.id} entry={p} onOpen={() => p.status === "done" && setOpen(p)} onRemove={() => removeOne(p.id)} />
              ))}
            </div>
          </>
        )}

        {/* Detail modal */}
        {open && <DetailModal entry={open} onClose={() => setOpen(null)} />}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof FileText; label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <Icon className="h-4 w-4" style={{ color: accent || "var(--muted-foreground)" }} />
      <div className="mt-3 font-display text-3xl tracking-tight" style={{ color: accent || undefined }}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

const verdictIcon = { true: CheckCircle2, false: XCircle, misleading: AlertTriangle, unverified: HelpCircle } as const;

function PaperCard({ entry, onOpen, onRemove }: { entry: PaperEntry; onOpen: () => void; onRemove: () => void }) {
  const isDone = entry.status === "done" && typeof entry.score === "number";
  const isErr = entry.status === "error";
  const busy = entry.status === "extracting" || entry.status === "verifying";
  const color = isDone ? scoreColor(entry.score!) : isErr ? "var(--verdict-false)" : "var(--muted-foreground)";

  return (
    <button
      onClick={onOpen}
      disabled={!isDone}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)] transition-all ${
        isDone ? "hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)] cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: color, opacity: isDone || isErr ? 1 : 0.3 }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{entry.file.name}</span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            {isDone ? (
              <>
                <div className="font-display text-4xl tracking-tight" style={{ color }}>{entry.score}</div>
                <div className="pb-1 text-xs text-muted-foreground">/100</div>
              </>
            ) : isErr ? (
              <div className="font-display text-2xl text-[var(--verdict-false)]">Error</div>
            ) : busy ? (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                {entry.status === "extracting" ? "Reading…" : "Verifying…"}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Queued</div>
            )}
          </div>
          {isDone && (
            <div className="mt-1 text-xs font-medium" style={{ color }}>{scoreLabel(entry.score!)}</div>
          )}
          {isDone && entry.summary && (
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{entry.summary}</p>
          )}
          {isErr && <p className="mt-3 text-xs text-[var(--verdict-false)]">{entry.error}</p>}
          {isDone && entry.claims && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(["true", "false", "misleading", "unverified"] as Verdict[]).map((v) => {
                const n = entry.claims!.filter((c) => c.verdict === v).length;
                if (!n) return null;
                const Icon = verdictIcon[v];
                return (
                  <span key={v} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                    style={{ color: `var(--verdict-${v})` }}>
                    <Icon className="h-3 w-3" /> {n}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-muted-foreground hover:text-foreground" aria-label="Remove">
          <X className="h-4 w-4" />
        </button>
      </div>
      {(busy || entry.status === "pending") && (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full transition-all" style={{ width: `${entry.progress}%`, background: "var(--gradient-orb)" }} />
        </div>
      )}
    </button>
  );
}

function DetailModal({ entry, onClose }: { entry: PaperEntry; onClose: () => void }) {
  const score = entry.score ?? 0;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <button onClick={onClose} className="absolute right-5 top-5 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> {entry.file.name}
        </div>
        <div className="mt-3 flex items-end gap-3">
          <div className="font-display text-6xl tracking-tight" style={{ color: scoreColor(score) }}>{score}</div>
          <div className="pb-2"><div className="text-sm text-muted-foreground">/100</div>
            <div className="text-sm font-medium" style={{ color: scoreColor(score) }}>{scoreLabel(score)}</div></div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full" style={{ width: `${score}%`, background: scoreColor(score) }} />
        </div>
        {entry.summary && <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{entry.summary}</p>}
        {entry.claims && entry.claims.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Extracted claims</div>
            {entry.claims.map((c, i) => {
              const Icon = verdictIcon[c.verdict];
              return (
                <div key={i} className="rounded-xl border border-border bg-background/50 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: `var(--verdict-${c.verdict})` }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `var(--verdict-${c.verdict})` }}>{c.verdict}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(c.confidence * 100)}%</span>
                  </div>
                  <p className="mt-2 text-sm">{c.claim}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.reasoning}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
