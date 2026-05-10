import { createFileRoute } from "@tanstack/react-router";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

// Public SVG badge endpoint: /api/badge/:slug.svg
export const ServerRoute = createServerFileRoute("/api/badge/$slug").methods({
  GET: async ({ params }) => {
    const slug = String(params.slug || "").replace(/\.svg$/i, "");
    const url = process.env.VITE_SUPABASE_URL || "https://xxaghjkwzgpdofsweegq.supabase.co";
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YWdoamt3emdwZG9mc3dlZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDkzOTQsImV4cCI6MjA5MzY4NTM5NH0.wmyDXFtJ4kSbjoOnqKiEW90XtecivBA6AZecxknOC5w";
    const sb = createClient(url, key);
    const { data } = await sb
      .from("verifications")
      .select("credibility_score")
      .eq("share_slug", slug)
      .eq("is_public", true)
      .maybeSingle();
    const score = data?.credibility_score ?? null;
    const color = score == null ? "#888" : score >= 70 ? "#28a05a" : score >= 40 ? "#c89628" : "#c83232";
    const label = score == null ? "Unverified" : `${score}/100`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="32" viewBox="0 0 170 32">
  <rect width="170" height="32" rx="6" fill="#14202c"/>
  <rect x="80" width="90" height="32" rx="6" fill="${color}"/>
  <rect x="80" width="6" height="32" fill="${color}"/>
  <g fill="#fff" font-family="-apple-system,Segoe UI,sans-serif" font-size="12" font-weight="600">
    <text x="12" y="20">✓ Verifact</text>
    <text x="92" y="20">${label}</text>
  </g>
</svg>`;
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
});

// Empty page route — required to register file
export const Route = createFileRoute("/api/badge/$slug")({
  component: () => null,
});
