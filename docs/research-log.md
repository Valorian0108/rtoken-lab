# rToken Lab — Research Log

## Phase 0: Data Source Research (2026-09-24) — COMPLETE

### Objective
Verify available data sources for rToken mechanics visualization before committing to implementation.

### Results — MCP Discovery Complete

**Server**: `https://agent.bitget.com/mcp` (HTTP transport, MCP over SSE)
**Auth**: None required
**Tools**: `guide` (catalog), `do_query` (execute entry)

### Catalog Categories Discovered

| Category | Entries | Purpose |
|----------|---------|---------|
| `equity` (美股) | 22 | Native US stock data — quotes, history, fundamentals, ownership, estimates |
| `crypto` | 39 | rToken perpetuals (Binance), rToken spot (Bitget), on-chain, institutional, technical |
| `etf` | 3 | ETF data |
| `news` | 1 | Financial news search |
| `sentiment` | 2 | Market sentiment indices |

### Critical Findings for rToken Lab

#### rToken Data Availability ✅
| Data Type | Source | Symbol Format | Status |
|-----------|--------|---------------|--------|
| Native real-time quote | `equity_price_quote` | `AAPL`, `NVDA` | Works |
| Native historical | `equity_price_historical` | `AAPL`, `start_time`, `end_time` | 204 (needs param tuning) |
| rToken perpetual real-time | `crypto_futures_ticker` | `AAPL/USDT` on `binance` | Should work |
| rToken perpetual history | `crypto_futures_kline` | `AAPL/USDT` on `binance` | Best for 7×24 heatmap |
| rToken spot real-time | `crypto_spot_ticker` | `RAAPL/USDT` on `bitget` | Works |
| rToken spot history | `crypto_spot_kline` | `RAAPL/USDT` on `bitget` | 204 (new markets) |
| rToken funding rate | `crypto_futures_funding_rate` | `AAPL/USDT` on `binance` | For funding surface |
| Symbol discovery | `crypto_market` | `is_rwa: true` | Works (500 tokens) |

#### Symbol Mapping (395 perpetuals, 101 spot)
```
Native:     AAPL, NVDA, TSLA, ...
Perpetual:  AAPL/USDT, NVDA/USDT, TSLA/USDT  (Binance)
Spot:       RAAPL/USDT, RNVDA/USDT, RTSLA/USDT  (Bitget, base: rAAPL/rNVDA/rTSLA)
```

#### Data Gaps (Acceptable)
- ❌ Explicit NAV data — will calculate premium as (rToken - Native) / Native
- ❌ Mint/redeem events — not in catalog, will use mechanism diagrams
- ❌ Spot historical depth — use perpetuals for heatmap/backtest

### Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-24 | Use perpetual klines for historical/heatmap | More history, 7×24 data |
| 2026-09-24 | Use spot ticker for live premium | Real-time, on Bitget |
| 2026-09-24 | Calculate premium vs native equity quote | No NAV endpoint available |
| 2026-09-24 | Mechanism diagrams for mint/redeem | No event data in catalog |
| 2026-09-24 | Proceed to Phase 1 scaffolding | Data architecture resolved |

---

## Phase 1: Monorepo Foundation — NEXT

Ready to begin scaffolding with accurate schema knowledge.