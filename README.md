# Vibe Audit Workflow

A Claude Code skill library for conducting systematic security and code quality audits on applications built without professional developers. Run a full audit with one command, or invoke individual specialist skills to focus on specific areas.

---

## What this is

Non-developer ("vibe-coded") applications share predictable vulnerability patterns: hardcoded API keys, missing auth middleware, unparameterized SQL queries, JWT secrets in source code, and no input validation. This project packages a systematic audit process into 10 Claude Code skills — each one knows exactly what to look for, which commands to run, and how to format findings so the final report writes itself.

**What you get from a full audit:**
- A structured findings file with every issue categorised by severity, OWASP mapping, and file location
- A final report with executive summary, risk matrix, and a prioritised implementation timeline
- Specific, actionable remediation guidance for each finding — not generic advice

**Supported stacks:** React, Next.js, Vue, Angular · Express, Fastify, Hono, Django, Flask, FastAPI · PostgreSQL, MySQL, MongoDB, SQLite, Supabase, Firebase · Prisma, Drizzle, Sequelize, Mongoose · NextAuth, Clerk, Auth0, Supabase Auth, manual JWT

---

## Requirements

- [Claude Code](https://claude.ai/code) CLI, desktop app, or IDE extension (VS Code / JetBrains)
- Access to the source code of the project being audited (local directory)

> **Claude Desktop / claude.ai web users:** Skills require Claude Code. If you are using Claude Desktop or the web interface, see [Manual use without Claude Code](#manual-use-without-claude-code) at the bottom of this document.

---

## Installation

### Option A — Run from this repo (recommended for first use)

Clone the repo and run Claude Code from inside it. All skills and templates are available immediately.

```bash
git clone https://github.com/kdevnel/vibe-audit-workflow.git
cd vibe-audit-workflow
claude
```

Inside Claude Code, type `/audit /path/to/your/project` to start.

### Option B — Install skills globally

Copy the skill files to your global Claude Code skills directory so `/audit` is available from any working directory.

```bash
# Clone the repo
git clone https://github.com/kdevnel/vibe-audit-workflow.git
cd vibe-audit-workflow

# Create the global skills directory if it doesn't exist
mkdir -p ~/.claude/skills

# Copy all skill files
cp .claude/skills/*.md ~/.claude/skills/

# Copy the templates directory alongside the skills
cp -r templates ~/.claude/skills/templates
```

After installation, `/audit` and all specialist skills are available in every Claude Code session.

### Option C — Install per project

Copy skills into the project you want to audit so they travel with it.

```bash
mkdir -p /path/to/your/project/.claude/skills
cp .claude/skills/*.md /path/to/your/project/.claude/skills/
cp -r templates /path/to/your/project/.claude/skills/templates
```

---

## Quick start

### Full audit

```
/audit /path/to/project
```

Runs all 10 skills in sequence, produces `./audit-reports/YYYY-MM-DD/audit-report.md`.

### Speed audit (15 minutes)

```
/audit /path/to/project --mode=speed
```

Runs setup + secrets + auth only. Finds the most critical issues quickly.

### With auditor name

```
/audit /path/to/project --auditor="Jane Smith"
```

### Skip specific skills

```
/audit /path/to/project --skip=audit-frontend,audit-dependencies
```

### Run a single skill

Each skill can be run independently after setup. Pass the output directory path.

```bash
# First, run setup to create the context and findings files
/audit-setup /path/to/project

# Then run any skill against that output directory
/audit-secrets ./audit-reports/2025-01-15/
/audit-auth    ./audit-reports/2025-01-15/
```

---

## Output

Every audit creates a dated directory:

```
audit-reports/
  2025-01-15/
    audit-context.md     — tech stack, key file paths, project stats (created by setup)
    audit-findings.md    — all findings from all skills, append-only during the audit
    audit-report.md      — final consolidated report (created by /audit-report)
```

The final report contains:
- Executive summary with overall risk level
- All findings grouped by severity (Critical → High → Medium → Low)
- Findings by OWASP Top 10 category
- Risk matrix
- Implementation timeline with checkboxes

---

## Skill reference

### `/audit` — Orchestrator

The only skill you need for a complete audit. Runs all specialist skills in the correct order.

```
/audit <project-path> [--mode=full|speed] [--auditor="Name"] [--skip=skill1,skill2]
```

**Execution order:**

```
Phase 0   /audit-setup          — stack detection, output files
Phase 1   /audit-secrets        ─┐
          /audit-auth            ├─ parallel (independent)
          /audit-database        │
          /audit-frontend        │
          /audit-dependencies   ─┘
Phase 2   /audit-api            — depends on Phase 1 findings
Phase 3   /audit-business-logic — depends on Phase 2 findings
Phase 4   /audit-report         — consolidates everything
```

---

### `/audit-setup`

Runs reconnaissance on the target project. Detects the tech stack, maps key file paths, and creates the two shared files (`audit-context.md` and `audit-findings.md`) that every other skill depends on.

```
/audit-setup <project-path> [--mode=full|speed] [--auditor="Name"]
```

**What it detects automatically:** language(s), frontend framework, backend framework, database, ORM/query builder, auth method, deployment target, package manager, key file paths (auth, API routes, schema, env/config, frontend entry), external integrations (Stripe, OpenAI, etc.), project statistics.

**Output:** `audit-context.md` + `audit-findings.md` in `./audit-reports/YYYY-MM-DD/`, plus a handoff summary with the next command to run.

---

### `/audit-secrets`

Scans for exposed credentials, hardcoded secrets, and insecure secret management. Highest-yield skill — non-developer codebases routinely contain live API keys and passwords in source code.

```
/audit-secrets <output-dir>
```

**Checks (10 steps):**
1. Hardcoded credential assignment patterns (`password = "..."`, `api_key = "..."`)
2. Known service key signatures — Stripe (`sk_live_`), AWS (`AKIA...`), GitHub (`ghp_`), Google (`AIza...`), Slack (`xoxb-`), OpenAI (`sk-`), Twilio, SendGrid, Anthropic
3. PEM private keys and SSH key material committed to the repo
4. Database connection strings with embedded `user:password@` credentials
5. JWT signing secret hardcoded or too short/weak
6. `.env` file not in `.gitignore`, or tracked by git
7. Git history search (`git log -S`) for previously committed secrets
8. Client-side secret exposure — `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_` variables with sensitive names
9. Credential logging — `console.log(password)` patterns
10. Classify and write findings (`SEC-NNN` IDs)

---

### `/audit-auth`

Audits the authentication and session management implementation. Authentication failures are the most exploited class of vulnerability in non-developer applications.

```
/audit-auth <output-dir>
```

**Checks (12 steps):**
1. Maps the full auth system (what's issued on login, how it's validated per request)
2. Password storage — bcrypt/argon2 vs MD5/SHA-1/plain text, timing-safe comparison
3. JWT configuration — algorithm allowlist, `expiresIn`, `alg: none` check, revocation strategy
4. Token storage — localStorage vs httpOnly cookies, `Secure`/`SameSite` flags
5. Route protection coverage — every API route cross-checked against auth middleware
6. Client-side-only auth guards — frontend `ProtectedRoute` with no server-side enforcement
7. Password reset flow — crypto-random token, time-limited, single-use, hashed in DB
8. Account lockout — rate limiting on login endpoints
9. User enumeration — consistent error messages across login and forgot-password flows
10. Provider-specific: **NextAuth** (secret, JWT callbacks), **Clerk** (middleware, webhook signatures), **Supabase Auth** (`getUser` vs `getSession`, service role bypass), **Auth0** (audience validation)
11. Manual JWT/custom auth deep-dive fallback
12. Classify and write findings (`AUTH-NNN` IDs)

---

### `/audit-api`

Audits all API endpoints for vulnerabilities beyond authentication — input validation, CORS, security headers, information disclosure, IDOR, mass assignment, file uploads, and GraphQL. Runs after the parallel group so it can cross-reference auth and database findings.

```
/audit-api <output-dir>
```

**Checks (12 steps):**
1. Full endpoint enumeration — Express/Fastify/Hono, Next.js pages router, Next.js app router, Python frameworks
2. Input validation coverage — Zod/Joi/Yup/Pydantic schema presence on all mutation endpoints
3. CORS configuration — wildcard+credentials (CRITICAL), domain allowlists, regex bypass patterns
4. HTTP security headers — Helmet detection, manual check for HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
5. Error handling — `error.stack` in responses, raw error objects returned to client, Django DEBUG=True
6. Rate limiting — mapped to endpoint type (login, registration, password reset, mutations)
7. Request size limits — body parser limits, file upload `fileSize` config
8. IDOR and mass assignment — `req.params.id` without ownership filter, `.create(req.body)` without field allowlisting
9. File upload security — MIME validation, size limits, user-controlled filenames, web-accessible storage
10. GraphQL (conditional) — introspection in production, depth limiting, query complexity
11. Cross-reference `AUTH-` and `DB-` findings in all findings
12. Classify and write findings (`API-NNN` IDs)

---

### `/audit-database`

Audits database interactions for SQL injection, insecure query construction, ORM misuse, connection security, schema weaknesses, and platform-specific issues.

```
/audit-database <output-dir>
```

**Checks (9 steps):**
1. SQL injection via string concatenation and template literals
2. ORM injection surfaces — `$queryRawUnsafe` (Prisma), `sql.raw()` (Drizzle), `sequelize.query()` without replacements, Mongoose operator injection via `find(req.body)`
3. Parameterized query verification on raw queries
4. Connection security — SSL/TLS enforcement, `rejectUnauthorized: false`, connection pool config
5. Schema integrity — missing unique constraints (email), missing NOT NULL on FK columns, missing FK constraints
6. Sensitive data at rest — unencrypted PII columns, password column type analysis
7. **Supabase** — Row Level Security enabled on all tables, service role key scope
8. **Firebase** — Firestore/Realtime Database security rules, `allow read, write: if true` detection
9. Classify and write findings (`DB-NNN` IDs)

---

### `/audit-frontend`

Audits client-side code for XSS, sensitive data in browser storage, insecure auth state, third-party script risks, and framework-specific issues.

```
/audit-frontend <output-dir>
```

**Checks (9 steps):**
1. XSS injection vectors — `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]`, `innerHTML =`, `eval()`, `document.write`, `insertAdjacentHTML`; DOMPurify sanitisation check
2. Sensitive data in `localStorage`/`sessionStorage` — auth tokens, PII, session IDs
3. Environment variable exposure — `NEXT_PUBLIC_` / `VITE_` / `REACT_APP_` variables with sensitive names
4. Forgeable auth state — `isAdmin`/`role` derived from localStorage rather than a server-validated session
5. Auth tokens in URL query parameters (visible in browser history and server logs)
6. Third-party scripts — missing SRI `integrity` attributes, HTTP (not HTTPS) script sources
7. `postMessage` listeners without `event.origin` validation
8. Framework-specific: **Next.js** (`getServerSideProps` returning full DB objects, server actions without auth), **React** (client-side routing without server enforcement), **Vue** (`v-html`)
9. Classify and write findings (`FE-NNN` IDs)

---

### `/audit-dependencies`

Scans project dependencies for known CVEs, critically outdated packages, lock file integrity, and supply chain risks.

```
/audit-dependencies <output-dir>
```

**Checks (5 steps):**
1. Automated vulnerability scan — `npm audit`, `yarn audit`, `pnpm audit`, `pip-audit` / `safety`; CVE findings triaged by production vs dev-only, patched vs unpatched
2. Lock file integrity — presence, git tracking, sync with manifest
3. Critically outdated security-sensitive packages — auth libraries, HTTP frameworks, database clients, crypto libraries (2+ major versions behind)
4. Suspicious package names — typosquatting check against package list
5. Classify and write findings (`DEP-NNN` IDs); low-severity CVEs batched into a single finding

---

### `/audit-business-logic`

Audits the application's domain logic for flaws that pattern-matching misses: IDOR at the service layer, race conditions, workflow bypass, price manipulation, and abuse vectors. Requires reasoning about what the application does.

```
/audit-business-logic <output-dir>
```

**Checks (10 steps):**
1. Build application domain model — purpose, user types, entities, workflows, money flows, external services
2. IDOR at the data/service layer — ORM queries that filter by ID without an ownership check
3. Horizontal privilege escalation — user can update/delete another user's resources
4. Vertical privilege escalation — regular user can gain admin via mass assignment or invitation flows
5. Race conditions — read-modify-write operations without database transactions (double-spend, double-booking, discount reuse)
6. Workflow bypass — later-step API endpoints callable without completing earlier required steps
7. Numeric edge cases — negative values, zero, missing upper bounds, floating-point for money
8. Price manipulation — price sourced from client request rather than database (user sets their own price)
9. Email/notification abuse — server-side email sends with user-controlled recipient address
10. External API proxy abuse — unlimited paid API calls (OpenAI, SMS) triggerable per user

All findings include a **concrete attack scenario** in the Evidence field.

---

### `/audit-report`

Reads all completed findings and writes the final `audit-report.md`.

```
/audit-report <output-dir>
```

**Output sections:** Executive summary with overall risk level · Full findings by severity (Critical → High → Medium → Low) · Findings grouped by category · OWASP Top 10 coverage table · Risk matrix · Implementation timeline with checkboxes · Skills run summary · Deferred/accepted risk log.

`FALSE_POSITIVE`-status findings are excluded from counts and the report body.

---

## Finding IDs

Each specialist skill owns a prefix. IDs are sequential within each skill.

| Prefix | Skill |
|--------|-------|
| `SEC-NNN` | audit-secrets |
| `AUTH-NNN` | audit-auth |
| `API-NNN` | audit-api |
| `DB-NNN` | audit-database |
| `FE-NNN` | audit-frontend |
| `DEP-NNN` | audit-dependencies |
| `BL-NNN` | audit-business-logic |

---

## Severity levels and fix timelines

| Level | Definition | Default timeline |
|-------|-----------|-----------------|
| **CRITICAL** | Exploitable now with no prerequisites — exposed live credentials, authentication bypass, SQL injection, price settable by client | Within 24 hours |
| **HIGH** | High-impact requiring some conditions — missing rate limiting, weak JWT config, IDOR with auth required, no input validation | Within 1 week |
| **MEDIUM** | Meaningful risk, limited blast radius — missing security headers, code quality issues creating attack surface | Within 1 month |
| **LOW** | Minor risk or code quality / maintainability only | When convenient |

---

## Schema and templates

The `templates/` directory defines the data contract shared between all skills:

| File | Purpose |
|------|---------|
| `templates/audit-schema.md` | Full contract: finding block format, ID conventions, severity definitions, status values, category labels, OWASP mapping |
| `templates/audit-context-template.md` | Template filled in by `/audit-setup` — stack, file paths, scope, project stats |
| `templates/audit-findings-template.md` | Template instantiated per audit run — skills append their sections here |

Read `audit-schema.md` first if you are writing a new skill or modifying an existing one.

---

## Manual use without Claude Code

If you are using Claude Desktop, claude.ai, or any interface without Claude Code skill support:

1. Open `complete-audit-workflow.md` — this is your step-by-step guide
2. Open `audit-prompt-library.md` in a second tab — this contains the prompts to paste at each step
3. Follow the numbered steps in the workflow guide; when it says `📖 Reference: See "X" in AUDIT_PROMPT_LIBRARY.md`, copy that prompt and add your project context
4. Use `code-audit-framework.md` as a reference for vulnerability patterns and checklists

The manual workflow covers the same ground as the skills but requires copy-pasting prompts at each step rather than invoking them with `/skill-name`.

---

## Reference docs

| File | Purpose |
|------|---------|
| `code-audit-framework.md` | Audit checklists, vulnerability patterns, technology-specific guidance, remediation timelines |
| `audit-prompt-library.md` | Reusable LLM prompts for each audit area — used by the skills internally |
| `complete-audit-workflow.md` | Manual step-by-step guide for use without Claude Code |
| `CLAUDE.md` | Guidance for Claude Code instances working in this repository |
