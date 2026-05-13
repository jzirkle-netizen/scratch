# Jira epic check skill — evaluation run

This document records **live executions** of the **JIRA-EPIC-CHECK** / **jira-epic-check** skill against Jira using the **`user-jira-mcp-server`** MCP, plus **issues found**, **fixes applied** in this repo, and **whether behavior is acceptable after the fix**.

Use **[CONTEXT.md](CONTEXT.md)** for org phrases → **`PROJECT_KEY`** (e.g. Enterprise Architecture → **`RHEA`**, CBP Sales Planning Transformation → **`SPT`**).

---

## Run 1 — Enterprise Architecture (`RHEA`)

### Run parameters (pinned)

| Parameter | Value |
|-----------|--------|
| **Project (CONTEXT)** | Enterprise Architecture → **`RHEA`** |
| **Epic scope JQL** | `project = RHEA AND type = Epic AND statusCategory != "Done" ORDER BY key ASC` |
| **`LIST1_DAYS`** / **`LIST2_DAYS`** | `90` / `90` |
| **`audit_now` (UTC)** | `2026-05-13T20:16:13Z` |
| **`cutoff_L1` / `cutoff_L2`** | `2026-02-12T20:16:13Z` |

**Scope size:** **80** epics returned (single page).

### MCP tool smoke tests

| Step | Tool | Arguments / intent | Result |
|------|------|-------------------|--------|
| 1 | `search_issues_by_jql` | Epic scope JQL, `max_results=100`, `fields` including `duedate` | **Pass** — `status: success`, 80 epics |
| 2 | `get_issue` | `RHEA-4246`, `RHEA-4420`, `RHEA-4264` | **Pass** |
| 3 | `get_issue_links` | Same three keys | **Pass** |
| 4 | `get_issue_comments` | `RHEA-4264`, `RHEA-4246`, `RHEA-1956` | **Pass** |
| 5 | `search_issues_by_jql` (child probe) | `project = RHEA AND ("Epic Link" = RHEA-4420 OR parent = RHEA-4420)` | **Pass** — 2 children |

### Skill logic checks (samples)

- **A — `RHEA-4264` comments vs `cutoff_L1`:** Recent comments → List 1 Comments row **passes** as expected.
- **B — `RHEA-4420` links vs children:** 0 links, 2 children → Related work **passes** as expected.
- **C — `duedate` omitted in search rows:** Confirmed; mitigated by **INSTRUCTIONS** step 3 (JQL / `get_issue`). See **Issues, fixes** below (#1).
- **D — `RHEA-1956` List 2 sample:** `updated` and all comments before **`cutoff_L2`** → matches List 2 rules.

---

## Run 2 — CBP Sales Planning Transformation (`SPT`)

### Run parameters (pinned)

| Parameter | Value |
|-----------|--------|
| **Project (CONTEXT)** | **CBP Sales Planning Transformation** → **`SPT`** ([CONTEXT.md](CONTEXT.md)) |
| **Epic scope JQL** | `project = SPT AND type = Epic AND statusCategory != "Done" ORDER BY key ASC` |
| **`LIST1_DAYS`** / **`LIST2_DAYS`** | `90` / `90` |
| **`audit_now` (UTC)** | `2026-05-13T20:34:23Z` |
| **`cutoff_L1` / `cutoff_L2`** | `2026-02-12T20:34:23Z` |

**Scope size:** **27** epics returned (under the 100-issue page cap).

**Jira project display name (sanity):** `get_issue` on **`SPT-4418`** returned `project.name`: **CBP Sales Planning Transformation** — matches CONTEXT mapping.

### MCP tool smoke tests (`SPT`)

| Step | Tool | Arguments / intent | Result |
|------|------|-------------------|--------|
| 1 | `search_issues_by_jql` | Epic scope JQL, `max_results=100`, `fields` including `duedate`, `customfield_10517` | **Pass** — `status: success`, 27 epics; `custom_fields.blocked` present on rows |
| 2 | `get_issue_field_names` | `SPT-629` | **Pass** — **`customfield_10517`** = **Blocked**, **`customfield_10014`** = **Epic Link**, **`duedate`** = **Due date** (same ids as RHEA calibration; org-wide fields) |
| 3 | `get_issue` | `SPT-4418`, `SPT-2788` | **Pass** — payloads include `children_count`, `issue_link_count`, `custom_fields.blocked` |
| 4 | `get_issue_links` | `SPT-4418` | **Pass** — 2 links (`Cloners`, `Depend`) |
| 5 | `get_issue_comments` | `SPT-4418`, `SPT-2788`, `SPT-3546` | **Pass** — **0** comments where sampled (valid empty `result`); no API errors |
| 6a | `search_issues_by_jql` (child probe) | `project = SPT AND ("Epic Link" = SPT-2788 OR parent = SPT-2788)` | **Pass** — **0** issues (expected: **`get_issue`** shows **`children_count` = 0** for `SPT-2788`) |
| 6b | `search_issues_by_jql` (child probe) | `project = SPT AND ("Epic Link" = SPT-4418 OR parent = SPT-4418)` | **Pass** — **≥1** child (e.g. `SPT-4969`, …) |
| 7 | `search_issues_by_jql` | `key = SPT-4418`, `fields` = `["duedate"]` | **Pass** — row shape still thin (same MCP caveat as RHEA); **`key = SPT-4418 AND duedate is not EMPTY`** → **0** rows → **Due date empty** for that epic at query time |
| 8 | `search_issues_by_jql` (List 2 seed) | `project = SPT AND type = Epic AND statusCategory != "Done" AND updated < "2026-02-13"` | **Pass** — **0** epics (no errors; likely **empty List 2** candidate set at this window) |

### Skill logic notes (`SPT`)

- **`SPT-4418`:** **2** issue links → Related work row **passes** on links alone. **0** comments → List 1 **Comments** row **fails** (no `created` > **`cutoff_L1`**). **`duedate` not empty** JQL returned **0** → Due date row **fails** if empty is the rule. **`updated`** in May 2026 → **not** List 2 / Untouched vs **`cutoff_L2`**.
- **`SPT-2788`:** **`children_count` = 0**, **`issue_link_count` = 2** → child JQL correctly empty; links satisfy related work. **0** comments in API sample.

**Conclusion (Run 2):** No MCP auth, JQL parse, or tool failures for **`SPT`**. Empty child JQL for an epic with **no** children is **expected**, not a defect.

---

## Issues, fixes, and post-fix status

| # | Symptom | Severity | Fix | Pass after fix? |
|---|---------|----------|-----|-----------------|
| 1 | `search_issues_by_jql` rows often **omit `duedate`** even when requested in `fields`; invalid field id **`custom_fields`** in `fields` also yields sparse rows | Medium | **INSTRUCTIONS** step **3** + sync to **`.cursor/skills/JIRA-EPIC-CHECK/JIRA-EPIC-CHECK.md`** | **Yes** (RHEA + SPT runs) |
| 2 | None new for **`SPT`** | — | No repo change required for Run 2 | **Yes** |

---

## Out of scope

- Full List 1 / List 2 enumeration for every epic in **RHEA** or **SPT** (large `get_issue_links` / `get_issue_comments` volume).
- Editing Jira data.

---

## Summary

| Run | Project | MCP + JQL | Notable |
|-----|---------|-----------|---------|
| 1 | **`RHEA`** | **Pass** | `duedate` search caveat; calibration keys behaved per skill |
| 2 | **`SPT`** (CBP Sales Planning Transformation) | **Pass** | CONTEXT → **`SPT`** validated; Blocked **`customfield_10517`** matches field discovery; child JQL aligns with **`children_count`** |
