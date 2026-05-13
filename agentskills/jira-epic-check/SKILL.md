---
name: jira-epic-check
description: Finds Jira Epics in a user-specified project (or JQL scope) that simultaneously fail every applicable governance check (Due date, Blocked, missing related work — issue links or epic children, comment recency vs a configurable List 1 window), plus a second list of epics with no governance-relevant activity in a configurable List 2 window (issue updated and comment timestamps). List 1/List 2 day counts and project key are runtime parameters (defaults 90/90 days). Use for epic hygiene, stale epics, sprint planning, blocked epics, linked issues, or MCP-driven epic audits via user-jira-mcp-server.
compatibility: Requires an Agent Skills-compatible agent, user-jira-mcp-server MCP, Jira access to the target project, and network access to Jira.
metadata:
  version: "1.1"
  cursor-equivalent-folder: "JIRA-EPIC-CHECK"
  specification: "https://agentskills.io/specification"
---

# Jira epic checks (MCP) — Markdown-only

This skill ships **only Markdown** (`.md`) under this folder: **no `scripts/`**, **no bundled executables**, **no `assets/`**. The agent follows prose instructions and uses Jira via MCP. For [Agent Skills](https://agentskills.io/specification) progressive disclosure, open the references when you run the audit.

| Document | Purpose |
|----------|---------|
| [references/CONTEXT.md](references/CONTEXT.md) | Org vocabulary — e.g. Enterprise Architecture ↔ project key, **Problematic JIRA** ↔ List 1, **Untouched JIRA** ↔ List 2 |
| [references/INSTRUCTIONS.md](references/INSTRUCTIONS.md) | Runtime parameters (**`PROJECT_KEY`**, **`LIST1_DAYS`**, **`LIST2_DAYS`**), goals, workflow, checklist, MCP usage |
| [references/evaluation.md](references/evaluation.md) | Recorded MCP smoke run, calibration checks, and post-fix status for this skill |

**When to load:** Read **CONTEXT.md** if the user uses stakeholder wording; read **INSTRUCTIONS.md** before scoring (List 1 + List 2 in one run). Open **evaluation.md** when reviewing prior verification results.
