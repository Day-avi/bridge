# Setup

Part 1 is for you (the founder): the accounts and settings only you can create. Part 2 is for running Bridge on a computer.

Never paste keys into chat, GitHub issues or code. They go only into Vercel's settings (and your own `.env.local` if you run Bridge locally).

## Part 1: accounts and settings

### 1. Supabase (database and login)

1. Sign up at [supabase.com](https://supabase.com) and create an organization (Free plan is fine for now).
2. Create a project named `bridge-staging`, region **South Asia (Mumbai)**. Save the database password in your password manager.
3. **Authentication → Sign In / Providers → Email:** keep "Confirm email" on. Set minimum password length to 8 and require letters and digits.
4. **Authentication → URL Configuration:**
   - Site URL: your Vercel production URL (from step 2 below), e.g. `https://bridge-xyz.vercel.app`.
   - Redirect URLs: add `https://*-<your-vercel-team-slug>.vercel.app/**` (covers every preview link) and your production URL followed by `/**`.
5. **Authentication → Emails → Confirm signup:** set the subject to `Confirm your Bridge account` and replace the message body with the contents of [`supabase/templates/confirmation.html`](../supabase/templates/confirmation.html). Without this, confirmation links won't work.
6. **Project Settings → API Keys:** you'll need the **Project URL** and the **Publishable key** for Vercel. You don't need the secret key in Phase 0.
7. **Create the tables:** open **SQL Editor → New query**, paste the whole of [`supabase/migrations/20261017000000_workspaces.sql`](../supabase/migrations/20261017000000_workspaces.sql), and press **Run**. It should say "Success. No rows returned". Do this once; later phases will automate it.

Supabase's built-in email sender is limited to a few emails per hour. That's fine for testing; before real sellers sign up we'll connect a proper sender on your domain.

### 2. Vercel (hosting and preview links)

1. Sign up at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New → Project →** import `Day-avi/bridge`. Framework is detected as Next.js.
3. **Settings → Build and Deployment → Node.js Version:** 24.x.
4. **Settings → Environment Variables** (tick Production and Preview for each):
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Supabase Publishable key
   - Sentry values from step 3 (optional until you create Sentry)
5. Redeploy. Every pull request now gets its own preview link, posted on the PR.

The Hobby plan is free but for non-commercial use only. Switch to Pro before real businesses use Bridge.

### 3. Sentry (error alerts, optional for Phase 0)

1. Sign up at [sentry.io](https://sentry.io) (free Developer plan) and create a **Next.js** project.
2. Copy the **DSN** into Vercel as `NEXT_PUBLIC_SENTRY_DSN`.
3. **Settings → Auth Tokens:** create an organization token and add it to Vercel as `SENTRY_AUTH_TOKEN`, plus `SENTRY_ORG` (your organization slug) and `SENTRY_PROJECT` (the project slug).

### 4. GitHub (protect the main branch)

After the Phase 0 pull request is merged: **Settings → Branches → Add branch ruleset** for `main`: require a pull request before merging, and require the status checks `Lint, types, unit tests`, `Database security + browser tests` and `Secret scan` to pass.

### 5. Start now for Phase 1: Meta

1. Make sure your own Instagram account is a **Business** or **Creator** account.
2. Create a Meta developer account at [developers.facebook.com](https://developers.facebook.com) and a Meta Business portfolio for Bridge.
3. Start **Business Verification** in the portfolio (needs your business documents; can take weeks).

## Part 2: running Bridge on a computer

Needs Node.js 24 and Docker Desktop (or another Docker engine).

```bash
npm install
npm run db:start          # starts a local Supabase in Docker and applies migrations
cp .env.example .env.local
# Put the "Project URL" and "Publishable" key printed by `npx supabase status` into .env.local
npm run dev               # http://127.0.0.1:3000
```

Sign-up emails don't really send locally; open Mailpit at http://127.0.0.1:54324 to click the confirmation link.

| Command | What it does |
|---|---|
| `npm run dev` | Run the app with live reload |
| `npm run lint` / `npm run typecheck` / `npm run format:check` | Code checks |
| `npm test` | Unit tests (Vitest) |
| `npm run test:db` | Database security tests (needs `db:start`) |
| `npm run build && npm run test:e2e` | Browser tests against a production build (needs `db:start`; first run `npx playwright install chromium`) |
| `npm run db:reset` | Wipe the **local** database and re-apply migrations |
| `npm run db:types` | Regenerate TypeScript types after changing a migration |
