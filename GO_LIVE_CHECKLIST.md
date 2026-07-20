# LionScanner — Go-Live Checklist

Status legend: ✅ done in code · ⚙️ needs config/secret before launch · ⚠️ recommended follow-up

## Secrets & environment (set these in the deployment environment)

- ⚙️ **`NODE_ENV=production`** — REQUIRED. Without it the server boots Vite dev
  middleware instead of serving the built `dist/` bundle.
- ⚙️ **`GEMINI_API_KEY`** — required for the Swarm AI chat + 1W projection. Now only
  ever used server-side (never shipped to the browser).
- ⚙️ **`RESEND_API_KEY`** + verified `lionscanner.net` domain — required for the
  Remind-Me welcome/weekly emails to actually deliver. (SMTP_* are an optional
  fallback.) See `.env.example`.
- ⚙️ **`EMAIL_FROM`** — e.g. `Lions Swarm AI <noreply@lionscanner.net>` on the
  verified domain.
- ⚙️ **`ADMIN_API_KEY`** — REQUIRED to use the admin endpoints. If unset, the admin
  API is disabled (fails closed). Send as `x-admin-key` header or `Authorization: Bearer`.
- ⚙️ **`APP_URL`** — public URL, used in email links (unsubscribe, dashboard CTA).
- ⚙️ **`COINGECKO_API_KEY`** — optional; improves market-data rate limits.

## Security fixes applied in code

- ✅ **Gemini API key no longer exposed to the browser.** Removed `/api/gemini/key`
  and the `vite define` that baked the key into the public bundle; all AI now goes
  through server-side `/api/gemini/chat`. (Also dropped the client AI SDK, −288 KB JS.)
- ✅ **Admin endpoints now authenticated** (`/api/admin/clock-subscribers`,
  `/api/admin/trigger-clock-update`) via `requireAdmin` with constant-time key
  comparison. Previously anyone could dump every subscriber email or trigger a mass
  email blast.
- ✅ **Subscribe endpoint is idempotent** — re-POSTing an already-subscribed address
  no longer re-sends the welcome email (prevents inbox-bombing a victim).
- ✅ **Unknown `/api/*` routes return JSON 404** instead of silently serving the SPA HTML.

## Must-fix before launch (flagged, not yet changed)

- ⚠️ **CycleMonitor live state is globally shared and anonymously writable.** The
  WebSocket handler accepts `set-pillar` / `set-btc-price` from any client and
  broadcasts the result to *all* connected clients. One user's what-if slider (or a
  malicious client) changes the BTC price / pillar scores everyone sees.
  **Recommended fix:** make the simulator controls session-local — stop the server
  from accepting/broadcasting client-originated overrides, and have the client keep
  user overrides in local state that the live stream doesn't clobber. This is a
  client-side rework in the (deprioritized) Monitor tab; happy to implement on
  confirmation of intent (personal simulator vs. collaborative board).

## Notes / acceptable-as-is

- CORS is open (`cors()`), which is fine for a public read API with no cookie auth.
- Per-IP sliding-window rate limiting is in place (120/min general, 15/min AI).
- WebSocket streams only public market data; no auth needed for the read path.
- Client JS bundle is ~809 KB (was ~1.1 MB). Consider route-level code-splitting
  later; not a launch blocker.
