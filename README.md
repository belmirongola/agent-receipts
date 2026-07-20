# agent-receipts

Local CLI that answers one question:

> **How much would my Claude Code / coding-agent usage have cost on Anthropic direct — vs a flat $30–50/mo gateway?**

Nothing is uploaded. Reads local logs under `~/.claude/projects`.

This is **not** another generic usage dashboard. The wedge is the **receipt comparison** (direct vs flat-rate), designed to be shared in Reddit/HN threads about rate limits and token anxiety.

## Quick start

```bash
node bin/agent-receipts.js
# or after publish:
npx agent-receipts
```

```bash
npx agent-receipts --plan growth
npx agent-receipts --json
```

## Why this exists

ccusage / tokscale already track tokens. Developers still don't have a one-command **bill shock receipt** they can paste into a thread:

```
Anthropic direct (est.):  $847.20
Piramyd Solo flat:        $30.00 / month
difference:               $817.20  (28.2× vs flat)
```

## Relation to Piramyd

Built by the Piramyd team. The tool is useful without Piramyd; the CTA at the bottom is optional and honest.

- Site: https://piramyd.cloud
- Onboarding: `npx piramyd`

## Status

MVP 0.1 — Claude Code JSONL scan. Codex/OpenCode paths planned.

## License

MIT
