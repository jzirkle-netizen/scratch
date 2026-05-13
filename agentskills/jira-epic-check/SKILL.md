---
name: jira-epic-check
description: Finds Jira Epics in project RHEA (via user-jira-mcp-server) that simultaneously fail every applicable governance check (Due date, Blocked, missing related work — issue links or epic children, 90-day comment recency), plus a second list of epics with no governance-relevant activity in the last 90 days (issue updated and comment timestamps). Use for RHEA epic hygiene, stale epics, sprint planning, blocked epics, linked issues, or MCP-driven epic audits.
compatibility: Requires an Agent Skills-compatible agent, user-jira-mcp-server MCP, Jira access to project RHEA, and network access to Jira.
metadata:
  version: "1.0"
  cursor-equivalent-folder: "JIRA-EPIC-CHECK"
  specification: "https://agentskills.io/specification"
---

# Jira epic checks (MCP)

## Goal (default)

**Primary deliverable:** The set of epics in scope for which **every applicable row** in the **Default “elements” checklist** **fails** at the same time (**logical AND** of failures: the epic misses **all** those pass criteria simultaneously).

**Secondary deliverable (same run):** The **stale 90-day** list defined under **Secondary deliverable (stale 90 days — default)** below.

- **Scope:** Default JQL `project = RHEA AND type = Epic AND statusCategory != "Done"` (or the user’s substitute). Include **every** matching epic—**paginate** (`ORDER BY key ASC` plus `AND key > "RHEA-XXXX"` using the last key from the previous page) if a `search_issues_by_jql` page hits **100** results, until no more keys.
- **Calibration vs. scope:** Keys like **`RHEA-4246`** appear in this file only to confirm **field ids and payload shapes** (Due date, Blocked, comments, etc.). **`RHEA-4420`** illustrates **epic child issues** vs **`get_issue_links`** (children may exist while issue links are empty). They **must not** be treated as the only epics to score unless the user explicitly narrows scope to those keys.
- **Applicable rows:** Default AND uses **Due date**, **Related work (issue links **or** epic child issues)**, **Blocked**, and **Comments (90-day recency)**. **Assignee** and **Description** are intentionally **not** part of the default fail-all gate (unreliable or noisy for this workflow—re-add only if the user explicitly asks). **Status** is usually **excluded** from the AND when scope is already defined by status in JQL; add Status to the AND only if the user gives an explicit rule inside that scope.
- **If the user wants a different outcome** (e.g. epics failing **any** check, or only Blocked + related work): follow their wording; the default remains **fail-all AND**.

### Secondary deliverable (stale 90 days — default)

**Second list:** Epics in the **same scope** as the primary goal where **none** of the **checked dimensions** show activity in the **rolling last 90 days** (same **`cutoff`** = **`audit_now` − 90 days`** as workflow step 7, default **UTC** unless the user specifies timezone policy).

- **Cutoff instant (shared):** **`cutoff` = `audit_now` − 90 days** (same as workflow step 7), default **UTC** unless the user specifies otherwise. When using **startOfDay**, compute **`audit_now`** and **`cutoff`** at the **same** granularity so comparisons stay consistent.
- **Comments checklist row vs. stale list (do not conflate):**
  - **Comments row (default checklist / primary fail-all — recency):** **`cutoff` = `audit_now` − 90 days**. The epic **passes** this row iff **at least one** comment has **`created` strictly after `cutoff`** (i.e. **less than ~90 days** before **`audit_now`** — **recent** discussion exists). The epic **fails** iff **no** comment satisfies that (**every** comment has **`created` on or before `cutoff`**, inclusive — all **stale**), **or** there are **zero** comments. Apply the same **strictly after vs. on-or-before** split to comment **`updated`** when scoring the row (**pass** if **any** **`updated` > cutoff** when that field is present and you use it for this row; otherwise derive from **`created`** per your org rule). **Why this fixes false positives (e.g. `RHEA-4264`):** a comment on **2026-05-06** with **`cutoff`** **2026-02-12T00:00:00.000+0000** has **`created` > cutoff** → row **passes** → epic is **excluded** from **list 1** (primary fail-all) because not **every** row fails. **Report:** start with the user’s cutoff line, then append the row outcome: `90-day cutoff (UTC): <ISO cutoff> — comments with created on or before this instant are stale (≥90 days old relative to audit_now). The Comments row passes if at least one comment has created strictly after this instant; otherwise the row fails.`
  - **Secondary stale list:** **No** governance-relevant activity in the **last** 90 days: **`updated` < cutoff** and **every** comment’s **`created` < cutoff** (and comment **`updated` < cutoff** when present). Example: **`RHEA-4264`** with **2026-05-06** vs **`cutoff` `2026-02-12`** — comment is **after** cutoff → **not** eligible for this stale-only cohort.
- **What “activity” means (MCP limits):** This MCP set does **not** expose per-field history (no changelog tool). Use this **operational definition** for the **secondary stale list** (same **`cutoff`** as workflow step 7 unless the user specifies otherwise):
  1. **Issue `updated`** — from `search_issues_by_jql` / `get_issue`, the epic’s top-level **`updated`** must be **strictly before** the cutoff. This row is **only** the issue’s **`updated`** timestamp, not comment bodies. In Jira, edits to **Due date**, **Blocked**, **issue links**, and most other fields bump **`updated`**, so this is the **proxy** for “those fields did not change” in the window.
  2. **Comments (stale list only)** — from **`get_issue_comments`**, **every** comment’s **`created`** must be **strictly before** **`cutoff`** (same as “**older** than the rolling 90-day window”). When **`updated`** exists on a comment, require **`updated` < cutoff** the same way. *Normally* a new comment also refreshes issue **`updated`**; the explicit comment pass catches edge cases. (Equivalent negative form: **no** comment with **`created` ≥ cutoff** and **no** comment with **`updated` ≥ cutoff** when `updated` is present.) **List 1 Comments row** uses the **recency** rule in **Comments checklist row vs. stale list** (pass = **any** **`created` > cutoff**), not this bullet.
  3. **Issue links** — there is **no** link-level “last modified” in **`get_issue_links`**. Link adds/removes almost always change issue **`updated`**; rely on (1) and state this **limitation** in the report if the user needs exact link-change dates.

- **Include on second list iff** (1) **and** (2) are satisfied for that epic.
- **JQL shortcut (initial filter):** After pagination, you can pre-filter with e.g. `project = RHEA AND type = Epic AND statusCategory != "Done" AND updated < -90d` (adjust `-90d` / `startOfDay()` to match the same cutoff policy as comments), then **confirm** (2) with **`get_issue_comments`** for each candidate (or for epics near the cutoff). Do not skip the comment pass solely on `updated` if the user asked for strictness.

## Defaults (RHEA)

- **Project key:** `RHEA` — use `project = RHEA` in JQL unless the user names another project.
- **Due date (field):** For RHEA, the UI field **Due date** (the one teams use for “when is this epic due?”) is the **built-in** Jira field **`duedate`** — JQL id **`duedate`**, REST id **`duedate`**. **Calibration (`RHEA-4246`):** `get_issue_field_names` lists **`duedate`** with name **Due date**; JQL `key = RHEA-4246 AND duedate = "2026-05-15"` matches (May 15, 2026 is stored there). **Do not** substitute **Target start** / **Target end** (`customfield_10022` / `customfield_10023`, often exposed in MCP as `target_start` / `target_end`) for this audit unless the user explicitly redefines “due date” — on **`RHEA-4246`** those targets can differ from **Due date** (e.g. target window vs. `duedate`). If a site maps UI “Due date” to a custom field instead, use `get_issue_field_names` on a known epic and prefer that field id in `fields` and JQL.
- **Blocked (field):** In Jira’s UI this is **Blocked** (checkbox). On the RHEA project as modeled on sample epic **`RHEA-4246`** (known **Blocked** checked for payload calibration), `get_issue_field_names` maps it to **`customfield_10517`**. In `get_issue` results, expect a string under `custom_fields.blocked` such as **`"True"`** when the checkbox is set and **`"False"`** when cleared. **Primary (fail-all) list — Blocked row:** **fail** when **`"False"`** or boolean **`false`** (or cleared / absent if your site stores “unchecked” that way); **pass** when **`"True"`** or boolean **`true`**. (This is the **list one** rule only; do not invert for other user-defined deliverables unless they say so.) If the id or shape differs on another site, re-resolve with `get_issue_field_names` / `get_issue` on a known epic with the box checked and unchecked. Optional context: **Blocked Reason** is `customfield_10483` (`blocked_reason` in `custom_fields`) — cite when reporting failures.
- **Comments (90-day recency — list 1):** For **primary fail-all** scoring, **`cutoff` = `audit_now` − 90 days** (see **Secondary deliverable** for **`audit_now`** / timezone). **Pass** this row if **at least one** comment has **`created` strictly after `cutoff`** (recent: **< ~90 days** old at **`audit_now`**). **Fail** if **every** comment has **`created` on or before `cutoff`** (all stale) **or** there are **no** comments. When reporting, print the cutoff, then that **stale** comments are **on or before** **`cutoff`**, and that the **row passes** iff **some** comment is **strictly after** **`cutoff`** (see **Comments checklist row vs. stale list** template). Do **not** infer this from issue **`updated`** alone; use **`get_issue_comments`**. On **`RHEA-4246`**, `get_issue_comments` returns plain-text **`body`** values (see **workflow step 7** for a verbatim example). **Calibration — `RHEA-4264`:** if **`get_issue_comments`** shows **any** **`created` > cutoff**, the Comments row **passes** and the epic must **not** appear on **list 1** unless you miscomputed **`cutoff`** / **`audit_now`** or mis-parsed ISO timestamps / offsets.

## Server and tools

- **MCP server id:** `user-jira-mcp-server`
- **Before any MCP call:** Read the tool descriptor under the workspace `mcps/user-jira-mcp-server/tools/<tool>.json` to confirm argument names and types.
- **Primary tools:**
  - `search_issues_by_jql` — list epics with JQL; optional `fields` list limits payload size. **Also** use it for **related work (list 1)**: `project = RHEA AND ("Epic Link" = <EPIC_KEY> OR parent = <EPIC_KEY>)` with `max_results` at least **1** to detect **child issues** when **`get_issue_links`** is empty. Resolve **`Epic Link`** with **`get_issue_field_names`** if JQL rejects the name.
  - `get_issue` — full details for one epic key when search results are thin or you need nested/metadata fields.
  - `get_issue_field_names` — discover field **ids** when the UI label “Due date” maps to a custom field, for **Epic Link** / **parent** JQL, or for other RHEA-specific fields before interpreting or updating.
  - `get_issue_links` — list **issue links** on an epic (`issue_key`); part of **related work**. **Not sufficient alone:** Jira **child issues** (stories/tasks under the epic) often **do not** appear here — always pair with the **child JQL** in workflow step 6 when this returns empty.
  - `get_issue_link_types` — optional; resolve exact **type** strings on your site (e.g. “Relates”, “Blocks”) if the user only counts certain link types toward the **≥1 link** requirement.
  - `get_issue_comments` — list all comments (`body`, `created`, `author`, `id`) for an epic; pass **`issue_key`**. Use once per epic, then: (1) **Comments row (list 1)** — **pass** if **any** **`created` > cutoff**; **fail** if **none** (all **`created` ≤ cutoff** or zero comments); (2) **Stale second list** — see step 9 (**every** **`created` < cutoff**).

## Workflow

1. **Clarify scope and deliverable** if missing: default **project = RHEA**; default **fail-all AND** per **Goal** plus the **stale 90-day second list** unless the user opts out. Confirm read-only vs edits. For **related work (list 1)**: **pass** if **`get_issue_links`** is non-empty **or** JQL finds **≥1** child issue for the epic key (**`Epic Link`**, **`parent`**, or field from **`get_issue_field_names`**); **`RHEA-4420`**-style epics **with children** must **pass** this row and **not** appear on **list 1** solely for “no links.” For **Comments (list 1)**: **pass** iff **some** comment has **`created` strictly after `cutoff`**, where **`cutoff` = `audit_now` − 90 days**; **fail** iff **no** such comment (all comments **`created` ≤ cutoff**, or **zero** comments). Epics like **`RHEA-4264`** with **any** comment **< ~90 days** old at **`audit_now`** must **pass** this row and therefore **not** appear on **list 1** unless **`cutoff`**, **`audit_now`**, or ISO parsing is wrong. **Stale second list** still requires **every** **`created` < cutoff** and **`updated` < cutoff**. Confirm **`audit_now`**, timezone (default **UTC**), and **startOfDay** policy.
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

   ```text
   project = RHEA AND type = Epic AND customfield_10517 = false
   ```

   (Epics where **Blocked** is **unchecked** for **primary** fail-all Blocked-row narrowing; adjust field id if `get_issue_field_names` no longer shows **Blocked** → `customfield_10517`. If Jira rejects `= false`, omit the clause and filter on **`custom_fields.blocked`** / **`customfield_10517`** from search or **`get_issue`**).

   ```text
   project = RHEA AND ("Epic Link" = RHEA-4420 OR parent = RHEA-4420)
   ```

   (Replace **`RHEA-4420`** with the epic under test; confirm **`Epic Link`** vs **`parent`** with **`get_issue_field_names`** / a UI-known child if JQL errors. **`max_results` = 1** is enough to prove children exist.)

   ```text
   project = RHEA AND type = Epic AND statusCategory != "Done" AND updated < -90d
   ```

   (Last line: candidate seed for the **stale 90-day** second list; still verify **`get_issue_comments`** per workflow step 9.)

3. **Search** — call `search_issues_by_jql` with `jql_query` and sensible `max_results` (≤ 100). Include `fields` tailored to the audit, e.g.:

   `["summary", "status", "duedate", "priority", "labels", "updated", "customfield_10517"]`

   The array includes **`updated`** for the **secondary stale list** as well as for fail-all context. If **`duedate`** is omitted from MCP search payloads even when set, validate with JQL such as `duedate = "YYYY-MM-DD"` for a sample key, or use `get_issue_field_names` / raw REST field **`duedate`** — still treat **`duedate`** as the canonical Due date for RHEA unless discovery shows a custom replacement.

4. **Deep pass** — For **fail-all** scoring, call **`get_issue`** when search payloads omit **`duedate`** or **Blocked** / **blocked_reason**, or when narrative context helps. Use **`get_issue`** (and JQL `duedate` probes) to judge **`duedate`** and **`custom_fields.blocked`** when not conclusive from search alone. Narrowing JQL is allowed to save calls, but the **primary list** still requires every applicable row verified per step 8, **including** step 6 **child** search when **`get_issue_links`** is empty.

5. **Blocked (primary fail-all only)** — For **list one** scoring, the Blocked row **fails** when **`custom_fields.blocked`** is **`"False"`** (string) or boolean **`false`**, or when the checkbox is **unchecked** in the payload your MCP returns for “cleared.” **Pass** when **`"True"`** (string) or boolean **`true`** (Blocked **checked**). If the value is missing, resolve with **`get_issue`** / `get_issue_field_names` rather than guessing.
   - **Bulk:** Prefer JQL such as `project = RHEA AND type = Epic AND customfield_10517 = false` (with `statusCategory` filters as needed) to narrow epics that **fail** this row; include `customfield_10517` in `fields` when scanning a broader JQL. If Jira rejects that clause, run the epic JQL without it and filter on **`customfield_10517`** / **`custom_fields.blocked`** from `search_issues_by_jql` / `get_issue` instead.
   - **Per issue:** Use the same pass/fail rule as the bullet above. **Calibration:** On **`RHEA-4246`**, **Blocked** is checked — expect **`"True"`** — that epic **passes** this row for primary fail-all (it fails other rows only if those rows’ criteria apply).
   - **Report:** Include **Blocked Reason** (`blocked_reason` / `customfield_10483`) when present.

6. **Related work (issue links or epic children — list 1)** — for **each** epic in scope:
   1. Call **`get_issue_links`** with the epic’s `issue_key`. If **`result`** has **≥1** link → **pass** this row (stop).
   2. Else call **`search_issues_by_jql`** with JQL such as `project = RHEA AND ("Epic Link" = <EPIC_KEY> OR parent = <EPIC_KEY>)`, **`max_results` = 1** (only need existence). If **≥1** issue is returned → **pass** this row (**`RHEA-4420`**-style: children exist but may not show in **`get_issue_links`**).
   3. If both are empty → **fail** this row (no issue links **and** no child issues found under the JQL you can run). If JQL errors on **`Epic Link`**, resolve the epic-link field with **`get_issue_field_names`** / site docs and retry; do **not** mark **fail** until child search has been attempted with a valid clause.
   - **Report:** cite **`get_issue_links`** count and child JQL hit count (or sample child key) when the row outcome is non-obvious.

7. **Comments — two uses of `get_issue_comments`** — for each epic in scope, call **`get_issue_comments`** once with `issue_key`. Fix **`audit_now`** from session context (e.g. user_info). Compute **`cutoff` = `audit_now` − 90 days** (align **startOfDay** the same way on **`audit_now`** and **`cutoff`** if used). Parse each comment’s **`created`** (ISO-8601 from Jira, e.g. `2026-05-01T15:22:00.219+0000`).
   - **A) Comments row (primary fail-all — list 1):** **Pass** iff **at least one** comment has **`created` > `cutoff`** (strict ISO compare after normalizing offsets). **Fail** iff **no** comment has **`created` > `cutoff`** — i.e. **every** comment has **`created` ≤ `cutoff`** (all **stale** / on-or-before cutoff) **or** there are **zero** comments. (**`RHEA-4264`** with a **2026-05-06** comment vs **`cutoff` `2026-02-12T00:00:00.000+0000`** → **`created` > cutoff** → row **passes** → epic **excluded** from **list 1**.) When reporting: give **`cutoff`**, explain that comments **on or before** **`cutoff`** are **stale**, and that the row **passes** iff **some** **`created`** is **strictly after** **`cutoff`**.
   - **B) Stale second list (step 9):** Do **not** use (A) for inclusion on the stale list. Stale uses **every** **`created` < cutoff** — see step 9.
   - **Calibration:** On **`RHEA-4246`**, `get_issue_comments` includes a recent comment whose **`body`** is exactly (use to verify parsing; typos match Jira as stored):

     `Adjusted the due date but I beleive this will actually close by the 15th and is unbocked as Abby was able to get Nvidia to agree to send over data.`
   - **Do not** substitute issue **`updated`** for the **Comments row** pass/fail in fail-all scoring (use **`get_issue_comments`**). Issue **`updated`** **is** used for the **secondary stale list** per **Secondary deliverable (stale 90 days)**.

8. **Fail-all intersection (required for default goal)** — For **each** epic key in scope (after pagination): record **pass/fail** for Due date (empty **`duedate`** = fail), Blocked (**`"False"`** / false / unchecked = **fail** for **primary**; **`"True"`** / true = **pass**), Related work (**pass** if step 6 found **≥1** issue link **or** **≥1** child via JQL; **fail** only if **both** absent), Comments (**pass** if **at least one** comment has **`created` > cutoff** from step 7; **fail** if **no** comment has **`created` > cutoff** — i.e. **all** comments have **`created` ≤ cutoff**, or there are **no** comments). **Primary list** = keys where **all** applicable rows = **fail**. If a single row **passes**, the epic is **excluded** from the primary list. You may use JQL to shrink the candidate set, but **do not** emit a key on the primary list without confirming **every** row. If the primary list is empty, say so.

9. **Stale 90-day list (secondary deliverable)** — Build the **second list** per **Secondary deliverable (stale 90 days)** using the **same** **`audit_now`** and **`cutoff`** as step 7. For **comments**, apply **only** the stale rule: **every** **`created` < cutoff** (and **every** comment **`updated` < cutoff** when present) — **not** the checklist row (7A). For each epic in scope (paginate as in the Goal): include the epic iff **`updated`** (from search or **`get_issue`**) is **strictly before** the cutoff **and** the stale comment rule holds. **Do not** include epics whose **only** comments are **newer** than that threshold (e.g. **`RHEA-4264`** with a **2026-05-06** comment when **`audit_now`** is **2026-05-13**). Optionally seed candidates with JQL such as `project = RHEA AND type = Epic AND statusCategory != "Done" AND updated < -90d` (align `-90d` with the same **`audit_now`**), then **verify** the comment condition for each candidate. If the second list is empty, say so. Note the **link-timestamp limitation** from the Secondary deliverable section in the report.

10. **Report** — **(1) Primary list** (fail-all AND): **key**, **summary**, **URL**, and per-epic check failures as needed; for **Related work**, note **`get_issue_links`** vs **child JQL** when relevant; for **Comments**, include **`cutoff`** and step 7A (**pass** = **some** **`created` > cutoff**). **(2) Second list** (stale 90 days): **key**, **summary**, **URL**, **`updated`**, and brief note that Due date/Blocked/link changes are inferred via **`updated`** except comments (explicit). If the user also asked for broader hygiene, add optional sections **after** both lists.

## Default “elements” checklist

Apply what the user asked for; default epic governance for **fail-all AND** scoring. A row **fails** when the **Pass** cell is not satisfied (that epic is a candidate for the primary list only if **every** applicable row fails).

| Element | Pass | Common JQL hint |
|--------|------|------------------|
| Due date | **Due date** populated — JQL/REST **`duedate`** (not Target end alone; see **`RHEA-4246`** calibration) | `duedate is EMPTY` / `duedate < startOfDay()` on `project = RHEA AND type = Epic` |
| Status | matches user’s definition of active/done | filter in JQL or in report |
| Related work (≥1 link **or** child) | **`get_issue_links`** has **≥1** entry **or** `search_issues_by_jql` finds **≥1** child (`"Epic Link"` / **`parent`** / field from **`get_issue_field_names`**) — **`RHEA-4420`** with children **passes** even if links are empty | `project = RHEA AND ("Epic Link" = RHEA-4420 OR parent = RHEA-4420)` (swap key); adjust field names per site |
| Blocked (primary) | **Blocked** checked — `custom_fields.blocked` is **`"True"`** or boolean **`true`** (`get_issue`); field id **`customfield_10517`** on RHEA (payload shape vs UI: **`RHEA-4246`** has **Blocked** checked) | `project = RHEA AND type = Epic AND customfield_10517 = false` finds epics that **fail** this row (unchecked); prefer per-epic confirmation |
| Comments (90-day recency) | **`get_issue_comments`**: **at least one** comment has **`created` strictly after `cutoff`** (recent discussion); **fail** if **all** comments have **`created` on or before `cutoff`** or there are **no** comments — **`RHEA-4264`** with a **< ~90 day** comment **passes** → **not** on **list 1** | not reliable via stock JQL alone; use **`get_issue_comments`** per epic (calibrate on **`RHEA-4246`**); **stale second list** still needs **every** **`created` < cutoff** |

### Secondary: stale 90 days (not fail-all scoring)

| Criterion | On second list iff | JQL / MCP |
|-----------|---------------------|-----------|
| Issue activity | **`updated`** strictly **before** the same 90-day cutoff as comments | `search` / `get_issue` field **`updated`**; optional seed `updated < -90d` |
| Comment activity | **Every** comment has **`created` < cutoff** (age **>** 90 days; **no** comment in the **last** 90 days); **every** comment **`updated`** (if present) **< cutoff** | **`get_issue_comments`** |

If the rule is “at least one **Relates to** link” (other link types do not count), filter **`get_issue_links`** results by `type` after optionally calling `get_issue_link_types`; **child issues** found via step 6 still **pass** the row regardless of link **type** unless the user narrows the rule.

Extend the table for org rules (components, fix version, story points on epic, links to parent initiative, assignee, description, etc.) only when the user asks—those are **out** of the default fail-all AND.

## Errors and auth

If MCP returns an error or empty results unexpectedly, say what failed, do not invent issues, and suggest verifying Jira permissions and MCP session/auth configuration for `user-jira-mcp-server`.
