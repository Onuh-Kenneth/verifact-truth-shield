// Source reputation layer — weight evidence domains by how authoritative they are.
// Tiers (0-100):
//   100 → peer-reviewed / primary scientific & government
//    85 → wire services & top-tier reference
//    70 → established mainstream news
//    55 → trade press, specialist outlets
//    40 → general blogs / aggregators / unknown
//    20 → known low-quality / partisan / tabloid

export type ReputationTier = "primary" | "wire" | "mainstream" | "specialist" | "general" | "low";

export interface DomainReputation {
  tier: ReputationTier;
  score: number;
  label: string;
}

const TIER_META: Record<ReputationTier, { score: number; label: string }> = {
  primary:    { score: 100, label: "Peer-reviewed / Primary" },
  wire:       { score: 85,  label: "Wire / Reference" },
  mainstream: { score: 70,  label: "Mainstream News" },
  specialist: { score: 55,  label: "Specialist" },
  general:    { score: 40,  label: "General Web" },
  low:        { score: 20,  label: "Low Quality" },
};

// Curated list. Match against the registrable suffix of the hostname.
const RULES: Array<[ReputationTier, RegExp]> = [
  ["primary", /\.(gov|edu|mil|int)$/i],
  ["primary", /^(nature|science|cell|nejm|thelancet|pnas|sciencedirect|springer|wiley|oup|tandfonline|jamanetwork|bmj|elifesciences|plos|frontiersin|arxiv|biorxiv|medrxiv|pubmed|ncbi\.nlm\.nih|cochrane|nasa|noaa|cdc|nih|who|un|worldbank|imf|oecd|esa|ipcc|cern|nist|usgs|epa|fda)\.(org|com|net|gov|int)$/i],
  ["wire",    /^(reuters|apnews|afp|bloomberg|britannica|encyclopedia|merriam-webster|snopes|politifact|factcheck|fullfact)\.(com|org|net)$/i],
  ["mainstream", /^(bbc|nytimes|washingtonpost|wsj|ft|economist|theguardian|npr|cnn|nbcnews|cbsnews|abcnews|aljazeera|dw|france24|theatlantic|newyorker|time|forbes|spiegel|lemonde|telegraph|independent|smh|abc\.net|cbc|globeandmail)\.(com|co\.uk|de|fr|au|ca|net|org)$/i],
  ["specialist", /^(scientificamerican|newscientist|technologyreview|wired|arstechnica|theverge|nationalgeographic|smithsonianmag|history|space|sciencealert|livescience|phys|eurekalert)\.(com|org|net)$/i],
  ["low", /^(infowars|naturalnews|breitbart|dailymail|thesun|nypost|rt|sputnik|zerohedge|gatewaypundit)\.(com|co\.uk|ru)$/i],
];

export function reputationFor(domain: string): DomainReputation {
  const d = domain.toLowerCase().replace(/^www\./, "");
  for (const [tier, pattern] of RULES) {
    if (pattern.test(d)) return { tier, ...TIER_META[tier] };
  }
  return { tier: "general", ...TIER_META.general };
}

export function reputationForUrl(url: string): DomainReputation | null {
  try {
    return reputationFor(new URL(url).hostname);
  } catch {
    return null;
  }
}

/**
 * Weight a verifact credibility_score by the average reputation of cited
 * evidence. Heavier weight on stronger sources nudges the index up,
 * weaker sources nudge it down — capped within ±15 points.
 */
export function weightedCredibility(rawScore: number, evidenceUrls: string[]): {
  weighted: number;
  avgReputation: number;
  delta: number;
  topTier: ReputationTier;
} {
  const reps = evidenceUrls
    .map((u) => reputationForUrl(u))
    .filter((r): r is DomainReputation => !!r);
  if (reps.length === 0) {
    return { weighted: rawScore, avgReputation: 40, delta: 0, topTier: "general" };
  }
  const avg = reps.reduce((s, r) => s + r.score, 0) / reps.length;
  // Map avg (20..100) to delta (-15..+15) centered at 60
  const delta = Math.max(-15, Math.min(15, Math.round((avg - 60) * 0.3)));
  const weighted = Math.max(0, Math.min(100, rawScore + delta));
  const topTier = reps.reduce((best, r) => (r.score > TIER_META[best].score ? r.tier : best), "general" as ReputationTier);
  return { weighted, avgReputation: Math.round(avg), delta, topTier };
}
