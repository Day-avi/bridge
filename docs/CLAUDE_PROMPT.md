# Kickoff prompt for Claude Code

Paste this into Claude Code, started from the root of https://github.com/Day-avi/bridge:

```text
You are working in the GitHub repo https://github.com/Day-avi/bridge.
Read CLAUDE.md, docs/GREENPRINT.md and docs/BLUEPRINT.md fully.

Do not write application code yet. Your task now:
1. Summarise the product and the phases in plain language.
2. Verify current stable versions and setup steps for Next.js, Supabase, Inngest and Meta's Instagram Platform from official docs, and note anything in BLUEPRINT.md that is outdated.
3. Propose a detailed Phase 0 plan: repo structure, tooling, CI, environment variables, test strategy, and the exact steps I must do myself (accounts, keys).
4. List risks and open questions for me.
Then stop and wait for my approval. After approval, implement Phase 0 on a branch and open a pull request with test instructions. Never move to the next phase without my sign-off.
```
