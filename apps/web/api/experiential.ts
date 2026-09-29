import type { IncomingMessage, ServerResponse } from "node:http";

const EXPERIENTIAL_BASE_URL = process.env.EXPLABS_BASE_URL ?? "https://api.experientiallabs.ai/v1";
const EXPERIENTIAL_MODEL = "mimo-v2.6-pro";

interface ExperientialConfig {
  apiKey?: string;
  baseUrl?: string;
}

/** Server-side Experiential Labs fallback. The gateway key never enters the browser. */
export function createExperientialHandler(config: ExperientialConfig = {}) {
  const baseUrl = config.baseUrl ?? EXPERIENTIAL_BASE_URL;
  const apiKey = config.apiKey ?? process.env.EXPLABS_API_KEY;

  return async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  if (!apiKey) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Experiential Labs fallback is not configured on the server." }));
    return;
  }

  const controller = new AbortController();
  const abortOnDisconnect = () => {
    if (!res.writableEnded) controller.abort();
  };
  res.once("close", abortOnDisconnect);

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
    const messages = Array.isArray(body.input)
      ? body.input
          .filter((item: { role?: unknown; content?: unknown }) =>
            (item.role === "system" || item.role === "user" || item.role === "assistant") && typeof item.content === "string",
          )
          .map((item: { role: string; content: string }) => ({ role: item.role, content: item.content }))
      : [];
    if (messages.length === 0) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "A research prompt is required." }));
      return;
    }

    // Use a minimal Chat Completions request; omit sampling and token-limit
    // parameters for compatibility across Experiential Labs model deployments.
    const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: EXPERIENTIAL_MODEL, messages, stream: true }),
      signal: controller.signal,
    });

    res.statusCode = upstream.status;
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    if (!upstream.body) {
      res.end();
      return;
    }
    const reader = upstream.body.getReader();
    try {
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!res.write(Buffer.from(value))) {
          await new Promise<void>((resolve, reject) => {
            const onDrain = () => { cleanup(); resolve(); };
            const onClose = () => { cleanup(); reject(new DOMException("Client disconnected.", "AbortError")); };
            const cleanup = () => { res.off("drain", onDrain); res.off("close", onClose); };
            res.once("drain", onDrain);
            res.once("close", onClose);
          });
        }
      }
    } finally {
      reader.releaseLock();
    }
    if (!res.writableEnded) res.end();
  } catch (error) {
    if (controller.signal.aborted) return;
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Experiential Labs request failed" }));
  } finally {
    res.off("close", abortOnDisconnect);
  }
  };
}

export default createExperientialHandler();
