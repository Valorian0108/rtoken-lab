import { z } from "zod";
import type { Timestamp } from "@rtoken-lab/core";

/**
 * MCP Session management
 */
export interface McpSession {
  sessionId: string;
  initializedAt: Timestamp;
  endpoint: string;
}

/**
 * JSON-RPC 2.0 types
 */
export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number().int()]),
  method: z.string(),
  params: z.unknown().optional(),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;

export const JsonRpcResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number().int(), z.null()]),
  result: z.unknown().optional(),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    data: z.unknown().optional(),
  }).optional(),
});

export type JsonRpcResponse = z.infer<typeof JsonRpcResponseSchema>;

/**
 * MCP Protocol methods
 */
export const McpMethod = {
  INITIALIZE: "initialize",
  TOOLS_LIST: "tools/list",
  TOOLS_CALL: "tools/call",
  RESOURCES_LIST: "resources/list",
  RESOURCES_READ: "resources/read",
  PROMPTS_LIST: "prompts/list",
  PROMPTS_GET: "prompts/get",
} as const;

/**
 * Initialize parameters
 */
export const InitializeParamsSchema = z.object({
  protocolVersion: z.string(),
  capabilities: z.object({}).passthrough(),
  clientInfo: z.object({
    name: z.string(),
    version: z.string(),
  }),
});

export type InitializeParams = z.infer<typeof InitializeParamsSchema>;

export const InitializeResultSchema = z.object({
  protocolVersion: z.string(),
  capabilities: z.object({
    logging: z.object({}).optional(),
    prompts: z.object({ listChanged: z.boolean() }).optional(),
    resources: z.object({ subscribe: z.boolean(), listChanged: z.boolean() }).optional(),
    tools: z.object({ listChanged: z.boolean() }).optional(),
  }),
  serverInfo: z.object({
    name: z.string(),
    version: z.string(),
  }),
});

export type InitializeResult = z.infer<typeof InitializeResultSchema>;

/**
 * Tool call parameters
 */
export const ToolCallParamsSchema = z.object({
  name: z.string(),
  arguments: z.record(z.unknown()).optional(),
});

export type ToolCallParams = z.infer<typeof ToolCallParamsSchema>;

/**
 * Guide tool parameters (catalog discovery)
 */
export const GuideParamsSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  keyword: z.string().optional(),
});

export type GuideParams = z.infer<typeof GuideParamsSchema>;

/**
 * Do Query tool parameters (execute catalog entry)
 */
export const DoQueryParamsSchema = z.object({
  entry_id: z.string(),
  params: z.record(z.unknown()).optional(),
});

export type DoQueryParams = z.infer<typeof DoQueryParamsSchema>;

/**
 * Unwrap a Bitget MCP tool result and turn upstream error envelopes into useful errors.
 */
export function unwrapToolResult(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  const envelope = result as {
    structuredContent?: unknown;
    content?: Array<{ text?: unknown }>;
  };
  let payload = envelope.structuredContent;

  if (!payload && typeof envelope.content?.[0]?.text === "string") {
    try {
      payload = JSON.parse(envelope.content[0].text);
    } catch {
      payload = envelope.content[0].text;
    }
  }

  if (!payload || typeof payload !== "object") return payload ?? result;
  const response = payload as { success?: unknown; status_code?: unknown; error?: unknown; data?: unknown };
  if (response.success === false) {
    const detail = typeof response.data === "string"
      ? response.data.replace(/\s+/g, " ").trim().slice(0, 180)
      : typeof response.error === "string"
        ? response.error
        : "The source returned an unsuccessful response.";
    throw new Error(`Bitget MCP source unavailable (upstream ${String(response.status_code ?? "error")}): ${detail}`);
  }
  return payload;
}

/**
 * SSE Event types
 */
export interface SseEvent {
  event: string;
  data: string;
}

export function parseSseEvent(line: string): SseEvent | null {
  if (line.startsWith("event: ")) {
    return { event: line.slice(7), data: "" };
  }
  if (line.startsWith("data: ")) {
    return { event: "message", data: line.slice(6) };
  }
  return null;
}

/**
 * Extract JSON from SSE data field
 */
export function extractJsonFromSse<T>(data: string, schema: z.ZodSchema<T>): T | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed.result?.content?.[0]?.text) {
      const content = JSON.parse(parsed.result.content[0].text);
      return schema.parse(content);
    }
    if (parsed.result) {
      return schema.parse(parsed.result);
    }
    return schema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * HTTP Transport configuration
 */
export interface HttpTransportConfig {
  endpoint: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/**
 * HTTP Transport class for MCP over SSE
 */
export class HttpMcpTransport {
  private _sessionId: string | null = null;
  private initialized = false;
  private initialization: Promise<InitializeResult> | null = null;

  constructor(
    private readonly config: HttpTransportConfig
  ) {}

  get sessionId(): string | null {
    return this._sessionId;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  async initialize(clientInfo = { name: "rtoken-lab", version: "1.0.0" }): Promise<InitializeResult> {
    if (this.initialized && this.initializeResult) return this.initializeResult;
    if (this.initialization) {
      return this.initialization;
    }

    this.initialization = this.initializeSession(clientInfo);
    try {
      return await this.initialization;
    } finally {
      this.initialization = null;
    }
  }

  private initializeResult: InitializeResult | null = null;

  private async initializeSession(clientInfo: { name: string; version: string }): Promise<InitializeResult> {
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: McpMethod.INITIALIZE,
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo,
      },
    };

    const response = await this.post(request);
    const result = InitializeResultSchema.parse(response.result);
    this._sessionId = response.headers?.get("mcp-session-id") ?? null;
    await this.postNotification({ jsonrpc: "2.0", method: "notifications/initialized" });
    this.initializeResult = result;
    this.initialized = true;
    return result;
  }

  async listTools(): Promise<unknown> {
    return this.callTool(McpMethod.TOOLS_LIST, {});
  }

  async callGuide(params: GuideParams): Promise<unknown> {
    return this.callTool(McpMethod.TOOLS_CALL, {
      name: "guide",
      arguments: params,
    });
  }

  async callDoQuery(entryId: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this.callTool(McpMethod.TOOLS_CALL, {
      name: "do_query",
      arguments: { entry_id: entryId, params },
    });
  }

  private async callTool(method: string, params: unknown): Promise<unknown> {
    if (!this.initialized) {
      await this.initialize();
    }

    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    };

    const response = await this.post(request);
    return unwrapToolResult(response.result);
  }

  private async post(request: JsonRpcRequest): Promise<{ result: unknown; headers: Headers }> {
    return this.send(request);
  }

  private async postNotification(notification: { jsonrpc: "2.0"; method: string; params?: unknown }): Promise<void> {
    await this.send(notification);
  }

  private async send(
    payload: JsonRpcRequest | { jsonrpc: "2.0"; method: string; params?: unknown },
  ): Promise<{ result: unknown; headers: Headers }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30000);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        ...this.config.headers,
      };
      if (this._sessionId) headers["Mcp-Session-Id"] = this._sessionId;

      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`MCP HTTP error: ${response.status} ${response.statusText}`);
      }

      if (response.status === 202 || response.status === 204) {
        return { result: undefined, headers: response.headers };
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {
        return this.parseSseResponse(response);
      }

      const json = await response.json();
      return { result: json.result, headers: response.headers };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("MCP request timeout");
      }
      throw error;
    }
  }

  private async parseSseResponse(response: Response): Promise<{ result: unknown; headers: Headers }> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    let result: unknown = null;
    let receivedResult = false;
    let rpcError: { code?: number; message?: string } | null = null;
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.error !== undefined) {
                rpcError = parsed.error;
                receivedResult = true;
              } else if (parsed.result !== undefined) {
                result = parsed.result;
                receivedResult = true;
              }
            } catch {
              // Ignore parse errors for non-JSON data
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!receivedResult) {
      throw new Error("MCP event stream ended without a JSON-RPC result.");
    }
    if (rpcError) {
      throw new Error(`MCP JSON-RPC error ${rpcError.code ?? ""}: ${rpcError.message ?? "Unknown error"}`.trim());
    }
    return { result, headers: response.headers };
  }

  async close(): Promise<void> {
    // No explicit close needed for HTTP transport
    this._sessionId = null;
    this.initialized = false;
    this.initializeResult = null;
    this.initialization = null;
  }
}

/**
 * Create transport with default config
 */
export function createTransport(endpoint = "https://agent.bitget.com/mcp"): HttpMcpTransport {
  return new HttpMcpTransport({ endpoint });
}
