# Audit Schema — The Contract

This document defines the two shared file formats that all audit skills read from and write to.
Every skill **must** conform to these formats so the `/audit-report` skill can reliably consolidate findings.

---

## The Two Files

| File | Created by | Written to by | Read by |
|------|-----------|--------------|---------|
| `audit-context.md` | `/audit-setup` | `/audit-setup` only | all subsequent skills |
| `audit-findings.md` | `/audit-setup` | each skill appends its own section | `/audit-report` |

Both files are created fresh for each audit run inside the output directory:
```
./audit-reports/YYYY-MM-DD/
  audit-context.md
  audit-findings.md
  audit-report.md        ← produced by /audit-report at the end
```

---

## File 1: audit-context.md

Produced once by `/audit-setup`. All other skills read this to know what stack they are auditing and where key files live. Skills use the stack fields to activate tech-specific prompt variants.

See `templates/audit-context-template.md` for the ready-to-fill version.

### Required Fields

```
Project        string    — application name or repo name
Date           YYYY-MM-DD
Mode           full | speed
Status         in-progress | complete

Language(s)    comma-separated list
Frontend       React | Next.js | Vue | Angular | None | Other
Backend        Express | Fastify | Django | Flask | FastAPI | None | Other
Database       PostgreSQL | MySQL | MongoDB | SQLite | Supabase | Firebase | None | Other
ORM            Prisma | Drizzle | Sequelize | Mongoose | raw | None | Other
Auth Method    JWT | Sessions | NextAuth | Clerk | Auth0 | Supabase Auth | Custom | None
Deployment     Replit | Heroku | Vercel | Railway | AWS | None | Other
Package Mgr    npm | yarn | pnpm | pip | N/A
```

### Key Paths (fill in what exists, mark N/A for what doesn't)

```
Auth files       path(s) to login, session, middleware/auth, ProtectedRoute
API routes       path(s) to route definitions or controllers
Database/ORM     path(s) to schema, models, migrations, db config
Config/env       path(s) to .env, config files, secrets
Frontend entry   path to App.tsx / main.tsx / pages/index
```

---

## File 2: audit-findings.md

Append-only during the audit. Each skill adds its own headed section. `/audit-report` reads the complete file to generate the final report.

### File Header (written by `/audit-setup`)

```markdown
# Audit Findings — [Project Name]
**Date:** YYYY-MM-DD | **Mode:** full | **Auditor:** [name]

---
```

### Per-Skill Section (each skill appends this block)

```markdown
## [SKILL-NAME] — [timestamp]

> [one-line summary: e.g. "3 findings: 1 critical, 2 high"]

[finding blocks...]

---
```

### Finding Block Format

```markdown
### [ID] · [Title] [SEVERITY]
**Skill:** [skill-name]
**File:** `path/to/file.ext:line` (or `N/A — configuration issue` etc.)
**Category:** [category label — see category list below]

**Evidence:**
[code snippet, grep output, or observed behaviour]

**Risk:** [one or two sentences — what an attacker could do]

**Remediation:** [specific, actionable fix]

**OWASP:** [reference — see mapping below]
**Status:** OPEN
```

### If a skill finds nothing

```markdown
## [SKILL-NAME] — [timestamp]

> No findings. All checks passed.

---
```

---

## Finding IDs

Each skill owns a prefix. IDs are numbered sequentially within each prefix, starting at 001.

| Prefix | Skill |
|--------|-------|
| `SEC` | audit-secrets |
| `AUTH` | audit-auth |
| `API` | audit-api |
| `DB` | audit-database |
| `FE` | audit-frontend |
| `DEP` | audit-dependencies |
| `BL` | audit-business-logic |

Examples: `SEC-001`, `AUTH-003`, `DB-007`

---

## Severity Definitions

| Level | Definition | Default Fix Timeline |
|-------|-----------|---------------------|
| `[CRITICAL]` | Exploitable now with no prerequisites — authentication bypass, exposed live credentials, SQL injection with no auth | Within 24 hours |
| `[HIGH]` | High-impact but requires some conditions — missing rate limiting, weak JWT config, IDOR with auth required | Within 1 week |
| `[MEDIUM]` | Meaningful risk but limited blast radius — missing security headers, code quality issues that create attack surface | Within 1 month |
| `[LOW]` | Minor risk or code quality / maintainability only | When convenient |

---

## Status Values

| Status | Meaning |
|--------|---------|
| `OPEN` | Unaddressed — default for all new findings |
| `INVESTIGATING` | Being actively examined — use during the audit if a finding needs more research |
| `FALSE_POSITIVE` | Investigated and ruled out — must include a note explaining why |
| `DEFERRED` | Accepted risk — stakeholder decision, must include rationale |
| `FIXED` | Remediated and re-tested |

To change status, update the finding block in `audit-findings.md` and add a `**Note:**` line explaining the decision.

---

## Category Labels

Use exactly these strings in the `**Category:**` field so the report skill can group findings correctly.

```
Secrets / Credential Exposure
Authentication & Session Management
Authorization & Access Control
Input Validation & Injection
API Security
Database Security
Frontend Security
Dependency Vulnerability
Business Logic
Error Handling & Information Disclosure
Security Configuration
Code Quality
```

---

## OWASP Top 10 (2021) Mapping Reference

| ID | Title | Common finding categories |
|----|-------|--------------------------|
| A01:2021 | Broken Access Control | Authorization & Access Control, Business Logic |
| A02:2021 | Cryptographic Failures | Secrets / Credential Exposure, Database Security |
| A03:2021 | Injection | Input Validation & Injection, Database Security |
| A04:2021 | Insecure Design | Business Logic, Architecture |
| A05:2021 | Security Misconfiguration | Security Configuration, API Security |
| A06:2021 | Vulnerable & Outdated Components | Dependency Vulnerability |
| A07:2021 | Identification & Authentication Failures | Authentication & Session Management |
| A08:2021 | Software & Data Integrity Failures | Dependency Vulnerability |
| A09:2021 | Security Logging & Monitoring Failures | Error Handling & Information Disclosure |
| A10:2021 | Server-Side Request Forgery | Input Validation & Injection, API Security |
