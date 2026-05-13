# Jira epic check skill — evaluation run

This document records a **live execution** of the **JIRA-EPIC-CHECK** / **jira-epic-check** skill against Jira using the **`user-jira-mcp-server`** MCP, plus **issues found**, **fixes applied** in this repo, and **whether behavior is acceptable after the fix**.

## Run parameters (pinned for this evaluation)

| Parameter | Value |
|-----------|--------|
| **Project (CONTEXT)** | Enterprise Architecture → **`RHEA`** |
| **Epic scope JQL** | `project = RHEA AND type = Epic AND statusCategory != "Done" ORDER BY key ASC` |
| **`LIST1_DAYS`** | `90` |
| **`LIST2_DAYS`** | `90` |
| **`audit_now` (UTC)** | `2026-05-13T20:16:13Z` (from host clock at run time) |
| **`cutoff_L1` / `cutoff_L2`** | `2026-02-12T20:16:13Z` (90 days before **`audit_now`**) |

**Scope size:** `search_issues_by_jql` returned **80** open (not Done) epics — under the **100**-issue page cap, so **no second pagination page** was required.

## MCP tool smoke tests

| Step | Tool | Arguments / intent | Result |
|------|------|-------------------|--------|
| 1 | `search_issues_by_jql` | Epic scope JQL, `max_results=100`, `fields` including `duedate` | **Pass** — `status: success`, 80 epics returned |
| 2 | `get_issue` | `RHEA-4246`, `RHEA-4420`, `RHEA-4264` | **Pass** — full payloads (incl. `custom_fields.blocked`, children counts) |
| 3 | `get_issue_links` | Same three keys | **Pass** — `RHEA-4246` has 1 link; `RHEA-4420` / `RHEA-4264` have 0 links |
| 4 | `get_issue_comments` | `RHEA-4264`, `RHEA-4246`, `RHEA-1956` | **Pass** — comment `created` / `updated` present |
| 5 | `search_issues_by_jql` (child probe) | `project = RHEA AND ("Epic Link" = RHEA-4420 OR parent = RHEA-4420)` | **Pass** — 2 child issues (`RHEA-4427`, `RHEA-4399`) |

**Conclusion:** All exercised MCP operations **succeeded** (no auth or transport errors in this environment).

## Skill logic checks (calibration-style)

### A — Comments vs List 1 cutoff (`RHEA-4264`)

- Latest comment **`created`:** `2026-05-06T16:03:05.474+0000` (strictly **after** **`cutoff_L1`** `2026-02-12`).
- **Expected:** List 1 **Comments** row **passes** (recent discussion); epic must **not** qualify for **List 1 / Problematic** on comments alone.
- **Observed:** Matches expectation.

### B — `RHEA-4420` issue links vs children (related work)

- **`get_issue_links`:** 0 links.
- **Child JQL:** 2 issues returned under the epic.
- **Expected:** **Related work** row **passes** (children count even when links are empty).
- **Observed:** Matches expectation (validates **List 1** related-work rule).

### C — Due date signal when search payload omits `duedate`

- **Observation:** For `key = RHEA-4246` and `key = RHEA-1956`, `search_issues_by_jql` **did not include a `duedate` property** on rows even when `fields` explicitly requested **`duedate`**. JQL probes `key = RHEA-4246 AND duedate is not EMPTY` and `key = RHEA-1956 AND duedate is not EMPTY` both **returned the issue**, proving **Due date is populated** in Jira while the search row shape stays thin.
- **Risk:** An agent might mis-score **Due date** as empty if it trusts only the search row.
- **Fix applied (repo):** **`agentskills/jira-epic-check/references/INSTRUCTIONS.md`** step **3** (and synced **`.cursor/skills/JIRA-EPIC-CHECK/JIRA-EPIC-CHECK.md`**) now states this **MCP caveat** and requires **JQL `duedate` probes** or **`get_issue`** before scoring the Due date row.

### D — List 2 / Untouched spot check (`RHEA-1956`)

- **`updated`:** `2023-05-23T18:19:34.697+0000` — strictly **before** **`cutoff_L2`**.
- **Comments:** newest `created` is `2023-05-23T18:19:34.697+0000` — strictly **before** **`cutoff_L2`**.
- **Expected:** Eligible for **List 2 / Untouched** (subject to full four-row List 1 scoring not being the goal here).
- **Observed:** Matches List 2 staleness rules for this key at this **`audit_now`**.

## Issues, fixes, and post-fix status

| # | Symptom | Severity | Fix | Pass after fix? |
|---|---------|----------|-----|-----------------|
| 1 | `search_issues_by_jql` rows often **omit `duedate`** even when requested in `fields`; invalid field id **`custom_fields`** in `fields` also yields sparse rows | Medium — could cause false **Due date** failures | Documented caveat + mandatory **JQL / `get_issue`** confirmation in **INSTRUCTIONS** step 3; removed reliance on invalid `fields` entries in this run | **Yes** — procedure is sound; JQL `duedate is not EMPTY` / `is EMPTY` **still works** after doc change (MCP unchanged, operator guidance fixed) |

## Out of scope for this evaluation

- **Full List 1 enumeration** across all **80** epics (would require **per-epic** `get_issue_links`, child JQL when empty, and `get_issue_comments` — hundreds of MCP calls). This run **validated MCP + representative rules** only.
- **Editing Jira data** — read-only verification.

## Summary

| Area | Status |
|------|--------|
| MCP connectivity & core tools | **Pass** |
| List 1 comment recency rule (sample) | **Pass** |
| List 1 related work (links + children) | **Pass** |
| List 2 staleness (sample) | **Pass** |
| Search payload `duedate` omission | **Mitigated** via skill doc update (**fix #1**) |
