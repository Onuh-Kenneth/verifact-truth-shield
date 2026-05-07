// Verifact - claim extraction & verification via Lovable AI

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Verdict = "true" | "false" | "misleading" | "unverified";
interface Claim {
  claim: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  evidence: { title: string; url: string; snippet: string }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.length < 10) {
      return new Response(JSON.stringify({ error: "Provide text (min 10 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 12000) {
      return new Response(JSON.stringify({ error: "Text too long (max 12000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are Verifact, an expert fact-checking AI.
Your job: extract specific, verifiable factual claims from the user's text (ignore opinions, questions, or subjective statements), then assess each claim.

For each claim, assign one of these verdicts:
- "true": well-established by reliable sources
- "false": contradicted by factual data
- "misleading": partially true but lacks crucial context
- "unverified": insufficient public evidence to assess

Be conservative. When in doubt, mark "unverified". Provide concise reasoning (1-2 sentences) and 1-3 plausible evidence items (use real, well-known reputable source domains like reuters.com, apnews.com, nature.com, who.int, nasa.gov, britannica.com — do NOT fabricate exact URLs to specific articles you haven't verified; cite the domain root or a likely topic page). Limit to the 8 most important claims.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this text:\n\n${text}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_claims",
            description: "Return structured fact-check results",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "1-2 sentence overall assessment" },
                credibility_score: { type: "number", description: "Overall credibility 0-100" },
                claims: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      claim: { type: "string" },
                      verdict: { type: "string", enum: ["true", "false", "misleading", "unverified"] },
                      confidence: { type: "number" },
                      reasoning: { type: "string" },
                      evidence: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            url: { type: "string" },
                            snippet: { type: "string" },
                          },
                          required: ["title", "url", "snippet"],
                        },
                      },
                    },
                    required: ["claim", "verdict", "confidence", "reasoning", "evidence"],
                  },
                },
              },
              required: ["summary", "credibility_score", "claims"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_claims" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-claims error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
