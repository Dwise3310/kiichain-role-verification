# KiiChain Role Verification Portal

Collects wallet addresses from Discord members who hold specific roles,
without asking anyone to paste an address into a channel. Members sign in
with Discord, their role is checked server-side against the live guild
(not the client's claim), and their wallet is validated and stored once.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind · Framer Motion ·
NextAuth (Discord OAuth) · Supabase (Postgres + RLS).

---

## 1. Prerequisites

- Node.js 20+
- A Discord server you administer, with **Developer Mode** turned on
  (User Settings → Advanced) so you can copy role/server IDs
- A [Supabase](https://supabase.com) project (free tier is enough to start)
- A Vercel account, if deploying there

---

## 2. Discord setup

### 2.1 Create the OAuth application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Under **OAuth2 → General**, copy the **Client ID** and **Client Secret** into
   `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`.
3. Under **OAuth2 → Redirects**, add:
   - `http://localhost:3000/api/auth/callback/discord` (local dev)
   - `https://<your-domain>/api/auth/callback/discord` (production)

### 2.2 Create the bot (used server-side to read roles)
1. Under **Bot**, click **Add Bot**. Copy the token into `DISCORD_BOT_TOKEN`.
2. Enable the **Server Members Intent** (Bot → Privileged Gateway Intents).
   Without this, the bot can't see member role lists.
3. Invite the bot to your server with the `bot` scope and at minimum
   **View Server Members** permission (no message permissions needed —
   this app never posts to Discord).

### 2.3 Get your role and server IDs
- Right-click your server icon → **Copy Server ID** → `DISCORD_GUILD_ID`.
- Right-click each qualifying role in Server Settings → Roles → **Copy Role ID**.
  Put them comma-separated in `ELIGIBLE_ROLE_IDS`, e.g.:
  ```
  ELIGIBLE_ROLE_IDS=123456789012345678,234567890123456789
  ```

---

## 3. Supabase setup

1. Create a new Supabase project.
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
   This creates `campaigns`, `submissions`, `audit_logs`, `duplicate_attempts`,
   the dedupe constraints, indexes, and Row Level Security policies.
3. From **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret)

The `service_role` key bypasses Row Level Security and is only ever used in
server-side API routes (`lib/supabase.ts` → `supabaseAdmin()`). It is never
sent to the browser.

---

## 4. Admin credentials

The admin dashboard uses a single shared password (not Discord OAuth), hashed
with bcrypt — nothing is stored in plaintext.

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password-here', 10))"
```

Paste the output into `ADMIN_PASSWORD_HASH`. Generate a random secret for
`ADMIN_JWT_SECRET` (used to sign the admin session cookie):

```bash
openssl rand -base64 32
```

---

## 5. Environment variables

Copy `.env.example` to `.env.local` and fill in every value described above,
plus:

```bash
openssl rand -base64 32   # → NEXTAUTH_SECRET
```

`NEXTAUTH_URL` should match your deployed origin in production
(`NEXTAUTH_URL=https://roles.yourdomain.io`).

---

## 6. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

---

## 7. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel → it auto-detects Next.js (`vercel.json` is included
   but not required).
3. Add every variable from `.env.example` in **Project Settings → Environment
   Variables** (do this for Production *and* Preview if you test PRs).
4. Update the Discord OAuth redirect URI and `NEXTAUTH_URL` to your real
   Vercel domain.
5. Deploy.

---

## 8. What's production-ready vs. what needs your input

**Fully wired:**
- Discord OAuth login, live guild-membership + role check (server-side, not
  trusted from the client)
- Wallet validation (EVM checksum + Cosmos bech32), duplicate-wallet and
  duplicate-submission blocking, admin override for edge cases
- Admin dashboard: stats, search/filter, inline edit, delete, CSV/Excel/JSON
  export, campaign CRUD with deadlines and banner images
- Admin submissions table has real pagination (25/page)
- Audit log viewer at `/admin/audit`, with logging for logins, submissions,
  edits, deletes, and exports
- Role IDs are resolved to human-readable Discord role names throughout the
  admin dashboard, submissions table, campaign cards, and the verify page's
  "role verified" badge
- The verify page fetches the active campaign, shows its banner/description
  as an announcement, renders a live countdown to its deadline, and passes
  the campaign's `id` through to `/api/submit` — so per-campaign eligible
  roles and deadlines actually apply to the live flow, not just the API
- Rate limiting (falls back to in-memory if Upstash isn't configured — set
  `UPSTASH_REDIS_REST_URL`/`TOKEN` before relying on this in production,
  since in-memory limits don't hold across multiple serverless instances)
- Row Level Security locking Supabase down to server-only writes
- ESLint runs clean during builds

**Still not built:**
- `KII_CHAIN_ID` in `components/WalletConnectPanel.tsx` is a placeholder —
  swap in KiiChain's real chain-id string for Keplr/Leap's `suggestChain`/
  `enable` calls.
- WalletConnect's modal isn't wired up — MetaMask, Keplr, and Leap connect
  via their injected browser providers, and there's a manual-paste fallback
  for everyone else. Wiring the actual WalletConnect v2 modal needs a
  `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from cloud.walletconnect.com and
  the `@walletconnect/ethereum-provider` client — didn't want to fake a
  modal that doesn't actually connect.
- Campaign banner is a URL field, not a file upload — no storage bucket is
  wired up for that.
- No admin view for the `duplicate_attempts` table (it's populated on every
  blocked attempt, just not surfaced in the dashboard yet).
- No automated tests.

**Not yet verified against a live Supabase instance** — every query has been
written and type-checked against the schema, but none of it has executed
against a real Postgres database yet. Run `supabase/schema.sql` against a
real project and exercise the flows before trusting it in production.

---

## 9. Project structure

```
app/
  page.tsx                landing page
  verify/page.tsx          Discord → role check → wallet connect → submit
  success/page.tsx
  profile/page.tsx
  admin/
    login/page.tsx
    (panel)/               authenticated admin shell (sidebar layout)
      page.tsx              dashboard stats
      submissions/page.tsx  search/edit/delete/export
      campaigns/page.tsx    campaign CRUD
  api/
    auth/[...nextauth]/     Discord OAuth
    submit/                 wallet submission (rate-limited, validated)
    me/                     signed-in user's own submission
    admin/                  login, submissions, campaigns, stats, export
components/                 shared UI (GlassCard, VerificationRing, WalletConnectPanel, ...)
lib/                        supabase, discord, wallet, rate-limit, audit, auth
supabase/schema.sql          full DB schema + RLS
middleware.ts                 protects /admin and /api/admin/*
```
