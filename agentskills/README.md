# Agent Skills layout ([agentskills.io](https://agentskills.io/home))

Each subfolder is one skill. The [format specification](https://agentskills.io/specification) allows optional `scripts/`, `references/`, and `assets/`.

**This repository’s copy** under `agentskills/jira-epic-check/` is **Markdown-only**: **`SKILL.md`**, **`references/CONTEXT.md`** (org vocabulary ↔ List 1 / List 2), and **`references/INSTRUCTIONS.md`** (parameterized project + **`LIST1_DAYS`** / **`LIST2_DAYS`**) — **no `scripts/`** and **no non-`.md` files** in that skill folder.

Your product’s install path may differ (for example VS Code Copilot uses `.agents/skills/<skill-name>/` per the [quickstart](https://agentskills.io/skill-creation/quickstart)).
