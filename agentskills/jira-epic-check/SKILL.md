---
name: jira-epic-check
description: Finds Jira Epics in project RHEA (via user-jira-mcp-server) that simultaneously fail every applicable governance check (Due date, Blocked, missing related work — issue links or epic children, 90-day comment recency), plus a second list of epics with no governance-relevant activity in the last 90 days (issue updated and comment timestamps). Use for RHEA epic hygiene, stale epics, sprint planning, blocked epics, linked issues, or MCP-driven epic audits.
compatibility: Requires an Agent Skills-compatible agent, user-jira-mcp-server MCP, Jira access to project RHEA, and network access to Jira.
metadata:
  version: "1.0"
  cursor-equivalent-folder: "JIRA-EPIC-CHECK"
  specification: "https://agentskills.io/specification"
---

# Jira epic checks (MCP) — Markdown-only

This skill ships **only Markdown** (`.md`) under this folder: **no `scripts/`**, **no bundled executables**, **no `assets/`**. The agent follows prose instructions and uses Jira via MCP. For [Agent Skills](https://agentskills.io/specification) progressive disclosure, open the reference when you run the audit.

| Document | Purpose |
|----------|---------|
| [references/INSTRUCTIONS.md](references/INSTRUCTIONS.md) | Full goal, stale-90-day rules, RHEA field defaults, workflow, checklist, and MCP tool usage |

**When to load:** Read **INSTRUCTIONS.md** before scoring epics (primary fail-all list + secondary stale 90-day list).
