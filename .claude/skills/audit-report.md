# /audit-report

Reads all findings from the completed audit and generates a structured final report. This skill produces the deliverable — the document handed to developers or stakeholders.

Run last, after all specialist skills have completed.

---

## Invocation

```
/audit-report <output-dir>
```

Reads `<output-dir>/audit-context.md` and `<output-dir>/audit-findings.md`. Writes `<output-dir>/audit-report.md`.

---

## Steps

### Step 1 — Parse all findings

Read `<output-dir>/audit-findings.md` in full.

For every finding block, extract and tally:

```
ID | Skill | Title | Severity | Category | Status | File
```

Build a count table:

| Severity | Count |
|----------|-------|
| CRITICAL | |
| HIGH | |
| MEDIUM | |
| LOW | |
| **Total** | |

Also group findings by category (using the exact category labels from `templates/audit-schema.md`) to identify which areas have the most issues.

Note: findings with status `FALSE_POSITIVE` are excluded from counts and the report body.

---

### Step 2 — Determine overall risk level

| Condition | Overall Risk |
|-----------|-------------|
| Any CRITICAL findings | **CRITICAL** |
| No critical, but HIGH findings exist | **HIGH** |
| No critical or high, but MEDIUM findings exist | **MEDIUM** |
| Only LOW findings | **LOW** |
| No findings | **PASS** |

---

### Step 3 — Write the report

Write `<output-dir>/audit-report.md` using the structure below. Populate every section — do not leave placeholders.

---

```markdown
# Security Audit Report — [Project Name]

**Date:** [YYYY-MM-DD]
**Auditor:** [Name]
**Mode:** [full | speed]
**Overall Risk:** [CRITICAL | HIGH | MEDIUM | LOW | PASS]

---

## Executive Summary

[2–3 sentences describing what the application is, the audit scope, and the headline finding. Write for a non-technical reader.]

**Findings breakdown:**

| Severity | Count | Fix timeline |
|----------|-------|-------------|
| 🔴 Critical | [N] | Within 24 hours |
| 🟠 High | [N] | Within 1 week |
| 🟡 Medium | [N] | Within 1 month |
| 🔵 Low | [N] | When convenient |
| **Total** | **[N]** | |

**Top 3 priorities:**
1. [Most critical issue — one sentence]
2. [Second priority]
3. [Third priority]

---

## Critical Findings (Fix Immediately)

[Include every CRITICAL finding block here, copied from audit-findings.md and formatted as below.
If no critical findings, write: "No critical findings identified."]

### [ID] · [Title]
**Category:** [category]
**File:** `[path:line]`

**Risk:** [what an attacker can do]

**Evidence:**
[code snippet or grep output]

**Remediation:** [specific fix]

**OWASP:** [reference]

---

[repeat for each critical finding]

---

## High Priority Findings (Fix Within 1 Week)

[Same format as above for all HIGH findings.
If none: "No high priority findings identified."]

---

## Medium Priority Findings (Fix Within 1 Month)

[Same format for MEDIUM findings.
If none: "No medium priority findings identified."]

---

## Low Priority Findings

[For low findings, a condensed list is acceptable — no need for full blocks unless the finding warrants detail.]

| ID | Title | File |
|----|-------|------|
[one row per LOW finding]

---

## Findings by Category

[Group finding IDs by category to show which areas have the most coverage needed.]

| Category | Finding IDs | Count |
|----------|-------------|-------|
| Secrets / Credential Exposure | | |
| Authentication & Session Management | | |
| Authorization & Access Control | | |
| Input Validation & Injection | | |
| API Security | | |
| Database Security | | |
| Frontend Security | | |
| Dependency Vulnerability | | |
| Business Logic | | |
| Error Handling & Information Disclosure | | |
| Security Configuration | | |
| Code Quality | | |

---

## Risk Matrix

| ID | Title | Likelihood | Impact | Risk |
|----|-------|-----------|--------|------|
[One row per CRITICAL and HIGH finding. Use: Likelihood = High/Medium/Low, Impact = High/Medium/Low, Risk = Critical/High/Medium/Low]

---

## Implementation Timeline

### Immediate (within 24 hours) — Critical issues
[Numbered checklist of critical findings to fix]
- [ ] [ID]: [Title]

### Week 1 — High priority
[Numbered checklist of HIGH findings]
- [ ] [ID]: [Title]

### Month 1 — Medium priority
[Numbered checklist of MEDIUM findings]
- [ ] [ID]: [Title]

### Backlog — Low priority
[Numbered checklist of LOW findings]
- [ ] [ID]: [Title]

---

## OWASP Top 10 Coverage

[Map findings to OWASP categories. Only include categories where findings exist.]

| OWASP Category | Findings |
|---------------|---------|
| A01:2021 – Broken Access Control | [IDs] |
| A02:2021 – Cryptographic Failures | [IDs] |
| A03:2021 – Injection | [IDs] |
| A05:2021 – Security Misconfiguration | [IDs] |
| A06:2021 – Vulnerable & Outdated Components | [IDs] |
| A07:2021 – Identification & Authentication Failures | [IDs] |

---

## Skills Run

| Skill | Findings | Status |
|-------|----------|--------|
| audit-secrets | [N] | complete |
| audit-auth | [N] | complete |
| audit-api | [N] | complete |
| audit-database | [N] | complete |
| audit-frontend | [N] | complete |
| audit-dependencies | [N] | complete |
| audit-business-logic | [N] | complete |

---

## Deferred and Accepted Risk

[List any findings marked DEFERRED with their rationale. If none, write "None."]

---

*Generated by vibe-audit-workflow · [date]*
```

---

### Step 4 — Print completion summary

After writing the report:

```
## /audit-report complete ✓

Report written: <output-dir>/audit-report.md

Summary:
  🔴 Critical:  [N]
  🟠 High:      [N]
  🟡 Medium:    [N]
  🔵 Low:       [N]
  Total:        [N]

Overall risk: [level]

Top priority: [ID] — [Title]
```

---

## Done When

- [ ] All findings read and counted (FALSE_POSITIVEs excluded)
- [ ] Overall risk level determined
- [ ] `audit-report.md` written with all sections populated — no placeholder text remaining
- [ ] OWASP mapping populated for all findings that have an OWASP reference
- [ ] Implementation timeline includes every open finding
- [ ] Completion summary printed
