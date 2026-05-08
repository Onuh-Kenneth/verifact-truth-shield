import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Loader2, Sparkles, FileText, Trash2, TrendingUp, Globe, ChevronRight, User as UserIcon, Mail, Calendar, LogOut, Search, BarChart3, History as HistoryIcon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/use-user";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Verifact" },
      { name: "description", content: "Your verification history, credibility trends, and domain trust scores." },
    ],
  }),
  component: Dashboard,
});

type Verdict = "true" | "false" | "misleading" | "unverified";
interface ClaimRow { claim: string; verdict: Verdict; confidence: number; reasoning: string; evidence: { title: string; url: string; snippet: string }[]; }
interface Verification {
  id: string;
  source_text: string;
  source_name: string | null;
  summary: string;
  credibility_score: number;
  claims: ClaimRow[];
  domains: string[];
  created_at: string;
}

const verdictMeta: Record<Verdict, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  true: { label: "True", color: "verdict-true", Icon: CheckCircle2 },
  false: { label: "False", color: "verdict-false", Icon: XCircle },
  misleading: { label: "Misleading", color: "verdict-misleading", Icon: AlertTriangle },
  unverified: { label: "Unverified", color: "verdict-unverified", Icon: HelpCircle },
};

function scoreColor(s: number) {
  return s >= 70 ? "verdict-true" : s >= 40 ? "verdict-misleading" : "verdict-false";
}

function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Verification[] | null>(null);
  const [active, setActive] = useState<Verification | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!userLoading && !user) navigate({ to: "/auth" });
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("verifications")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
          setRows([]);
          return;
        }
        setRows((data || []) as unknown as Verification[]);
      });
  }, [user]);

  const stats = useMemo(() => {
    if (!rows) return null;
    if (rows.length === 0) return { avg: 0, total: 0, totalClaims: 0, verdictCounts: { true: 0, false: 0, misleading: 0, unverified: 0 } as Record<Verdict, number> };
    const avg = Math.round(rows.reduce((s, r) => s + r.credibility_score, 0) / rows.length);
    const verdictCounts = { true: 0, false: 0, misleading: 0, unverified: 0 } as Record<Verdict, number>;
    let totalClaims = 0;
    for (const r of rows) {
      for (const c of r.claims) { verdictCounts[c.verdict]++; totalClaims++; }
    }
    return { avg, total: rows.length, totalClaims, verdictCounts };
  }, [rows]);

  const trend = useMemo(() => {
    if (!rows) return [];
    return [...rows].reverse().map((r, i) => ({
      i: i + 1,
      score: r.credibility_score,
      date: format(new Date(r.created_at), "MMM d"),
    }));
  }, [rows]);

  const domainScores = useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, { sum: number; count: number }>();
    for (const r of rows) {
      for (const d of r.domains) {
        const cur = map.get(d) || { sum: 0, count: 0 };
        cur.sum += r.credibility_score;
        cur.count += 1;
        map.set(d, cur);
      }
    }
    return Array.from(map.entries())
      .map(([domain, v]) => ({ domain, avg: Math.round(v.sum / v.count), count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      (r.source_name || "").toLowerCase().includes(q) ||
      r.source_text.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const remove = async (id: string) => {
    const prev = rows;
    setRows((rows || []).filter((r) => r.id !== id));
    if (active?.id === id) setActive(null);
    const { error } = await supabase.from("verifications").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      setRows(prev);
    } else {
      toast.success("Deleted");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (userLoading || !user || rows === null) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="grid h-[60vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const initials = (user.email || "?").slice(0, 2).toUpperCase();
  const memberSince = user.created_at ? format(new Date(user.created_at), "MMMM yyyy") : "—";
  const lastRun = rows[0]?.created_at ? format(new Date(rows[0].created_at), "MMM d, yyyy") : "—";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Profile hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--gradient-orb)" }}
          />
          <div className="relative flex flex-wrap items-center gap-6">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl font-display text-2xl text-primary-foreground shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-orb)" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-widest text-primary">Profile</div>
              <h1 className="mt-1 truncate font-display text-4xl tracking-tight">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "Verifact user"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user.email}</span>
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Joined {memberSince}</span>
                <span className="inline-flex items-center gap-1.5"><HistoryIcon className="h-3.5 w-3.5" />Last scan {lastRun}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="lg" className="shadow-[var(--shadow-elegant)]">
                <Link to="/verify"><Sparkles className="mr-2 h-4 w-4" />New verification</Link>
              </Button>
              <Button variant="outline" size="lg" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />Sign out
              </Button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProfileStat label="Avg credibility" value={`${stats!.avg}`} suffix="/100" tone={scoreColor(stats!.avg)} />
            <ProfileStat label="Verifications" value={`${stats!.total}`} />
            <ProfileStat label="Claims analyzed" value={`${stats!.totalClaims}`} />
            <ProfileStat label="True / False" value={`${stats!.verdictCounts.true} / ${stats!.verdictCounts.false}`} />
          </div>
        </section>

        {rows.length === 0 ? (
          <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-border bg-muted/20 p-16 text-center">
            <div className="max-w-sm">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "var(--gradient-orb)" }}>
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-display text-2xl">No verifications yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Run your first analysis to start building your credibility log.</p>
              <Button asChild className="mt-6">
                <Link to="/verify">Open the editor</Link>
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-10">
            <TabsList className="bg-muted/40">
              <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Overview</TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5"><UserIcon className="h-3.5 w-3.5" />History &amp; data</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-xl">Credibility trend</h2>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                          labelStyle={{ color: "var(--color-muted-foreground)" }}
                        />
                        <ReferenceLine y={stats!.avg} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-primary)" }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  <h2 className="mb-4 font-display text-xl">Verdict mix</h2>
                  <div className="space-y-3">
                    {(Object.keys(verdictMeta) as Verdict[]).map((v) => {
                      const m = verdictMeta[v];
                      const count = stats!.verdictCounts[v];
                      const pct = stats!.totalClaims ? Math.round((count / stats!.totalClaims) * 100) : 0;
                      return (
                        <div key={v}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <m.Icon className="h-3.5 w-3.5" style={{ color: `var(--color-${m.color})` }} />
                              {m.label}
                            </span>
                            <span className="text-muted-foreground">{count} · {pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `var(--color-${m.color})` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-xl">Domain trust</h2>
                </div>
                {domainScores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No domains yet.</p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {domainScores.map((d) => (
                      <li key={d.domain} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{d.domain}</div>
                          <div className="text-xs text-muted-foreground">{d.count} citation{d.count > 1 ? "s" : ""}</div>
                        </div>
                        <div className="text-right text-sm tabular-nums" style={{ color: `var(--color-${scoreColor(d.avg)})` }}>
                          {d.avg}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Account card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  <h2 className="mb-4 font-display text-xl">Account</h2>
                  <dl className="space-y-3 text-sm">
                    <ProfileRow label="Email" value={user.email || "—"} />
                    <ProfileRow label="User ID" value={user.id.slice(0, 8) + "…"} mono />
                    <ProfileRow label="Member since" value={memberSince} />
                    <ProfileRow label="Provider" value={user.app_metadata?.provider || "email"} />
                  </dl>
                  <Button variant="outline" className="mt-5 w-full" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />Sign out
                  </Button>
                </div>

                {/* History */}
                <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] lg:col-span-2">
                  <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                    <h2 className="font-display text-xl">History &amp; data</h2>
                    <div className="relative w-full max-w-xs">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search history…"
                        className="h-9 pl-8"
                      />
                    </div>
                  </div>
                  {filteredRows.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-muted-foreground">No matching verifications.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {filteredRows.map((r) => (
                        <li key={r.id} className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-accent/40">
                          <button onClick={() => setActive(r)} className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                                style={{
                                  color: `var(--color-${scoreColor(r.credibility_score)})`,
                                  background: `color-mix(in oklab, var(--color-${scoreColor(r.credibility_score)}) 12%, transparent)`,
                                }}
                              >
                                {r.credibility_score}
                              </span>
                              <span className="truncate text-sm font-medium">
                                {r.source_name || r.source_text.slice(0, 80)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(new Date(r.created_at), "MMM d, yyyy · h:mm a")}</span>
                              <span>·</span>
                              <span>{r.claims.length} claims</span>
                              {r.domains.length > 0 && (<><span>·</span><span>{r.domains.length} sources</span></>)}
                            </div>
                          </button>
                          <button onClick={() => remove(r.id)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {active && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center" onClick={() => setActive(null)}>
            <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{format(new Date(active.created_at), "PPpp")}</div>
                  <h3 className="mt-1 font-display text-2xl">{active.source_name || "Pasted text"}</h3>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl">{active.credibility_score}<span className="text-lg text-muted-foreground">/100</span></div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{active.summary}</p>
              <div className="mt-4 space-y-2">
                {active.claims.map((c, i) => {
                  const m = verdictMeta[c.verdict];
                  return (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <m.Icon className="h-4 w-4" style={{ color: `var(--color-${m.color})` }} />
                        <span className="text-xs font-semibold uppercase" style={{ color: `var(--color-${m.color})` }}>{m.label}</span>
                      </div>
                      <p className="mt-1.5 text-sm">{c.claim}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{c.reasoning}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <Button variant="ghost" onClick={() => setActive(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileStat({ label, value, suffix, tone }: { label: string; value: string; suffix?: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-5 backdrop-blur">
      <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className="mt-2 font-display text-3xl tracking-tight"
        style={tone ? { color: `var(--color-${tone})` } : undefined}
      >
        {value}{suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ProfileRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={`truncate text-sm ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
