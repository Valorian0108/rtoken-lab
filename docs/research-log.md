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

## Runtime validation update (2026-09-25)

- Corrected the Vite `/api/mcp` proxy path to forward to `https://agent.bitget.com/mcp`.
- Corrected MCP session setup: omit `Mcp-Session-Id` during the initial handshake, retain the returned session ID, serialize concurrent initialization, and send `notifications/initialized` before tool requests.
- Verified the browser app initializes MCP and successfully reaches `tools/call` through the local proxy. The browser-proxy and direct HTTPS probes both received successful MCP HTTP/SSE responses.
- Current source calls for native equity quote/history, rToken spot ticker/history, and rToken perpetual ticker returned MCP tool envelopes with `success: false`, `status_code: 503` and an upstream `503 Service Temporarily Unavailable` HTML response. MCP transport availability must not be represented as market-data availability.
- The app therefore correctly remains in `SOURCE UNAVAILABLE` / illustrative-history mode; no live gap or observed historical series was verified in this run.
- Qwen runtime access, visual review at target breakpoints, user testing, and deployment remain unverified/not performed.

## Runtime validation update (2026-09-26)

- Retried the Bitget MCP check from the current environment. Direct HTTPS access failed at DNS resolution (`ENOTFOUND agent.bitget.com`); the browser's direct cross-origin request failed before returning an HTTP response.
- The app's same-origin `/api/mcp` request returned HTTP 500 with an empty response body. The local Vite proxy returned HTTP 502. No MCP `initialize` response or session ID was received, so a fresh `tools/list` and current quote/history calls could not be made.
- These failures identify a current environment/proxy reachability problem, not a fresh Bitget upstream response. They do not invalidate or replace the 2026-09-25 recorded MCP tool envelopes with `success: false`, `status_code: 503`; those remain the latest confirmed upstream data responses available in this log.
- Request tested: MCP `initialize`, protocol version `2024-11-05`, empty capabilities, validation client info; no credentials were sent. The application’s existing catalog call mapping remains `tools/call` → `do_query` with `{ entry_id, params }`, but the current endpoint schemas were not re-enumerated in this run.
- The user confirmed the submission deadline is extended to October 8, 2026 (UTC+8); this is recorded as user-confirmed, not independently checked against the portal.
- The S2 handbook provided in the project conversation describes `bitget-mcp-server` as read-only US stock/ETF quotes, history, and fundamentals. The repository client also assumes crypto/RWA query entries (`crypto_market`, `crypto_spot_ticker`, `crypto_futures_kline`, funding, etc.). Because today's live catalog could not be retrieved, whether those crypto entries remain available on the current S2 MCP endpoint is unconfirmed; do not treat the legacy client mapping as an S2-supported interface until `tools/list`/catalog discovery succeeds.

## S2 scope alignment (2026-09-26)

- Disabled the web app's paired rToken quote and historical-series requests until the current S2 MCP catalog/schema is verified. The MCP transport/client code remains available for later inspection; no unverified crypto/RWA call is made by the demo.
- Removed the Spot/Perpetual switch from the demo surface while no rToken-side instrument source is verified. The header now reports `S2 DATA SCOPE UNVERIFIED`; the evidence panel identifies the handbook's documented US-equity/ETF scope and explicitly says no live gap is calculated.
- Research prompts now state that the chart is synthetic interface content and that legacy rToken/crypto MCP support is unconfirmed. Suggested questions focus on evidence requirements and instrument distinctions rather than asking for a current gap.
- Checks: `pnpm --filter @rtoken-lab/web typecheck`, `pnpm --filter @rtoken-lab/web build`, and `pnpm test` passed. Browser smoke check on the existing app tab showed the unavailable-source labels and no horizontal overflow at 828px; this is not a full responsive/accessibility review.
- Research Desk question tested: “What evidence would be required to calculate an rToken premium against AAPL right now?” The first Qwen response returned HTTP 200 but was incomplete (`max_output_tokens`); the client previously accepted it and the panel used its evidence-only fallback. Tightened the prompt to request a <=120-word answer with Evidence / Calculation / Limits headings, raised the output budget to 1,600 tokens, and made incomplete Responses API results fail to the safe fallback instead of displaying partial output.
- Retest returned HTTP 200 and a complete response: no current premium was calculated; it requested an AAPL reference, a specific rToken/perpetual quote, timestamps, currency context, and relevant instrument/contract details; it stated that the comparison is not NAV or guaranteed arbitrage. No current market prices were provided or claimed. Qwen may still make general methodological statements, which should be checked against verified instrument terms before treating them as facts about a particular rToken.
- Qwen checks: `pnpm --filter @rtoken-lab/mcp-client test` passed (7 tests), including a new incomplete-response rejection case; web typecheck passed after the client change.

## Public Bitget REST fallback investigation (2026-09-26)

- Searched Bitget's official API documentation for a data path outside the currently unreachable MCP server. The official Reality Trading guide says Reality instruments expose `isReality` and that tickers/candlesticks reuse public market-data endpoints; `RMUUSDT` is shown as an example Reality symbol. The Reality market-data catalog lists public `GET /api/v3/reality/market/stock-info`. The general market-data catalog contains instruments/tickers/candlestick endpoint families. These findings establish a documented candidate path, not an observed quote or proof the candidate rToken is currently listed.
- The official Stock+ overview says Stock Level 1 market data is whitelist-only. The native-stock side therefore cannot be assumed accessible for this demo without an authorized source (possibly the S2 MCP if its documented equity quote tool is reachable).
- Runtime probe of `https://api.bitget.com/api/v3/market/instruments?category=SPOT` failed at DNS resolution (`api.bitget.com` could not be resolved); documentation pages also failed to load directly. Search-indexed official documentation was available, but no HTTP market-data response was obtained. No rToken or native quote, timestamps, paired snapshot, or premium were verified.
- Decision: do not wire an unverified direct REST feed or use a third-party quote. Keep paired comparison/history unavailable and the chart illustrative. The fallback remains the evidence-requirements research task unless a later run can validate both Bitget rToken and native-stock legs with source, symbol/instrument identity, quote currency, market timestamp, retrieval time, and response provenance.

## User-network Bitget connectivity and rToken ticker probe (2026-09-26)

- The user resolved `api.bitget.com` through their configured DNS after a prior timeout. Their configured DNS servers had timed out for this hostname, while an explicit query to Cloudflare DNS (`1.1.1.1`) returned A records `104.18.15.166` and `104.18.14.166`. A HTTPS request pinned to one of those addresses returned Cloudflare HTTP 404 at the API root, confirming HTTPS reachability but not market-data availability. Subsequently, the user's default `Resolve-DnsName api.bitget.com` returned the same A records, and the public instruments endpoint returned a long JSON response. DNS appears to be resolving now on the user's PC; the OpenCode workspace may still have independent DNS/network restrictions.
- User-provided output from `GET https://api.bitget.com/api/v3/market/instruments?category=SPOT` identified `RAAPLUSDT`: category `SPOT`, base `rAAPL`, quote `USDT`, type `stock`, `status: online`, `isReality: yes`, `pricePrecision: 2`, and `launchTime: 1780322400000`. This confirms a currently listed Reality instrument in the user's API response; it is user-run output, not a response independently fetched by the workspace.
- User-provided output from `GET https://api.bitget.com/api/v3/market/tickers?category=SPOT&symbol=RAAPLUSDT` returned `code: 00000`, `requestTime: 1790429056879`, and instrument `ts: 1790429055417`; `lastPrice: 340.01`, `bid1Price: 340.1`, `ask1Price: 341.5`, `bid1Size: 0.9828`, `ask1Size: 0.2743`, `volume24h: 21565980.7355`, `turnover24h: 7342910591.8917`, and `platformTurnover24h: 19951.9208`. A second user-run call about 20 seconds later returned the same prices/volumes with advancing request/ticker timestamps. Preserve these as an observed Bitget rToken ticker snapshot with source and raw payload fields; do not call it a paired premium or treat it as independently verified by this app/workspace.
- Data-quality caution: the reported best bid (340.1) was above last price (340.01), and ask (341.5) was 1.4 USDT above bid (about 0.41% of midpoint); reported turnover fields also differ greatly in scale and require schema/unit interpretation. Do not silently substitute last, midpoint, or another value as a trusted comparison price until field semantics, market freshness, executable quote quality, and activity are checked. The near-identical subsequent response is not independent market validation.
- The official Stock+ quote path surfaced by Bitget docs/search is `GET /api/v3/stockplus/market/quote`; official docs say Stock Level 1 data is whitelist-only, and the SDK marks the quote request as private. No native AAPL quote has been obtained. Next data check is an authorized native-stock quote via the S2 MCP (if restored) or a whitelisted Bitget Stock+ credential held locally by the user; never request or log their API secret. Until a timestamp-aligned native quote is independently established, keep premium comparison disabled.

## RAAPL-only snapshot implementation (2026-09-26)

- Implemented a read-only, fixed-symbol Bitget public ticker route for `RAAPLUSDT` only (`GET /api/v3/market/tickers?category=SPOT&symbol=RAAPLUSDT`). No account credentials or trading APIs are used. Added same-origin Vite proxy for local development and server API route for deployment.
- Replaced the app's AAPL selection/search branding with a fixed `RAAPL / USDT` market identity; header reports Bitget snapshot state. The canvas shows one-sided last/bid/ask/size, Bitget ticker timestamp, retrieval time, spread, a link to Bitget Reality docs, and quote-quality warning(s). It explicitly says this is not an AAPL comparison and computes no premium. The generated mechanics chart remains a separate synthetic illustration.
- Snapshot parser requires successful Bitget response, exact `RAAPLUSDT` symbol, valid positive prices and nonnegative sizes/timestamp, and a ticker no more than two minutes old (rejects substantially future timestamps). App refreshes every 30 seconds and removes the displayed snapshot when it expires or a refresh fails; no stale fallback/cache is shown. Bid above last, crossed book, or spread >0.25% produce caution messages. The app does not infer volume units from ambiguous turnover fields.
- Research Desk receives the snapshot fields and provenance as context/source when available, with explicit context that no native quote, premium, NAV, or trading signal is supported; without a fresh snapshot, it is told not to reuse stale values. Evidence-only fallback covers the same one-sided case.
- Browser smoke test at local `http://127.0.0.1:3001/` returned `GET /api/rtoken-ticker` HTTP 200 from Bitget through the development proxy. UI showed fresh `RAAPLUSDT` values (example observed in browser: last 341.59, bid 340.10, ask 341.59), ticker/retrieval timestamps, 0.44% spread warning, no native AAPL/premium claim, and clearly synthetic chart labels. The accessibility snapshot showed the one-sided label and quality warning; no browser console errors were recorded for rToken Lab. Screenshot capture was unavailable for the final post-cleanup revision, and this is not a full responsive or accessibility audit.
- Validation: `pnpm --filter @rtoken-lab/mcp-client test` passed (12 tests; 5 cover snapshot parsing including stale, wrong-symbol, missing-fields, and zero-size handling); web typecheck and production build passed. Web lint passed without code warnings (Node emitted the repository's existing package-module-type notice). The web Vitest harness found no tests; parser tests live in the MCP client package to avoid changing the existing JSX-in-`.ts` setup.
- Deployment caveat: local proxy success does not prove the deployed server route can reach Bitget. The deployed demo and its `/api/rtoken-ticker` response still need verification. User's snapshot output is an observation only; no native-equity comparison is claimed.

## Searchable Reality market selection (2026-09-26)

- Added a read-only instruments endpoint and client filter for Bitget instruments marked `category: SPOT`, `quoteCoin: USDT`, `symbolType: stock`, `status: online`, and `isReality: yes`, with the base/symbol relationship checked before a market is offered. RAAPL remains the default and is required in the instrument response.
- Added a searchable header market picker (base token or full symbol) and wired the chosen market through the ticker request, header status, one-sided quote, and research context. Each ticker is still parsed against the exact requested symbol and must pass existing price/size, quote-warning, and two-minute freshness checks. No stale quote is reused on market changes or errors; synthetic chart values remain separate.
- The OpenCode runtime probe for Bitget DNS resolution failed, so the current instruments field values and any additional market list were not independently observed during this implementation. Earlier user-provided RAAPL instruments output is the default-market evidence; availability and deployed proxy behavior remain to be rechecked where Bitget is reachable.
- Added unit tests for instrument eligibility, the RAAPL default requirement, and market searching. `pnpm --filter @rtoken-lab/web test`, web typecheck/lint/build, and `pnpm --filter @rtoken-lab/mcp-client test` pass. The browser review surface remained 1000 px wide; document/body widths matched it, but this environment did not allow a phone-width viewport or screenshot, so phone visual review remains open.

## Local live instruments verification (2026-09-28)

- The local same-origin `/api/rtoken-markets` proxy returned Bitget `code: 00000` with 3,393 spot instruments. Applying the app's category, quote coin, symbol type, online status, Reality marker, base-coin format, and symbol/base relationship filters yielded 2,811 eligible markets; `RAAPLUSDT` was present. This verifies the current local market-discovery path, not deployment or ticker availability for every selected market.
- The selected RAAPL ticker loaded in the local app with Bitget market/retrieval timestamps, best bid/ask, spread, and the observation limitations shown. An actual small-screen viewport could not be set in the browser harness; responsive phone review remains unverified.
- Refined the research panel task to focus on what a one-sided spot ticker establishes and what evidence is missing. Tightened Qwen instructions to distinguish evidence, limits, and next evidence; prohibit premium, valuation, liquidity, price-discovery, causation, or trading claims from a single spot snapshot; and avoid asserting missing sources were checked. Prompt regression tests cover those instructions. Qwen end-to-end behavior, deployment, and user testing remain open.

## Bitget native-equity quote and rToken history investigation (2026-09-28)

- Directly initialized `https://agent.bitget.com/mcp`, sent the initialized notification, and listed tools. The live server answered with `guide` and `do_query`. A `do_query` call to `equity_price_quote` for `AAPL` returned `success: true`, HTTP status 200, provider `bitget_data`, and a last price around USD 340.52. A repeated call about 44 seconds later returned USD 340.5182. The response metadata says `route: /equity/price/quote`, `provider_choices.provider: bitget_data`, `extra_params.market: a_share`, and `extra_params.source: iex`.
- Important limitation: this MCP equity response contains no exchange-trade timestamp, bid/ask, quote condition, or session field. Its metadata timestamp is the service request time, not proof of when the price was observed. `source: iex` is returned as request metadata, but we have not independently established what feed/venue/coverage that label represents. Treat this as an observed Bitget MCP equity quote response, not a synchronized or independently validated AAPL market quote.
- The live `equity_price_historical` MCP query returned HTTP 204 with empty data for the tested recent range. It does not currently provide historical AAPL observations in this probe.
- Official Bitget documentation describes `GET /api/v3/stockplus/market/quote?symbol=AAPL.US` for native US-equity quotes; the request example requires signed API-key headers, and Bitget states Stock Level 1 market data is whitelist-only. An unauthenticated request from this environment returned HTTP 400. No account credentials were supplied or requested.
- In the same environment, Bitget public REST returned successful `code: 00000` responses for RAAPL and RNKE spot tickers, hourly and daily candles, a standard SPOT order-book snapshot, and Reality stock info mapping `RAAPLUSDT` to `AAPL`. The Reality-specific `/api/v3/account/reality-orderbook` is separately documented as API-key/whitelist-gated; the successful standard SPOT order book is not evidence of that private Reality endpoint's access or semantics.
- Decision: a separate data vendor is not yet required merely to retrieve a native-stock reference, because the existing Bitget MCP equity quote is reachable. Do not enable an rToken/native-stock premium or call the two values timestamp-aligned: the MCP quote lacks a market-observation timestamp and two-sided quote, the historical MCP query returned no data, and the direct Stock+ quote route is gated. First establish feed/source meaning, observation-time semantics, quote currency and session, and sufficiently aligned observations. Keep the current one-sided rToken task and synthetic chart as-is until then.
- This is a successful point-in-time connectivity probe, not a guarantee of continued MCP/data availability or a claim that the UI already consumes the native quote. Existing REST/MCP app integration and deployment still need their own verification.
- Follow-up check: repeated `equity_price_historical` for AAPL with correctly formed Unix-second ranges covering the prior 24 hours and prior 7 days; both MCP responses were HTTP 204 with empty data. Official Stock+ documentation exposes an intraday endpoint with per-minute timestamps, but unauthenticated calls to both `/api/v3/stockplus/market/quote?symbol=AAPL.US` and `/api/v3/stockplus/market/intraday?symbol=AAPL.US` returned HTTP 400. No authorized Stock+ credentials are available in this workspace. Result: we found documented timestamped native-equity routes, but did not establish accessible native-equity observations or a live timestamped quote through current access.
- Third-party source/terms screening: Finnhub documents a quote API and real-time US stock data, but its public terms say data and derived results may not be redistributed without written approval and its listed plans are personal-use only; its commercial plan requires contacting sales. Alpha Vantage documents timestamped stock data and says realtime/15-minute delayed US data requires a personal premium plan, while commercial use requires contacting sales. Twelve Data documents timestamped quotes/time series, but its terms prohibit free-tier commercial use and require separate permission/terms for external display or redistribution. These are candidate vendors, not authorized or runtime-tested sources for this publicly accessible hackathon demo. No key was obtained or entered.
- Decision after source screening: do not add any of these providers to the public demo on a free/personal key. Continue only if the user has authorized Bitget Stock+ market-data access or chooses a provider and obtains written/public-demo redistribution rights (or the provider confirms an applicable license). The Track 3 brief reviewed in the repository requires an accessible demo and complete research task and lists data depth among judging criteria; no ban on another provider was found in that copy. That does not override third-party market-data licensing. Until an authorized timestamped equity source is available, the app remains rToken-only and no premium is calculated.
- Integrated a read-only `/api/rtoken-candles` proxy for Bitget public SPOT hourly candles, with symbol/interval/limit validation and retrieval metadata. The client validates OHLC consistency, numeric values, timestamps, minimum series size, and latest-candle freshness before showing a line. The Price view is labeled as Bitget rToken hourly closes in USDT, includes observed range/retrieval time, and explicitly does not show native-stock history. Loading and error states draw no chart. Heatmap/flow remain labeled illustrative/conceptual; Qwen context now states that candle values are not included in its answer evidence. Live one-off Bitget probe returned 168 hourly RAAPL candles. Web tests (6), typecheck, lint, production build, and `git diff --check` passed. Browser smoke review could not be completed because the local dev server was unavailable through the browser tool (localhost returned 502); deployed route behavior remains unverified.
- Follow-up: the app now fetches the validated hourly series once and shares that same result with the chart and Research Desk. The answer context includes computed close range/net change, high/low closes, largest observed close-to-close moves with actual elapsed time, and gaps over two hours. The chart retains all returned rows, while the concise prompt uses these named measurements instead of sending every row. Qwen is instructed to describe measurements rather than infer causes/signals and avoid calling a multi-hour gap a one-hour move. The AI-unavailable fallback also includes the verified candle summary. Added unit tests for the calculations/evidence formatting and strengthened prompt tests. Full checks pass; an initial live question returned an incomplete Qwen response with the full series prompt, so the prompt was shortened and needs a repeat runtime check.

## Alpaca public-display terms check (2026-09-28)

- Checked Alpaca's [support FAQ, “Can I redistribute Alpaca API data via my platform?”](https://alpaca.markets/support/redistribute-alpaca-api). It explicitly answers: “Unfortunately, you cannot redistribute Alpaca API data.” The article is dated November 2022.
- Decision: do not add Alpaca-sourced AAPL prices to this publicly accessible demo on a standard API subscription. Treat public display as redistribution unless Alpaca confirms an applicable permission or license in writing. No such permission has been obtained.
- Alpaca's free/basic feed is IEX, not full US-market coverage; this is an additional representativeness limitation, independent of the redistribution restriction. Alpaca is therefore not a lower-friction replacement for the currently blocked native-stock reference.
- No integration or credentials were added. Keep the current app rToken-only unless a timestamped native-stock source with terms permitting public display is established.
