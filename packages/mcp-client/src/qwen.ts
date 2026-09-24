export interface QwenResearchInput {
  question: string;
  symbol?: string;
  context?: string;
}

export interface QwenResearchResult {
  text: string;
  model: string;
  requestId?: string;
}

interface QwenResponse {
  id?: string;
  model?: string;
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
  choices?: Array<{ message?: { content?: string } }>;
}

const QWEN_MODEL = "qwen3.8-max";
const QWEN_ENDPOINT = "/api/qwen";

/**
 * Calls the server-side Qwen proxy. The API key never enters the browser.
 * The research prompt is intentionally evidence-first: the model must label
 * inference and must not invent unavailable values.
 */
export async function askQwenResearch(input: QwenResearchInput): Promise<QwenResearchResult> {
  const system = [
    "You are the research assistant inside rToken Lab, an educational market research workbench.",
    "You do not place trades, execute orders, or present investment advice.",
    "Use only the supplied context for market-specific numbers. If a value is not supplied, say it is unavailable.",
    "Separate observed data, calculation, interpretation, and uncertainty.",
    "Explain tokenized-stock mechanics in plain language for a beginner.",
    "Return concise markdown suitable for a narrow research panel.",
  ].join(" ");

  const response = await fetch(QWEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: QWEN_MODEL,
      input: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            `Question: ${input.question}`,
            input.symbol ? `Instrument: ${input.symbol}` : "",
            input.context ? `Verified context:\n${input.context}` : "No verified market context is available yet.",
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
      temperature: 0.2,
      max_output_tokens: 700,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Qwen proxy failed (${response.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }

  const payload = (await response.json()) as QwenResponse;
  const text =
    payload.output_text ??
    payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("") ??
    payload.choices?.[0]?.message?.content ??
    "";

  if (!text) throw new Error("Qwen returned an empty response");

  return { text, model: payload.model ?? QWEN_MODEL, requestId: payload.id };
}
