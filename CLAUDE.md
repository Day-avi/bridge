# Bridge — Project Instructions for Claude

Read docs/GREENPRINT.md and docs/BLUEPRINT.md before any work. They are the source of truth.

## Rules
- Work on ONE phase at a time. Never start a phase before the previous gate is approved by the founder.
- Plan first: for each task, write a short plan and wait for approval before coding.
- Work on a branch; open a pull request; never push to main (after the initial docs commit).
- Never deploy to production, run destructive DB commands, or change auth/billing without explicit approval.
- Never commit secrets. Use .env.example for variable names only.
- Use official Meta, Shopify and Shiprocket APIs only. No scraping.
- Providers sit behind gateway interfaces. Keep to the modular monolith; no microservices.
- Compute metrics in code. LLM outputs must be schema-validated JSON.
- Every table is tenant-scoped with RLS and has allowed/denied tests.
- Every feature needs tests and a short note in docs/DECISIONS.md for non-obvious choices.
- Verify current library and API versions from official docs before using them.
- If a requirement is ambiguous or risky, stop and ask.

## Commands (fill in after Phase 0 scaffold)
install / dev / lint / typecheck / test / e2e

## Communication
The founder is not a developer. Explain decisions in plain language, show what changed and how to test it, and list anything needing founder action.
