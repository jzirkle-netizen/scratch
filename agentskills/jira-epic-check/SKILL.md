---
name: jira-epic-check
description: >-
  Finds Jira Epics that fail all governance checks (List 1 / Problematic) and epics with no
  recent activity (List 2 / Untouched) via user-jira-mcp-server. Use when the user asks for
  epic hygiene, stale epics, sprint planning, blocked epics, linked-work checks, or
  Problematic/Untouched JIRA lists; PROJECT_KEY and LIST1/LIST2 day windows are configurable.
compatibility: Requires an Agent Skills-compatible agent, user-jira-mcp-server MCP, Jira access to the target project, and network access to Jira.
metadata:
  version: "1.2"
  cursor-equivalent-folder: "JIRA-EPIC-CHECK"
  specification: "https://agentskills.io/specification"
---

# Jira epic checks (MCP) — Markdown-only

## When to use

- Epic governance audit (fail-all **and** stale lists) for a Jira project or custom epic JQL.
- Org phrases like **Enterprise Architecture** or **CBP Sales Planning Transformation** (see [CONTEXT.md](references/CONTEXT.md)).

Do **not** use for one-off Jira edits, non-epic issue types only, or without `user-jira-mcp-server`.

This skill ships **only Markdown** (`.md`) under this folder: **no `scripts/`**, **no bundled executables**, **no `assets/`**. The agent follows prose instructions and uses Jira via MCP. For [Agent Skills](https://agentskills.io/specification) progressive disclosure, open the references when you run the audit.

| Document | Purpose |
|----------|---------|
| [references/CONTEXT.md](references/CONTEXT.md) | Org vocabulary — e.g. Enterprise Architecture ↔ project key, **Problematic JIRA** ↔ List 1, **Untouched JIRA** ↔ List 2 |
| [references/INSTRUCTIONS.md](references/INSTRUCTIONS.md) | Runtime parameters (**`PROJECT_KEY`**, **`LIST1_DAYS`**, **`LIST2_DAYS`**), goals, workflow, checklist, MCP usage |
| [references/evaluation.md](references/evaluation.md) | *(Optional)* Recorded MCP verification runs for maintainers |

**When to load:** Read **CONTEXT.md** if the user uses stakeholder wording; read **INSTRUCTIONS.md** before scoring (List 1 + List 2 in one run). Open **evaluation.md** only when reviewing prior verification results.
