# Decisions

Short notes on choices that aren't obvious from the code. Newest at the bottom of each phase.

## Phase 0 (October 2026)

**Node 24 LTS, Next.js 16.4, TypeScript 6.0.** TypeScript 7 shipped on 16 Oct 2026, but `typescript-eslint` (used by Next's lint rules) only supports TypeScript below 6.1. Revisit when it does.

**ESLint 10 alongside `eslint-config-next`.** `create-next-app` still installs ESLint 9; ESLint 10 works with Next's config and is the current release. `npm audit` reports a high-severity `braces` advisory reached only through `eslint-config-next` → `fast-glob`. It is a dev-only lint dependency and never ships to users; npm's only offered "fix" downgrades to Next 14's config. Recheck when `eslint-config-next` updates.

**Cache Components stay on** (the Next.js 16 default). Anything that reads the signed-in user sits behind a `<Suspense>` boundary, and `getCurrentUser()` calls `connection()` first because Supabase's token check reads the clock, which Next forbids during prerendering and prefetching.

**Workspaces are created only through `create_workspace()`.** The database function inserts the workspace, makes the caller its owner and writes the audit entry in one transaction. Users have no direct INSERT on `workspaces`, so a workspace can never exist without an owner.

**RLS helpers live in a `private` schema** and are `security definer`, so the membership lookup isn't itself filtered by the `members` policy (which would recurse) and the helpers aren't callable through the public API.

**Column-level grants back up RLS.** Owners can rename a workspace but no one can change its `slug` or `created_by`; membership rows can change `role` but not move to another user. Signed-out visitors (`anon`) have no table privileges at all.

**A workspace always keeps one owner** (trigger `keep_one_owner`). Side effect: deleting a user who is the sole owner of a workspace fails until ownership moves. That's intentional; deleting accounts is an admin task for later.

**No workspace deletion in Phase 0.** It would cascade to every later table (Instagram data, orders), so it waits for a deliberate design with a grace period.

**Slugs get a random 6-character suffix** (`asha-handlooms-1a2b3c`) so they're unique without revealing how many workspaces exist, and guessing another seller's URL is pointless anyway because RLS returns "not found".

**Email confirmation uses a `token_hash` link** (`/auth/confirm`) rather than the default PKCE code link, so the link works even when opened on a different device or browser from the one used to sign up. This needs the custom "Confirm signup" email template in `supabase/templates/confirmation.html`, which must also be pasted into the hosted Supabase project (see SETUP.md). The template uses `{{ .RedirectTo }}`, which the app sets to the site the user signed up on, so preview deployments send links back to themselves.

**Sentry collects errors only.** No session replay, cookies, headers, request bodies, query strings or user info: forms carry passwords and later pages will show buyers' comments. It's off entirely when `NEXT_PUBLIC_SENTRY_DSN` is empty.

**CI needs no secrets.** It starts a throwaway local Supabase in Docker, runs the RLS tests against it, and runs browser tests against a production build. Confirmation emails are read from Mailpit, the local mail catcher.

**`members` has two roles, `owner` and `member`.** An `admin` role can be added later without changing existing policies.

**Not in Phase 0:** Inngest, PostHog, Resend, the Anthropic API, PWA support and the other module folders. Each arrives with the phase that first needs it.
