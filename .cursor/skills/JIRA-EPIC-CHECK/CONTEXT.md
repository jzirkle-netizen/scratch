# Skill context (vocabulary ↔ Jira ↔ lists)

Read this when the user’s prompt uses **org shorthand** instead of a Jira project key, or **stakeholder names** instead of “List 1 / List 2”.

## Project naming

| Phrase in conversation | Jira meaning (example org) |
|--------------------------|----------------------------|
| **Enterprise Architecture** | Jira project **`RHEA`**. When scope is “EA” or Enterprise Architecture epics, use **`project = RHEA`** (unless the user names a different key). |
| *Enteprise Architecture* | Treat as the same intent as **Enterprise Architecture** (common typo); confirm **`RHEA`** if the project key is ambiguous. |
| **CBP Sales Planning Transformation** | Jira project **`SPT`**. When scope refers to CBP Sales Planning Transformation, use **`project = SPT`** in JQL (unless the user names a different key). |

**Any other Jira project:** use the user’s **`PROJECT_KEY`** or full epic JQL they provide. Do **not** assume `RHEA` or **`SPT`** unless context or the user says so.

## Lists and code-aligned names

| User / stakeholder term | Skill / “code” term | What it is |
|---------------------------|---------------------|--------------|
| **Problematic JIRA** | **List 1** | Primary deliverable: epics that **fail every applicable governance row at once** (fail-all **AND**). The **Comments** row uses **`cutoff_L1`** = `audit_now − LIST1_DAYS`. |
| **Untouched JIRA** | **List 2** | Secondary deliverable: epics in the **same scope** with **no** governance-relevant activity in the rolling **`LIST2_DAYS`** window: **`cutoff_L2`** = `audit_now − LIST2_DAYS` (issue **`updated`** and **all** comments strictly before **`cutoff_L2`** per the main instructions). |

**List 1** and **List 2** use **different** date windows when **`LIST1_DAYS` ≠ `LIST2_DAYS`**: always compute **`cutoff_L1`** for Problematic / List 1 comment recency and **`cutoff_L2`** for Untouched / List 2 staleness. Same run, two independent lists.
