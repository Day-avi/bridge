# Bridge — Blueprint (Technical Plan)

## Architecture
Modular monolith, one repo. Bridge is the intelligence and orchestration layer.

Stack: Next.js + TypeScript (web app/PWA), Supabase (Auth, Postgres with RLS, Storage), Inngest (durable background jobs), Anthropic API (analysis, strategy), Vercel (hosting), Sentry, PostHog, Resend, Vitest + Playwright.

## Modules (src/modules)
instagram, audience, content, strategy, moderation, leads, catalog, commerce, attribution, fulfillment, automations, notifications, revenue-intelligence, billing, admin.

## Provider interfaces
InstagramGateway -> Meta; CommerceGateway -> Shopify; ShippingGateway -> Shiprocket; AiGateway -> Anthropic. Core code never calls providers directly.

## Source of truth
Instagram: content/engagement. Shopify: products, orders, payments. Shiprocket: shipments. Bridge: strategy, experiments, attribution, learning.

## AI design
- Metrics computed in code, never by the LLM.
- LLM tasks: content classification, audience-fit diagnosis, strategy, comment classification, weekly explanation.
- All LLM output is JSON validated by schema; store input refs and model version.
- Learning = structured memory of experiments and outcomes, not model training.
- Auto-hide only high-confidence abuse/spam; uncertain goes to review queue.

## Data (core tables, all tenant-scoped with RLS)
workspaces, members, ig_accounts, ig_media, ig_insights, ig_comments, comment_classifications, audience_profiles, strategies, experiments, campaigns, tracked_links, click_events, shops, products, orders, shipments, leads, automation_rules, audit_log.

## Security
Encrypt tokens at rest; least-privilege Meta permissions; verify webhook signatures; RLS tests (allowed and denied); no secrets in repo; spend caps on AI usage; audit log for every automated action.

## Phases (test gate after each; do not start the next until the gate passes)

### Phase 0 — Foundation
Repo scaffold, CI, lint/type/test, Supabase project, auth, workspace model, RLS tests, Sentry, docs.
Gate: sign up, create workspace, tenant isolation tests pass, CI green, deploy preview works.

### Phase 1 — Instagram read + diagnosis
Meta login (own accounts first), import media/insights/comments, deterministic metrics, content classification, audience-fit report.
Gate: run on 3 real accounts (incl. yours); owner confirms report is accurate and useful; no token leaks.

### Phase 2 — Strategy engine
Owner onboarding (ideal buyer, countries, goal), 30-day strategy, weekly Reel briefs, experiment tracking, weekly revision.
Gate: 5 pilot owners rate recommendations; at least some executed; manual review for hallucinations.

### Phase 3 — Comment safety and leads
Classifier with categories, review queue, auto-hide for high confidence, buyer-intent detection, Hindi/English/Hinglish test set.
Gate: precision/recall on labelled comments; zero wrongly hidden genuine customer comments in review sample.

### Phase 4 — Commerce and attribution
Shopify connect, product import, tracked links per campaign, click/checkout/order attribution.
Gate: a real test order is attributed to the correct Reel.

### Phase 5 — Fulfilment
Shiprocket: serviceability, shipment creation, tracking, exception alerts, delivered-revenue metric.
Gate: end-to-end test order from Reel link to delivered status.

### Phase 6 — Automations and scale
Approval-based automation rules, notifications, billing (Razorpay/Stripe), admin dashboard, Meta App Review submission, then international expansion.
Gate: pilot owners run weekly without founder help; costs per account within budget.

## Parallel track
Start Meta App Review prerequisites (business verification, privacy policy, screencasts) during Phase 1.
