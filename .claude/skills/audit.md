# /audit

Orchestrates the full audit workflow. Runs all specialist skills in the correct order and produces a final report. This is the only skill most users need to invoke directly.

---

## Invocation

```
/audit <project-path> [--mode=full|speed] [--auditor="Name"] [--skip=skill1,skill2]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `<project-path>` | required | Path to the project being audited |
| `--mode` | `full` | `full` runs all skills; `speed` runs setup + secrets + auth + report only |
| `--auditor` | git user.name | Name for report headers |
| `--skip` | none | Comma-separated skills to skip, e.g. `--skip=audit-frontend,audit-dependencies` |

---

## Execution Plan

### Full audit (`--mode=full`)

```
Phase 0: Setup
  /audit-setup <project-path> [--mode=full] [--auditor="..."]
  → produces: audit-context.md, audit-findings.md

Phase 1: Parallel specialist skills (run all, order within phase doesn't matter)
  /audit-secrets      <output-dir>
  /audit-auth         <output-dir>
  /audit-database     <output-dir>
  /audit-frontend     <output-dir>
  /audit-dependencies <output-dir>

Phase 2: Sequential (depend on Phase 1 output)
  /audit-api          <output-dir>

Phase 3: Sequential (depends on Phase 2)
  /audit-business-logic <output-dir>

Phase 4: Report
  /audit-report       <output-dir>
```

### Speed audit (`--mode=speed`)

```
Phase 0: /audit-setup <project-path> --mode=speed
Phase 1: /audit-secrets <output-dir>
         /audit-auth    <output-dir>
Phase 4: /audit-report  <output-dir>
```

Speed audit produces a report with only the highest-impact findings. Suitable for a first-pass review or a time-boxed engagement.

---

## Steps

### Step 1 — Validate arguments

Before running anything, confirm:
- `<project-path>` exists and is a directory
- `--mode` is `full` or `speed` (default to `full` if not specified)
- If `--skip` is provided, confirm each named skill is a valid skill name

If `<project-path>` does not exist: stop and report the error. Do not proceed.

---

### Step 2 — Run `/audit-setup`

Run `/audit-setup` with the provided arguments. Wait for it to complete and confirm:
- `audit-context.md` was created
- `audit-findings.md` was created
- Note the `output-dir` path for all subsequent skills

If setup fails or produces an incomplete context file (any field still showing placeholder text), stop and ask the user to review `audit-context.md` before continuing.

---

### Step 3 — Phase 1: parallel specialist skills

**For full mode**, run all five skills. They are fully independent — present them to the user as a parallel block and work through them:

1. `/audit-secrets <output-dir>`
2. `/audit-auth <output-dir>`
3. `/audit-database <output-dir>`
4. `/audit-frontend <output-dir>`
5. `/audit-dependencies <output-dir>`

After each skill completes, print its one-line handoff summary so the user can track progress.

If `--skip` includes any of these skills, note it and move on without running that skill.

**For speed mode**, run only:
1. `/audit-secrets <output-dir>`
2. `/audit-auth <output-dir>`

Then jump to Step 6 (report).

---

### Step 4 — `/audit-api`

Run after all Phase 1 skills have completed (it cross-references their findings).

```
/audit-api <output-dir>
```

---

### Step 5 — `/audit-business-logic`

Run after `/audit-api` completes.

```
/audit-business-logic <output-dir>
```

---

### Step 6 — `/audit-report`

Run last.

```
/audit-report <output-dir>
```

---

### Step 7 — Print final summary

After the report is written, print:

```
## /audit complete ✓

Project:   [name from context]
Mode:      [full | speed]
Output:    [output-dir]
Report:    [output-dir]/audit-report.md

  🔴 Critical:  [N]
  🟠 High:      [N]
  🟡 Medium:    [N]
  🔵 Low:       [N]
  Total:        [N]

Overall risk: [level]

Skills run: [list]
Skills skipped: [list or "none"]

Open [output-dir]/audit-report.md for the full report.
```

---

## Handling Failures Mid-Audit

If a skill produces an error or cannot complete:
- Note the failure in the corresponding section of `audit-findings.md` as: `> Skill did not complete — [reason]. Manual review required for this area.`
- Continue with the remaining skills
- The report skill will note incomplete sections

Do not abort the entire audit because one skill fails. Partial audits are still valuable.

---

## Resuming an Interrupted Audit

If an audit was interrupted after setup, it can be resumed by running individual skills directly:

```
/audit-secrets ./audit-reports/2025-01-15/
/audit-auth    ./audit-reports/2025-01-15/
# etc.
```

Each skill is idempotent within its section — if re-run, it replaces its own section in `audit-findings.md` rather than appending a second copy.

---

## Done When

- [ ] All skills in the selected mode have run (or been explicitly skipped)
- [ ] `audit-report.md` exists in the output directory
- [ ] Final summary printed with finding counts and report path
