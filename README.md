# rToken Lab

An AI-assisted research workbench for exploring Bitget Reality tokenized-stock markets. The app brings together a Bitget rToken market snapshot, hourly price history for the selected rToken, a separately sourced daily stock close, and an AI research assistant.

## Try the app

- **Live demo:** [rtoken-lab.vercel.app](https://rtoken-lab.vercel.app/)
- **Hackathon:** Bitget Builder Base Camp Hackathon S2, Track 3 — AI Trading Desk

### Example research task

Select an rToken, inspect its market snapshot and hourly history, then ask a question about the displayed data. You can also ask for a named stock's price while a different rToken is selected; the app looks up a separate daily close for that stock when available.

## What it does

- Lists available Bitget Reality spot instruments and displays a selected rToken's quote in USDT.
- Shows hourly candles for the selected rToken market, with selectable 1-day, 1-week, and 1-month views.
- Displays a separately dated daily stock-close reference in USD when available.
- Sends research questions and application-supplied market context to an AI provider and displays the response alongside its evidence sources.
- Provides evidence-only research summaries when an AI response is unavailable.

## Data and interpretation

- rToken quotes and candles describe the selected Bitget spot instrument; they are not native-stock prices.
- The stock-close reference is daily historical data in USD. It is separate from the rToken's USDT quote and is not time-aligned with it.
- A ticker-name match does not verify an rToken's underlying, backing, or redemption rights.
- The app does not place orders or establish fair value, a premium, or a trading signal.
- Market data and external services may be unavailable or delayed. Check the displayed source, timestamps, and status before interpreting an observation.

## Run locally

### Requirements

- Node.js 20 or newer
- pnpm 9

### Install and start

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The web app runs on port 3000. The development server proxies public Bitget market data and provides local handlers for research-provider and daily stock-close requests.

### Environment configuration

Create a root `.env` file for local development. Configure provider credentials on the server only; do not use `VITE_`-prefixed names for secrets or commit secret values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `BITGET_QWEN_API_KEY` | For AI research | API key for the Qwen provider. `QWEN_API_KEY` is also accepted. |
| `EXPLABS_API_KEY` | Optional | Enables the Experiential Labs fallback provider. |
| `EODHD_API_TOKEN` | Optional | Token for the daily stock-history service; the app can use the provider's demo token when unset. |
| `BITGET_QWEN_BASE_URL` | Optional | Qwen API base URL. `QWEN_BASE_URL` is also accepted. |
| `BITGET_QWEN_MODEL` | Optional | Qwen model override. `QWEN_MODEL` is also accepted. |
| `EXPLABS_BASE_URL` | Optional | Experiential Labs API base URL. |

AI research requires a configured provider. Public Bitget market data can be browsed without an AI provider key. The demo stock-history token has limited availability and symbol coverage.

## Development checks

Run from the repository root:

```bash
pnpm --filter @rtoken-lab/web lint
pnpm --filter @rtoken-lab/web test
pnpm --filter @rtoken-lab/web typecheck
pnpm --filter @rtoken-lab/web build
```

## Project structure

- `apps/web` — React/Vite application and server-side API handlers.
- `packages/core` — shared event schemas and types.
- `packages/mcp-client` — market snapshot parsing and research-provider client.
- `packages/ui` — shared interface components.

## License

No open-source license is currently specified in this repository. All rights remain with the copyright holder unless a license is added.
