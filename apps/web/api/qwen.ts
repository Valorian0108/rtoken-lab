import type { IncomingMessage, ServerResponse } from "node:http";

const QWEN_BASE_URL = process.env.QWEN_BASE_URL ?? "https://hackathon.bitgetops.com/v1";
const QWEN_MODEL = process.env.QWEN_MODEL ?? "qwen3.8-max";

/** Server-only Qwen proxy. The API key is never returned to the browser. */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Qwen is not configured on the server." }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
    const upstream = await fetch(`${QWEN_BASE_URL.replace(/\/$/, "")}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...body, model: body.model ?? QWEN_MODEL }),
    });

    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    res.end(text);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Qwen request failed" }));
  }
}
