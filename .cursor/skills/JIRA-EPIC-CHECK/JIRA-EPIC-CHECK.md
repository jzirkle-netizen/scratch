---
name: JIRA-EPIC-CHECK
description: Finds Jira Epics in a user-specified project (or JQL scope) that simultaneously fail every applicable governance check (Due date, Blocked, missing related work — issue links or epic children, comment recency vs a configurable List 1 window), plus a second list of epics with no governance-relevant activity in a configurable List 2 window. Runtime parameters PROJECT_KEY, LIST1_DAYS, LIST2_DAYS (defaults 90/90). Use with user-jira-mcp-server.
---

> **Org vocabulary:** [CONTEXT.md](CONTEXT.md) in this folder — Enterprise Architecture ↔ example Jira project, **Problematic JIRA** ↔ List 1, **Untouched JIRA** ↔ List 2.

﻿# Jira epic checks (MCP)

## Runtime parameters (resolve first)

Before any JQL or scoring, pin these (ask the user if missing). For org nicknames (“Enterprise Architecture”, “Problematic JIRA”, “Untouched JIRA”), read **[CONTEXT.md](CONTEXT.md)**.

| Parameter | Meaning | Default if unstated |
|-----------|---------|---------------------|
| **`PROJECT_KEY`** | Jira project key for `project = …` in fragments (e.g. `RHEA`, `PROJ`). | **Ask**; do not guess. If the user only names an org phrase, map per **CONTEXT.md** (e.g. Enterprise Architecture → `RHEA` when that is the agreed mapping). |
| **Epic scope JQL** | Full JQL selecting epics to score (must include epics only). | Default pattern: `project = <PROJECT_KEY> AND type = Epic AND statusCategory != "Done"` — substitute **`<PROJECT_KEY>`**. |
| **`LIST1_DAYS`** | Rolling window (days) for **List 1 / Problematic**: **Comments** row uses **`cutoff_L1` = `audit_now` − `LIST1_DAYS`**. | `90` |
| **`LIST2_DAYS`** | Rolling window (days) for **List 2 / Untouched**: staleness uses **`cutoff_L2` = `audit_now` − `LIST2_DAYS`**. | `90` |
| **`audit_now`** | Instant used as “now” for cutoffs (e.g. session date). | User/session context; default treat as **UTC** unless the user specifies timezone. |
| **Timezone / `startOfDay`** | How calendar boundaries align with ISO instants. | **UTC**; apply **`startOfDay`** the same way to **`audit_now`**, **`cutoff_L1`**, and **`cutoff_L2`** if used. |

**Two cutoffs:** **`cutoff_L1`** applies **only** to List 1 comment recency. **`cutoff_L2`** applies **only** to List 2 inactivity (issue **`updated`** + comments). If **`LIST1_DAYS` = `LIST2_DAYS`**, the numeric cutoffs coincide, but still label them in reports so stakeholders see which rule is which.

**Pagination:** `ORDER BY key ASC` plus `AND key > "<ISSUE_KEY>"` using the **last key from the previous page** if a `search_issues_by_jql` page returns **100** issues; repeat until a page has fewer than 100.

---

## Goal (default)

**Primary deliverable (List 1 / Problematic):** Epics in scope for which **every applicable row** in the **Default “elements” checklist** **fails** at the same time (**logical AND**).

**Secondary deliverable (List 2 / Untouched):** Epics in the **same scope** where **no** governance-relevant activity appears in the rolling **`LIST2_DAYS`** window before **`audit_now`** (see **Secondary deliverable (List 2 — Untouched)** below).

- **Scope:** Use the **Epic scope JQL** (with **`PROJECT_KEY`** as needed). Include **every** matching epic—**paginate** as above.
- **Calibration vs. scope:** Sample keys (e.g. **`RHEA-4246`**, **`RHEA-4420`**, **`RHEA-4264`**) appear in this file to illustrate **field ids and payload shapes** for a **calibrated** site. They **must not** limit scoring unless the user narrows scope to those keys.
- **Applicable rows (default AND for List 1):** **Due date**, **Related work** (issue links **or** epic children), **Blocked**, **Comments** (recency vs **`cutoff_L1`**). **Assignee** and **Description** stay **out** unless the user adds them. **Status** is usually implied by JQL; add a Status row to the AND only if the user defines it inside that scope.
- **Different outcomes** (e.g. fail-**any**): follow the user; this document’s default remains **fail-all AND** for List 1.

### Secondary deliverable (List 2 — Untouched)

**List 2:** Epics in the **same scope** where **none** of the **checked dimensions** show activity in the **rolling `LIST2_DAYS`-day** window ending at **`audit_now`**.

- **`cutoff_L2`:** **`audit_now` − `LIST2_DAYS`** (same timezone policy as List 1). Keep **`audit_now`** and **`cutoff_L2`** at the **same** granularity if using **`startOfDay`**.
- **Comments row (List 1) vs. List 2 staleness (do not conflate):**
  - **List 1 — Comments row:** **`cutoff_L1` = `audit_now` − `LIST1_DAYS`**. **Pass** iff **at least one** comment has **`created` strictly after `cutoff_L1`** (or **`updated` > `cutoff_L1`** when your org uses that for the row). **Fail** iff **no** such comment (**all** **`created` on or before `cutoff_L1`**, or **zero** comments). **Report template:** state **`LIST1_DAYS`**, print **`cutoff_L1`**, then: comments **on or before `cutoff_L1`** are stale for this row; the row **passes** if **any** comment has **`created` strictly after `cutoff_L1`**.
  - **List 2 — Untouched:** **No** governance-relevant activity in the last **`LIST2_DAYS`**: epic **`updated` strictly before `cutoff_L2`** and **every** comment’s **`created` strictly before `cutoff_L2`** (and comment **`updated` < `cutoff_L2`** when present). A recent comment **after `cutoff_L2`** excludes the epic from List 2 even if List 1’s **`cutoff_L1`** differs.
- **What “activity” means for List 2 (MCP limits):** No per-field changelog in this MCP set. Operational rules (all vs **`cutoff_L2`**):
  1. **Issue `updated`** — from `search_issues_by_jql` / `get_issue`, must be **strictly before `cutoff_L2`**.
  2. **Comments (List 2 only)** — from **`get_issue_comments`**, **every** **`created` < `cutoff_L2`**; if comment **`updated`** exists, **every** **`updated` < `cutoff_L2`**.
  3. **Issue links** — no per-link modified time in **`get_issue_links`**; link churn usually bumps issue **`updated`**; state the limitation if the user needs exact link dates.

- **Include on List 2 iff** (1) and (2) hold.
- **JQL shortcut:** e.g. `project = <PROJECT_KEY> AND type = Epic AND statusCategory != "Done" AND updated < -<LIST2_DAYS>d` — align **`-Nd`** with the same **`audit_now`** / policy as **`cutoff_L2`**, then **confirm** comments with **`get_issue_comments`**.

## Defaults (project-agnostic + RHEA calibration)

- **`PROJECT_KEY`:** Always substitute the resolved key (never hardcode unless the user fixed scope to one project).
- **Due date:** Prefer built-in **`duedate`** in JQL/REST. **RHEA calibration (`RHEA-4246`):** **`duedate`** is **Due date**; do not swap in **Target start/end** (`customfield_10022` / `customfield_10023`) unless the user redefines “due date”. Other sites: run **`get_issue_field_names`** on a sample epic.
- **Blocked:** Discover id via **`get_issue_field_names`**. **RHEA:** **`customfield_10517`**, `custom_fields.blocked` often **`"True"`** / **`"False"`**. **List 1 — Blocked row:** **fail** on false/unchecked; **pass** on true/checked. **Blocked Reason** on RHEA: `customfield_10483` (`blocked_reason`).
- **Comments (List 1):** Use **`get_issue_comments`**; **`cutoff_L1`** as above. Do **not** infer List 1 pass/fail from issue **`updated`** alone.

## Server and tools

- **MCP server id:** `user-jira-mcp-server`
- **Before any MCP call:** Read `mcps/user-jira-mcp-server/tools/<tool>.json` for argument names/types.
- **Primary tools:**
  - `search_issues_by_jql` — epics + child probe: `project = <PROJECT_KEY> AND ("Epic Link" = <EPIC_KEY> OR parent = <EPIC_KEY>)`, `max_results` ≥ **1** when **`get_issue_links`** is empty. Resolve **Epic Link** with **`get_issue_field_names`** if JQL errors.
  - `get_issue`, `get_issue_field_names`, `get_issue_links`, `get_issue_link_types` (optional), `get_issue_comments`

## Workflow

1. **Clarify** **`PROJECT_KEY`**, **Epic scope JQL**, **`LIST1_DAYS`**, **`LIST2_DAYS`**, **`audit_now`**, timezone. Confirm read-only vs edits. Map stakeholder terms via **[CONTEXT.md](CONTEXT.md)**. **List 1 — Related work:** pass if **`get_issue_links`** has **≥1** link **or** child JQL returns **≥1** issue. **List 1 — Comments:** **`cutoff_L1`**; pass iff **some** **`created` > `cutoff_L1`**. **List 2:** **`cutoff_L2`**; requires **`updated` < `cutoff_L2`** and **all** comments before **`cutoff_L2`**.
2. **Epic JQL** — examples (replace **`<PROJECT_KEY>`**, **`<EPIC_KEY>`**, field ids from discovery):

   ```text
   project = <PROJECT_KEY> AND type = Epic AND statusCategory != "Done"
   ```

   ```text
   project = <PROJECT_KEY> AND type = Epic AND duedate is EMPTY
   ```

   ```text
   project = <PROJECT_KEY> AND type = Epic AND duedate < endOfDay()
   ```

   ```text
   project = <PROJECT_KEY> AND type = Epic AND customfield_10517 = false
   ```

   (Last: **RHEA** Blocked unchecked narrowing only—replace **`customfield_10517`** after `get_issue_field_names` on the target project.)

   ```text
   project = <PROJECT_KEY> AND ("Epic Link" = <EPIC_KEY> OR parent = <EPIC_KEY>)
   ```

   ```text
   project = <PROJECT_KEY> AND type = Epic AND statusCategory != "Done" AND updated < -<LIST2_DAYS>d
   ```

3. **Search** — `search_issues_by_jql`, `max_results` ≤ 100, `fields` e.g. `["summary", "status", "duedate", "priority", "labels", "updated", "<blocked_field_id>"]` (discover blocked field per project).
4. **Deep pass** — **`get_issue`** when payloads omit **`duedate`**, Blocked, or narrative context. List 1 still needs step 6 child search when links are empty.
5. **Blocked (List 1)** — per-epic pass/fail from payload; bulk JQL optional with discovered field id.
6. **Related work (List 1)** — (1) **`get_issue_links`** ≥ 1 → pass; (2) else child JQL with **`<PROJECT_KEY>`** and **`<EPIC_KEY>`**; (3) both empty → fail. Fix JQL on **`Epic Link`** errors before failing.
7. **Comments — `get_issue_comments`** once per epic. Compute **`cutoff_L1`** and **`cutoff_L2`** from **`audit_now`**.
   - **7A List 1:** **Pass** iff **any** **`created` > `cutoff_L1`** (strict ISO). **Fail** if **none** or zero comments.
   - **7B List 2 prep:** Do **not** use 7A for List 2. List 2 uses **`cutoff_L2`** in step 9.
   - **Calibration (`RHEA-4246`):** sample **`body`** text exists in prior runs for parser checks.
8. **List 1 intersection** — **Primary list** = all applicable rows **fail** (Due date empty fails; Blocked unchecked fails for List 1 rule; Related work empty fails; Comments fail on 7A). Any row **pass** → exclude from List 1.
9. **List 2 (Untouched)** — Use **`cutoff_L2`**. Include epic iff **`updated` < `cutoff_L2`** **and** **every** comment **`created` < `cutoff_L2`** (and **`updated` < `cutoff_L2`** on comments when present). Optional JQL seed with **`-<LIST2_DAYS>d`** aligned to **`cutoff_L2`**; always confirm comments.
10. **Report** — **(1) List 1 / Problematic:** keys, summary, URL, per-row notes; state **`LIST1_DAYS`** and **`cutoff_L1`** for Comments. **(2) List 2 / Untouched:** keys, summary, URL, **`updated`**, **`LIST2_DAYS`**, **`cutoff_L2`**; note **`updated`** proxy limits for fields without history.

## Default “elements” checklist (List 1)

| Element | Pass | JQL hint (parameterized) |
|--------|------|--------------------------|
| Due date | **`duedate`** populated (per site discovery) | `project = <PROJECT_KEY> AND type = Epic AND duedate is EMPTY` |
| Status | per user | in JQL or report |
| Related work | **`get_issue_links`** ≥ 1 **or** child JQL ≥ 1 | `project = <PROJECT_KEY> AND ("Epic Link" = <EPIC_KEY> OR parent = <EPIC_KEY>)` |
| Blocked (List 1) | Blocked checked per payload / discovered field | narrow with project’s false/unchecked JQL if available |
| Comments (List 1) | **Any** **`created` > `cutoff_L1`** | use **`get_issue_comments`**; state **`LIST1_DAYS`** |

### List 2 (not fail-all scoring)

| Criterion | On List 2 iff | MCP |
|-----------|----------------|-----|
| Issue activity | **`updated` < `cutoff_L2`** | search / `get_issue` |
| Comment activity | **Every** **`created` < `cutoff_L2`**; every **`updated` < `cutoff_L2`** if present | **`get_issue_comments`** |

If link **types** matter, filter **`get_issue_links`** after **`get_issue_link_types`**. Children from step 6 still satisfy **Related work** for List 1 unless the user restricts types.

## Errors and auth

On MCP errors, report what failed, do not fabricate issues, and suggest Jira permissions / MCP auth for `user-jira-mcp-server`.
