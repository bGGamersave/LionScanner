# LionScanner — Go-Live Checklist

Status legend: ✅ done in code · ⚙️ needs config/secret before launch · 🧪 needs a real test before launch

## 1. Secrets & environment (set in the deployment environment)

- ⚙️ **`NODE_ENV=production`** — REQUIRED. Without it the server boots Vite dev
  middleware instead of serving the built `dist/` bundle.
- ⚙️ **`GEMINI_API_KEY`** — Swarm AI chat + 1W projection. Server-side only now.
- ⚙️ **`RESEND_API_KEY`** + verified `lionscanner.net` domain — welcome/weekly
  emails and the entitlement access codes. (SMTP_* is an optional fallback.)
- ⚙️ **`EMAIL_FROM`** — e.g. `Lions Swarm AI <noreply@lionscanner.net>`.
- ⚙️ **`ADMIN_API_KEY`** — protects `/api/admin/*`. Disabled (fails closed) if unset.
- ⚙️ **`APP_URL`** — public URL used in email links.
- ⚙️ **`COINGECKO_API_KEY`** — optional; better market-data rate limits.

### Payments (Solana Pay)
- ⚙️ **`SOLANA_RECIPIENT_WALLET`** — the wallet (base58 pubkey) that receives USDC.
  Payments are disabled (create returns 503) until this is set.
- ⚙️ **`SOLANA_RPC_URL`** — use a dedicated provider (Helius/QuickNode/Triton).
  The public `api.mainnet-beta.solana.com` is rate-limited and commonly blocks
  cloud hosts, which will make verification fail. The host must also be allowed
  by the environment's egress policy.
- ⚙️ **`SOLANA_USDC_MINT`** — defaults to mainnet USDC; override for devnet tests.
- ⚙️ **`ENTITLEMENT_SECRET`** — long random string; signs entitlement claim
  tokens. Falls back to `ADMIN_API_KEY`. Set explicitly in prod.

## 2. Security fixes applied

- ✅ **Gemini key no longer exposed to the browser** — removed `/api/gemini/key`
  and the vite `define`; all AI runs through server `/api/gemini/chat`.
- ✅ **Admin endpoints authenticated** (`requireAdmin`, constant-time compare).
- ✅ **Subscribe endpoint idempotent** — no welcome-email inbox-bombing.
- ✅ **Unknown `/api/*` → JSON 404** (no SPA fall-through).
- ✅ **CycleMonitor no longer globally writable** — what-if controls are
  session-local; the server rejects client price/pillar overrides.

## 3. Real payments + entitlements (replaces the old simulation)

- ✅ **On-chain USDC via Solana Pay**, verified server-side with
  `findReference` + `validateTransfer` (recipient + amount + token + reference).
  Flow: `POST /api/payments/solana/create` → user pays via QR/wallet →
  client polls `GET /api/payments/solana/verify` → entitlement granted.
- ✅ **Server-side entitlements keyed to email** — paid tier/tokens can no longer
  be self-granted from localStorage. On load the app re-checks
  `/api/entitlements/me`; on a new device the user restores access with an
  emailed 6-digit code (`/api/entitlements/request-code` + `/verify-code`).
- ✅ **Authoritative pricing server-side** — client-sent prices are ignored.
- 🧪 **Devnet end-to-end test REQUIRED before launch** (could not run in this
  sandbox — no wallet/RPC egress). Suggested:
  1. Set `SOLANA_RPC_URL=https://api.devnet.solana.com`,
     `SOLANA_USDC_MINT=<devnet USDC mint>`, `SOLANA_RECIPIENT_WALLET=<your devnet wallet>`.
  2. Open a Premium Pack, scan the QR with a devnet Phantom wallet holding
     devnet USDC, pay, and confirm the UI flips to "Payment Confirmed" and the
     tier unlocks.
  3. Verify `/api/entitlements/request-code` emails a code and `/verify-code`
     restores the plan on a second browser.

## 4. Performance

- ✅ Client AI SDK removed and heavy views code-split. Initial JS ~544 KB
  (was ~1.1 MB). Heavy chunks (Perps ~174 KB, Strategy ~34 KB, Monitor ~28 KB,
  payment ~26 KB, AI ~9 KB) load on demand.
- ✅ Smoke-tested in a headless browser: app renders, tab switching loads each
  split chunk without console errors.

## 5. Notes / acceptable-as-is

- CORS is open (`cors()`) — fine for a public read API with no cookie auth.
- Per-IP sliding-window rate limiting: 120/min general, 15/min AI.
- WebSocket streams only public market data (no auth needed for the read path).
- Runtime JSON stores (`payments.json`, `entitlements.json`,
  `entitlement-codes.json`, clock files) are gitignored. On Cloud Run these live
  on the container's ephemeral disk and are lost on restart/redeploy — move them
  to a database or persistent volume before scaling beyond a single instance.

## 6. Known limitations (from the focused-fix scope) — address before monetized scale

These were consciously deferred; they don't block a soft launch but matter before
payments carry real weight or the app runs on more than one instance:

- **Analysis tokens are a client-side balance.** Purchased tokens live in the
  browser (`localStorage`), so a determined user can edit their token count. The paid
  **membership tier** is server-verified, but tokens are not tamper-proof. Full
  enforcement needs a server-authoritative token ledger (a `/spend` endpoint the
  client calls per use) — intentionally not built yet. (Because tokens are local,
  they also don't transfer across devices; the tier does, via the email-code claim.)
- **Protected API endpoints are not gated by tier server-side.** Tier gating is
  enforced only in the client UI; the AI/market endpoints don't check the caller's
  entitlement. Add server-side tier checks (verify the claim token + tier) on
  protected routes before relying on tiers for monetization.
- **Payment/entitlement storage is ephemeral JSON (single instance).** Confirmed
  payments and entitlements won't survive a restart/redeploy and aren't shared across
  instances. Migrate to a database (e.g. Postgres/Firestore) before scaling. Until
  then, if `ENTITLEMENT_SECRET` is unset the server uses a random per-boot secret, so
  claim tokens also reset on restart — set `ENTITLEMENT_SECRET` explicitly.

## Security fixes since the initial checklist

- Entitlement claim tokens can no longer be forged: the HMAC secret never falls back
  to a hardcoded value (uses `ENTITLEMENT_SECRET`/`ADMIN_API_KEY`, else a random
  per-process secret).
- Fixed a free-token-refill bug (page reload no longer restores spent tokens).
- Access codes use a CSPRNG, a 60s resend cooldown, and a non-enumerable generic
  response (requesting a code no longer reveals whether an email holds a plan).
- Payment verification confirms + grants in an atomic re-check, preventing a
  double-grant race from concurrent verifies.
