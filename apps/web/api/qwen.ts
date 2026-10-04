import type { IncomingMessage, ServerResponse } from "node:http";
import {
  AI_MAX_OUTPUT_TOKENS,
  checkAiRateLimit,
  normalizeTextMessages,
  readJsonBody,
  RequestGuardError,
  sendJsonError,
} from "./request-guards";

const QWEN_BASE_URL = process.env.BITGET_QWEN_BASE_URL ?? process.env.QWEN_BASE_URL ?? "https://hackathon.bitgetops.com/v1";
const QWEN_MODEL = process.env.BITGET_QWEN_MODEL ?? process.env.QWEN_MODEL ?? "qwen3.8-max";

interface QwenConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

/** Server-only Qwen proxy. The API key is never returned to the browser. */
export function createQwenHandler(config: QwenConfig = {}) {
  const baseUrl = config.baseUrl ?? QWEN_BASE_URL;
  const model = config.model ?? QWEN_MODEL;
  const apiKey = config.apiKey ?? process.env.BITGET_QWEN_API_KEY ?? process.env.QWEN_API_KEY;
  const timeoutMs = config.timeoutMs ?? 45_000;

  return async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Allow", "POST");
      res.end("Method Not Allowed");
      return;
    }

    if (!apiKey) {
      sendJsonError(res, 503, "Qwen is not configured on the server.");
      return;
    }

    const rateLimit = checkAiRateLimit(req);
    if (!rateLimit.allowed) {
      res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
      sendJsonError(res, 429, "Research request limit reached. Try again shortly.");
      return;
    }

    const controller = new AbortController();
    let disconnected = false;
    let timedOut = false;
    const abortOnDisconnect = () => {
      if (!res.writableEnded) {
        disconnected = true;
        controller.abort();
      }
    };
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    res.once("close", abortOnDisconnect);

    try {
      const rawBody = await readJsonBody(req, undefined, controller.signal);
      if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
        throw new RequestGuardError("A research request object is required.", 400);
      }
      const body = rawBody as Record<string, unknown>;
      const messages = normalizeTextMessages(body.input);
      const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: messages,
          temperature: 0.2,
          max_output_tokens: AI_MAX_OUTPUT_TOKENS,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!upstream.ok) {
        await upstream.body?.cancel().catch(() => undefined);
        sendJsonError(res, 502, "Qwen research provider is unavailable.");
        return;
      }

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
      if (!res.writableEnded && !disconnected) res.end();
    } catch (error) {
      if (disconnected || res.writableEnded) return;
      if (error instanceof RequestGuardError) {
        sendJsonError(res, error.statusCode, error.message);
      } else if (res.headersSent) {
        res.end();
      } else if (timedOut) {
        sendJsonError(res, 504, "Qwen request timed out. Try again shortly.");
      } else {
        sendJsonError(res, 502, "Qwen request failed.");
      }
    } finally {
      clearTimeout(timeout);
      res.off("close", abortOnDisconnect);
    }
  };
}

export default createQwenHandler();
