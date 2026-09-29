import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpMcpTransport, unwrapToolResult } from "./index";

const initializePayload = {
  jsonrpc: "2.0",
  id: 1,
  result: {
    protocolVersion: "2024-11-05",
    capabilities: { logging: {}, tools: { listChanged: true } },
    serverInfo: { name: "bitget-mcp-server", version: "4.0.5" },
  },
};

function sseResponse(payload: unknown, sessionId?: string, status = 200): Response {
  const headers = new Headers({ "Content-Type": "text/event-stream" });
  if (sessionId) headers.set("Mcp-Session-Id", sessionId);
  return new Response(`event: message\ndata: ${JSON.stringify(payload)}\n\n`, { status, headers });
}

describe("HttpMcpTransport MCP session lifecycle", () => {
  afterEach(() => vi.restoreAllMocks());

  it("omits the session header on initialize and confirms the initialized session", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(sseResponse(initializePayload, "session-123"))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    const transport = new HttpMcpTransport({ endpoint: "/api/mcp" });

    await transport.initialize();

    const firstHeaders = new Headers(fetchMock.mock.calls[0][1]?.headers);
    const notificationRequest = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    const notificationHeaders = new Headers(fetchMock.mock.calls[1][1]?.headers);

    expect(firstHeaders.has("Mcp-Session-Id")).toBe(false);
    expect(notificationRequest).toEqual({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(notificationHeaders.get("Mcp-Session-Id")).toBe("session-123");
    expect(transport.sessionId).toBe("session-123");
    expect(transport.isInitialized).toBe(true);
  });

  it("shares one in-flight initialization across concurrent callers", async () => {
    let resolveInitialize!: (response: Response) => void;
    const initializeResponse = new Promise<Response>((resolve) => {
      resolveInitialize = resolve;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockReturnValueOnce(initializeResponse)
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    const transport = new HttpMcpTransport({ endpoint: "/api/mcp" });

    const first = transport.initialize();
    const second = transport.initialize();
    resolveInitialize(sseResponse(initializePayload, "session-456"));

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats an accepted 202 notification as a completed handshake step", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(sseResponse(initializePayload, "session-789"))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    const transport = new HttpMcpTransport({ endpoint: "/api/mcp" });

    await expect(transport.initialize()).resolves.toMatchObject({ serverInfo: { name: "bitget-mcp-server" } });
    expect(transport.isInitialized).toBe(true);
  });

  it("unwraps structured MCP tool results and reports upstream errors clearly", () => {
    expect(unwrapToolResult({
      content: [{ text: "{\"success\":true,\"data\":{\"last\":12}}" }],
      structuredContent: { success: true, data: { last: 12 } },
    })).toEqual({ success: true, data: { last: 12 } });
    expect(() => unwrapToolResult({
      structuredContent: { success: false, status_code: 503, data: "upstream down", error: null },
    })).toThrow("upstream 503): upstream down");
  });

});
