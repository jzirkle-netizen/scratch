---
name: jira-epic-mcp-check
description: Audits Jira Epics in project RHEA via the user-jira-mcp-server MCP (JQL search and issue fetch) for governance fields including the Due date field, assignee, and description. Use when the user asks to review RHEA epics, sprint planning hygiene, missing due dates on epics, epic health, or Jira epic checks through MCP.
---

# Jira epic checks (MCP)

## Defaults (RHEA)

- **Project key:** `RHEA` — use `project = RHEA` in JQL unless the user names another project.
- **Due date (field):** In Jira’s UI this is **Due date**. In JQL and the REST `fields` list, the built-in field is almost always **`duedate`**. If `duedate` is missing or always empty for RHEA epics, call `get_issue_field_names` on a sample epic and locate the entry whose **name** is `Due date`; use its **id** (often `customfield_…`) in `fields` and in any JQL that references that custom field.

## Server and tools

- **MCP server id:** `user-jira-mcp-server`
- **Before any MCP call:** Read the tool descriptor under the workspace `mcps/user-jira-mcp-server/tools/<tool>.json` to confirm argument names and types.
- **Primary tools:**
  - `search_issues_by_jql` — list epics with JQL; optional `fields` list limits payload size.
  - `get_issue` — full details for one epic key when search results are thin or you need nested/metadata fields.
  - `get_issue_field_names` — discover field **ids** when the UI label “Due date” maps to a custom field, or for other RHEA-specific fields before interpreting or updating.

## Workflow

1. **Clarify scope** if missing: default **project = RHEA**; confirm which statuses count as “active,” and whether the user wants **read-only** reporting or follow-up edits (edits only if they explicitly ask).
2. **Epic JQL** — always use `project = RHEA` unless the user specifies otherwise. Examples (adjust status names if your site differs):

   ```text
   project = RHEA AND type = Epic AND statusCategory != "Done"
   ```

   ```text
   project = RHEA AND type = Epic AND duedate is EMPTY
   ```

   ```text
   project = RHEA AND type = Epic AND duedate < endOfDay()
   ```

3. **Search** — call `search_issues_by_jql` with `jql_query` and sensible `max_results` (≤ 100). Include `fields` tailored to the audit, e.g.:

   `["summary", "status", "assignee", "duedate", "priority", "labels", "updated"]`

   If **Due date** data does not show up as `duedate`, use `get_issue` / `get_issue_field_names` on a RHEA epic to resolve the correct field id for “Due date” and retry search or reporting using that id.

4. **Deep pass** — for epics that fail checks or need narrative fields, call `get_issue` with `issue_key`.

5. **Report** — group findings: missing due date, past due, unassigned, empty description, stale `updated`, etc. Include **issue key**, **summary**, **URL** when present, and **recommended next action** (e.g. set due date), not vague advice.

## Default “elements” checklist

Apply what the user asked for; default epic governance:

| Element | Pass | Common JQL hint |
|--------|------|------------------|
| Due date | **Due date** populated (check `duedate` first; else id from `get_issue_field_names`) | `duedate is EMPTY` / `duedate < startOfDay()` on `project = RHEA AND type = Epic` |
| Assignee | assignee set for owned epics | `assignee is EMPTY` |
| Description | non-empty description where team requires it | validate in `get_issue` body |
| Status | matches user’s definition of active/done | filter in JQL or in report |

Extend the table for org rules (components, fix version, story points on epic, links to parent initiative, etc.).

## Errors and auth

If MCP returns an error or empty results unexpectedly, say what failed, do not invent issues, and suggest verifying Jira permissions and MCP session/auth configuration for `user-jira-mcp-server`.
