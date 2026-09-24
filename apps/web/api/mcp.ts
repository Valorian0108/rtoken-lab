import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

const MCP_ENDPOINT = "https://agent.bitget.com/mcp";

/**
 * Same-origin MCP proxy for the browser demo.
 * The Bitget MCP endpoint does not expose browser CORS headers, so the deployed
 * app must forward the MCP session through a server-side route.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const sessionId = req.headers["mcp-session-id"];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (typeof sessionId === "string") headers["Mcp-Session-Id"] = sessionId;

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const upstream = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers,
      body: Buffer.concat(chunks),
    });

    res.statusCode = upstream.status;
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    const newSession = upstream.headers.get("mcp-session-id");
    if (newSession) res.setHeader("Mcp-Session-Id", newSession);
    res.setHeader("Cache-Control", "no-cache, no-transform");

    if (!upstream.body) {
      res.end();
      return;
    }
    Readable.fromWeb(upstream.body as import("node:stream/web").ReadableStream).pipe(res);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "MCP upstream failed" }));
  }
}
