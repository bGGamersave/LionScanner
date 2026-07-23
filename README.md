# The BLK Lion Scanner

A crypto/market analysis app: an Express server (with a Gemini-backed AI, live
market data, a Bitcoin cycle monitor over WebSocket, email reminders, and on-chain
Solana Pay subscriptions) serving a Vite + React single-page app.

## Run locally

**Prerequisites:** Node.js 18+.

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the values you need (see below).
3. Start the dev server (Vite middleware + API on one Express process):
   ```
   npm run dev
   ```
   The app is served at http://localhost:3000.

## Build & run in production

```
npm run build     # builds the client (dist/) and bundles the server (dist/server.cjs)
NODE_ENV=production node dist/server.cjs
```

`NODE_ENV=production` is **required** in production — without it the server boots Vite
dev middleware instead of serving the built `dist/` bundle.

## Environment variables

All configuration is via environment variables — see `.env.example` for the full,
commented list, and **`GO_LIVE_CHECKLIST.md`** for what must be set before launch.
Highlights:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Server-side Gemini AI (chat + 1-week projection). Never sent to the browser. |
| `RESEND_API_KEY` + `EMAIL_FROM` | Email delivery (welcome/weekly reminders, entitlement access codes) via Resend. Verify your sender domain. SMTP_* is an optional fallback. |
| `ADMIN_API_KEY` | Protects `/api/admin/*`. If unset, the admin API is disabled (fails closed). |
| `ENTITLEMENT_SECRET` | Signs entitlement claim tokens (HMAC). If unset, a random per-process secret is used and claim tokens don't survive a restart — set this in production. |
| `SOLANA_RECIPIENT_WALLET` | The wallet that receives on-chain USDC payments. Payments are disabled until set. |
| `SOLANA_RPC_URL` | Solana RPC endpoint — use a dedicated provider (Helius/QuickNode/Triton) in production. |
| `COINGECKO_API_KEY`, `APP_URL` | Optional market-data key; public app URL used in email links. |

## Notable scripts

- `npm run dev` — dev server (`tsx server.ts`)
- `npm run build` — client build + server bundle
- `npm start` — run the built server (`node dist/server.cjs`)
- `npm run lint` — type-check (`tsc --noEmit`)

## Known limitations

The subscription **tier** is verified server-side, but analysis **tokens** are a
client-side balance and the server does not yet gate protected API endpoints by tier.
Payment/entitlement state is stored in local JSON files that are ephemeral and
per-instance. See `GO_LIVE_CHECKLIST.md` for details and pre-scale recommendations.
