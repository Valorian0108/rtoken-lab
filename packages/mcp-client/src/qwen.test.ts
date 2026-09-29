import { afterEach, describe, expect, it, vi } from "vitest";
import { askQwenResearch } from "./qwen";

describe("askQwenResearch", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends evidence-first context to the same-origin server proxy and extracts Responses API text", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "req-test", model: "qwen-test", output_text: "Evidence-limited answer." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await askQwenResearch({
      question: "Compare these inputs",
      symbol: "AAPL",
      context: "DATA STATUS: no live quote snapshot is available.",
    });

    expect(result).toEqual({ text: "Evidence-limited answer.", model: "qwen-test", requestId: "req-test" });
    expect(fetchMock).toHaveBeenCalledWith("/api/qwen", expect.objectContaining({ method: "POST" }));
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.input[0].content).toContain("Use only the supplied context for market-specific numbers.");
    expect(request.input[0].content).toContain("an rToken-only snapshot or chart cannot show the native stock price");
    expect(request.input[0].content).toContain("Never present a bare list of figures, raw ticker fields, calculation dump, or unexplained timestamps.");
    expect(request.input[0].content).toContain("What I observed, What it means, and What remains unknown");
    expect(request.input[0].content).toContain("Do not use em dashes, en dashes, or semicolon chains");
    expect(request.input[0].content).toContain("Hourly candle closes support descriptive explanations for the returned sample only");
    expect(request.input[0].content).toContain("Call a change exactly one hour only when timestamps are one hour apart");
    expect(request.input[0].content).toContain("choose at most two useful, explained figures from the candle summary");
    expect(request.input[0].content).toContain("What I observed, What it means, and What remains unknown");
    expect(request.input[1].content).toContain("DATA STATUS: no live quote snapshot is available.");
  });

  it("falls back to Experiential Labs when Bitget Qwen fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("Bitget unavailable", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          id: "exp-req",
          model: "mimo-v2.6-pro",
          choices: [{ message: { content: "Fallback answer." } }],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await expect(askQwenResearch({ question: "Explain the gap" })).resolves.toEqual({
      text: "Fallback answer.",
      model: "mimo-v2.6-pro",
      requestId: "exp-req",
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/qwen", "/api/experiential"]);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(fetchMock.mock.calls[1]?.[1]?.body);
  });

  it("streams only text deltas and resolves after the provider signals completion", async () => {
    const events = [
      'data: {"id":"stream-1","model":"qwen-stream","type":"response.output_text.delta","delta":"Evidence "}\n\n',
      'data: {"type":"response.output_text.delta","delta":"is limited."}\n\n',
      'data: {"type":"response.completed","response":{"id":"stream-1","model":"qwen-stream","status":"completed"}}\n\n',
    ].join("");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(events, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    }));
    const deltas: string[] = [];

    await expect(askQwenResearch({ question: "Explain the limits" }, { onDelta: (delta) => deltas.push(delta) })).resolves.toEqual({
      text: "Evidence is limited.",
      model: "qwen-stream",
      requestId: "stream-1",
    });
    expect(deltas).toEqual(["Evidence ", "is limited."]);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).stream).toBe(true);
  });

  it("reads Experiential Labs chat-completion chunks from the fallback stream", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("primary unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response([
        'data: {"id":"mimo-stream","model":"mimo-v2.6-pro","choices":[{"delta":{"content":"Plain language "},"finish_reason":null}]}',
        'data: {"id":"mimo-stream","model":"mimo-v2.6-pro","choices":[{"delta":{"content":"fallback."},"finish_reason":null}]}',
        'data: {"id":"mimo-stream","model":"mimo-v2.6-pro","choices":[{"delta":{},"finish_reason":"stop"}]}',
        "data: [DONE]",
        "",
      ].join("\n\n"), { status: 200, headers: { "Content-Type": "text/event-stream" } }));
    const deltas: string[] = [];

    await expect(askQwenResearch({ question: "Explain simply" }, { onDelta: (delta) => deltas.push(delta) })).resolves.toEqual({
      text: "Plain language fallback.",
      model: "mimo-v2.6-pro",
      requestId: "mimo-stream",
    });
    expect(deltas).toEqual(["Plain language ", "fallback."]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a stream that ends without a completion signal", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response('data: {"type":"response.output_text.delta","delta":"Partial"}\n\n', {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }))
      .mockResolvedValueOnce(new Response("fallback not configured", { status: 503 }));

    await expect(askQwenResearch({ question: "Can this be partial?" })).rejects.toThrow("stream ended before completion");
  });

  it("does not start the fallback provider after cancellation", async () => {
    const controller = new AbortController();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        controller.abort();
      });
    });

    await expect(askQwenResearch({ question: "Cancel this" }, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports both failures when the primary and fallback providers are unavailable", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("not configured", { status: 503 }))
      .mockResolvedValueOnce(new Response("fallback not configured", { status: 503 }));

    await expect(askQwenResearch({ question: "Explain the gap" })).rejects.toThrow(
      "AI explanation unavailable (Bitget Qwen: proxy failed (503): not configured; Experiential Labs: proxy failed (503): fallback not configured)",
    );
  });

  it("rejects a truncated Responses API result instead of showing partial output", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ).mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: "" } }] }), { status: 200 }));

    await expect(askQwenResearch({ question: "What evidence is required?" })).rejects.toThrow(
      "AI explanation unavailable (Bitget Qwen: response was incomplete (max_output_tokens); Experiential Labs: returned an empty response)",
    );
  });
});
