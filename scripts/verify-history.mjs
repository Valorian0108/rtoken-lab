const endpoint = "https://agent.bitget.com/mcp";

async function call(entryId, params) {
  const initResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "rtoken-lab-history-check", version: "1.0.0" },
      },
    }),
  });

  const sessionId = initResponse.headers.get("mcp-session-id");
  if (!sessionId) throw new Error("MCP did not return a session id");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "Mcp-Session-Id": sessionId,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "do_query",
        arguments: { entry_id: entryId, params },
      },
    }),
  });

  const text = await response.text();
  const dataLine = text.split("\n").find((line) => line.startsWith("data: "));
  if (!dataLine) return { status: response.status, raw: text };

  const envelope = JSON.parse(dataLine.slice(6));
  const content = envelope.result?.content?.[0]?.text;
  try {
    return { status: response.status, data: JSON.parse(content) };
  } catch {
    return { status: response.status, data: content };
  }
}

const end = Math.floor(Date.now() / 1000);
const start = end - 7 * 24 * 60 * 60;

try {
  console.log("Checking Bitget MCP historical data...\n");

  const equity = await call("equity_price_historical", {
    symbol: "AAPL",
    start_time: start,
    end_time: end,
  });

  const perpetual = await call("crypto_futures_kline", {
    symbol: "AAPL/USDT",
    exchange: "binance",
    start_time: start,
    end_time: end,
    interval: "1h",
    limit: 200,
  });

  console.log(JSON.stringify({ equity, perpetual }, null, 2));
} catch (error) {
  console.error("Historical verification failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
