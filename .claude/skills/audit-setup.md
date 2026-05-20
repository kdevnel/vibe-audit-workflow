# /audit-setup

Sets up a new audit run for a target project. Detects the tech stack, maps key file paths, and produces the two files every subsequent skill depends on: `audit-context.md` and `audit-findings.md`.

Run this skill first at the start of every audit — no other skill can run without its output.

---

## Invocation

```
/audit-setup <project-path> [--mode=full|speed] [--auditor="Name"]
```

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `<project-path>` | yes | — | Absolute or relative path to the project being audited |
| `--mode` | no | `full` | `full` (all skills) or `speed` (secrets + auth + report only) |
| `--auditor` | no | git user.name | Name to appear in report headers |

---

## Output

Creates `./audit-reports/YYYY-MM-DD/` containing:

| File | Description |
|------|-------------|
| `audit-context.md` | Filled-in tech stack, key file paths, project stats — read by all skills |
| `audit-findings.md` | Blank findings file with section scaffolding — appended to by each skill |

Both files conform to `templates/audit-schema.md`.

---

## Steps

Work through these steps in order. Run every command. Do not skip a step because the project looks simple.

### Step 1 — Create the output directory

```bash
export TARGET="<project-path>"
export AUDIT_DATE=$(date +%Y-%m-%d)
export OUT="./audit-reports/$AUDIT_DATE"
mkdir -p "$OUT"
echo "Output directory: $OUT"
```

---

### Step 2 — Identify languages and package managers

```bash
# Node.js / TypeScript
[ -f "$TARGET/package.json" ]      && echo "FOUND: package.json"
[ -f "$TARGET/tsconfig.json" ]     && echo "FOUND: tsconfig.json → TypeScript"

# Python
[ -f "$TARGET/requirements.txt" ]  && echo "FOUND: requirements.txt → Python (pip)"
[ -f "$TARGET/pyproject.toml" ]    && echo "FOUND: pyproject.toml → Python"
[ -f "$TARGET/Pipfile" ]           && echo "FOUND: Pipfile → Python (pipenv)"

# Package manager lock files
[ -f "$TARGET/package-lock.json" ] && echo "PKG MGR: npm"
[ -f "$TARGET/yarn.lock" ]         && echo "PKG MGR: yarn"
[ -f "$TARGET/pnpm-lock.yaml" ]    && echo "PKG MGR: pnpm"
```

---

### Step 3 — Detect frontend and backend frameworks

**For Node.js projects**, read `package.json` dependencies once and extract everything:

```bash
cat "$TARGET/package.json" | grep -E \
  '"(next|react|react-dom|vue|@angular/core|svelte|astro|remix|nuxt|express|fastify|koa|hono|@hono|nestjs|@nestjs)"'
```

**For Python projects**:

```bash
# Check requirements.txt
grep -iE "(django|flask|fastapi|starlette|tornado|aiohttp)" "$TARGET/requirements.txt" 2>/dev/null

# Check pyproject.toml
grep -iE "(django|flask|fastapi|starlette|tornado|aiohttp)" "$TARGET/pyproject.toml" 2>/dev/null
```

**Detect Next.js API routes** (indicates full-stack Next.js, not just frontend):

```bash
find "$TARGET" -type d -name "api" | grep -E "(pages/api|app/api)" | grep -v node_modules
```

**Map findings to context labels:**

| Detected package | Context label |
|-----------------|---------------|
| `next` | Frontend: Next.js — and Backend: Next.js if `/api` routes exist |
| `react` (no `next`) | Frontend: React |
| `vue` | Frontend: Vue |
| `@angular/core` | Frontend: Angular |
| `svelte` | Frontend: Other (Svelte) |
| `express` | Backend: Express |
| `fastify` | Backend: Fastify |
| `hono` or `@hono` | Backend: Other (Hono) |
| `django` | Backend: Django |
| `flask` | Backend: Flask |
| `fastapi` | Backend: FastAPI |

---

### Step 4 — Detect database and ORM

```bash
# Node.js
cat "$TARGET/package.json" | grep -E \
  '"(pg|postgres|@neondatabase|mysql2|mysql|mongodb|mongoose|@supabase/supabase-js|firebase-admin|firebase|better-sqlite3|@libsql|turso)"'

cat "$TARGET/package.json" | grep -E \
  '"(@prisma/client|prisma|drizzle-orm|sequelize|typeorm|mongoose|knex|kysely|@planetscale)"'

# Python
grep -iE "(psycopg2|asyncpg|pymysql|pymongo|sqlalchemy|databases|tortoise-orm|beanie|motor)" \
  "$TARGET/requirements.txt" "$TARGET/pyproject.toml" 2>/dev/null

# Look for Prisma schema
find "$TARGET" -name "*.prisma" | grep -v node_modules

# Look for Drizzle config
find "$TARGET" -name "drizzle.config.*" | grep -v node_modules

# Look for raw SQL files
find "$TARGET" -name "*.sql" -o -name "*migration*" | grep -v node_modules | head -10
```

**Map findings to context labels:**

| Detected | Context label |
|---------|---------------|
| `pg`, `@neondatabase`, `psycopg2`, `asyncpg` | Database: PostgreSQL |
| `mysql2`, `pymysql` | Database: MySQL |
| `mongodb`, `mongoose`, `motor` | Database: MongoDB |
| `better-sqlite3`, `@libsql` | Database: SQLite |
| `@supabase/supabase-js` | Database: Supabase |
| `firebase`, `firebase-admin` | Database: Firebase |
| `@prisma/client` | ORM: Prisma |
| `drizzle-orm` | ORM: Drizzle |
| `sequelize` | ORM: Sequelize |
| `mongoose` | ORM: Mongoose |
| `typeorm` | ORM: Other (TypeORM) |
| `sqlalchemy` | ORM: Other (SQLAlchemy) |
| Raw SQL files only, no ORM | ORM: raw |

---

### Step 5 — Detect authentication method

```bash
cat "$TARGET/package.json" | grep -E \
  '"(next-auth|@auth/core|@clerk/nextjs|@clerk/clerk-sdk-node|auth0|@auth0|jsonwebtoken|jose|passport|passport-local|passport-jwt|@supabase/auth-helpers|better-auth|lucia)"'

# Check for auth config files (do not print contents)
find "$TARGET" -maxdepth 4 \( \
  -name "auth.ts" -o -name "auth.js" -o \
  -name "[...nextauth]*" -o \
  -name "lucia.ts" -o -name "lucia.js" \
\) | grep -v node_modules
```

**Map findings to context labels:**

| Detected | Context label |
|---------|---------------|
| `next-auth`, `@auth/core` | Auth Method: NextAuth |
| `@clerk/nextjs`, `@clerk/clerk-sdk-node` | Auth Method: Clerk |
| `auth0`, `@auth0` | Auth Method: Auth0 |
| `jsonwebtoken`, `jose` (manual JWT) | Auth Method: JWT |
| `passport` | Auth Method: Sessions (Passport) |
| `@supabase/auth-helpers` | Auth Method: Supabase Auth |
| `lucia` | Auth Method: Other (Lucia) |
| `better-auth` | Auth Method: Other (Better Auth) |
| Nothing found | Auth Method: None or Custom — flag for manual review |

---

### Step 6 — Detect deployment target

```bash
[ -f "$TARGET/.replit" ]           && echo "DEPLOY: Replit"
[ -f "$TARGET/Procfile" ]          && echo "DEPLOY: Heroku"
[ -f "$TARGET/vercel.json" ]       && echo "DEPLOY: Vercel"
[ -f "$TARGET/railway.json" ]      && echo "DEPLOY: Railway"
[ -f "$TARGET/fly.toml" ]          && echo "DEPLOY: Fly.io"
[ -f "$TARGET/.platform" ]         && echo "DEPLOY: Platform.sh"
[ -d "$TARGET/.github/workflows" ] && echo "DEPLOY: GitHub Actions present (check workflow files)"
[ -f "$TARGET/netlify.toml" ]      && echo "DEPLOY: Netlify"
[ -f "$TARGET/serverless.yml" ]    && echo "DEPLOY: Serverless Framework (AWS Lambda likely)"
[ -f "$TARGET/Dockerfile" ]        && echo "DEPLOY: Docker present"
```

---

### Step 7 — Discover key file paths

Run each block. Collect the output — these paths go directly into the Key File Paths table.

```bash
# Auth files
find "$TARGET" -type f | grep -v node_modules | grep -v ".git" | grep -v dist | \
  grep -iE "(auth\.|login\.|logout\.|session\.|middleware.*auth|auth.*middleware|ProtectedRoute|withAuth|requireAuth)" | \
  head -15

# API route files
find "$TARGET" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) | \
  grep -v node_modules | grep -v ".git" | \
  xargs grep -l -E "(app\.(get|post|put|patch|delete)|router\.(get|post|put|patch|delete)|@app\.(get|post|put|patch|delete)|@router\.(get|post|put|patch|delete))" \
  2>/dev/null | head -15

# Database / schema / ORM files
find "$TARGET" -type f | grep -v node_modules | grep -v ".git" | \
  grep -iE "(schema\.|\.prisma$|drizzle\.config|models\.|migration|db\.|database\.)" | \
  head -15

# Environment and config files (paths only — never print contents)
find "$TARGET" -maxdepth 3 -type f | grep -v node_modules | \
  grep -iE "(\.env|\.env\.|config\.|settings\.)" | \
  grep -v ".git" | head -10

# Frontend entry point
find "$TARGET" -maxdepth 5 -type f | grep -v node_modules | grep -v ".git" | \
  grep -E "(App\.(tsx|jsx|ts|js)$|main\.(tsx|jsx|ts|js)$|index\.(tsx|jsx|ts|js)$)" | \
  grep -iE "(src/|app/|pages/)" | head -5

# Middleware directory or file
find "$TARGET" -type f | grep -v node_modules | grep -v ".git" | \
  grep -iE "middleware" | head -10

# Test files location
find "$TARGET" -type d | grep -v node_modules | grep -v ".git" | \
  grep -iE "(test|spec|__tests__|e2e)" | head -5
```

---

### Step 8 — Collect project statistics

```bash
# JS/TS source files (exclude node_modules, dist, .next, build)
find "$TARGET" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | \
  grep -v node_modules | grep -v "/.next/" | grep -v "/dist/" | grep -v "/build/" | wc -l

# Python files
find "$TARGET" -type f -name "*.py" | grep -v __pycache__ | grep -v ".git" | wc -l

# Rough endpoint count
grep -r -E "\.(get|post|put|patch|delete)\(|@app\.(get|post|put|patch|delete)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v ".git" | wc -l

# Direct dependency count
[ -f "$TARGET/package.json" ] && \
  cat "$TARGET/package.json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('dependencies',{})))" \
  2>/dev/null || echo "0"

# External service integrations
grep -r -iE "(stripe|sendgrid|mailgun|twilio|cloudinary|openai|anthropic|pusher|segment|mixpanel|sentry|datadog|resend|brevo)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v ".git" | \
  grep -oiE "(stripe|sendgrid|mailgun|twilio|cloudinary|openai|anthropic|pusher|segment|mixpanel|sentry|datadog|resend|brevo)" | \
  sort -u
```

---

### Step 9 — Write `audit-context.md`

Copy `templates/audit-context-template.md` to `$OUT/audit-context.md`.

Fill in every field using the data from steps 2–8. Rules:
- Every table cell must have a value — no empty cells. Use `N/A` if genuinely not applicable.
- Tech stack labels must exactly match the allowed values in `templates/audit-schema.md`.
- Key Paths rows: list all matching paths found, comma-separated on one line. Mark `N/A` if nothing was found.
- For the Notes field: record anything unusual — Supabase/Firebase projects (require RLS audit), monorepo structure, custom auth implementations, projects that appear to have no auth at all, `.env` files found in version control (flag this immediately), or any stack field that could not be auto-detected.

**Special flags to add to Notes if detected:**
- `⚠️ Supabase detected — audit-database must check Row Level Security policies`
- `⚠️ Firebase detected — audit-database must check Firestore/RTDB security rules`
- `⚠️ No auth library detected — verify whether auth exists before running audit-auth`
- `⚠️ .env file found at [path] — check if committed to git history`

Remove the `> Produced by /audit-setup` instruction line from the template before saving.

---

### Step 10 — Write `audit-findings.md`

Copy `templates/audit-findings-template.md` to `$OUT/audit-findings.md`.

Replace the header placeholders with real values:
- `[Project Name]` → project name from context
- `YYYY-MM-DD` → today's date
- `full | speed` → chosen mode
- `[name]` → auditor name

Remove the commented-out example finding block (`<!-- Example of a completed finding block ... -->`).

Leave the per-skill section headers intact — they are the scaffolding that each skill appends its content into.

---

### Step 11 — Print handoff summary

Print the following summary to confirm setup is complete. Include the exact command to run the first skill.

```
## /audit-setup complete ✓

Project:   [name]
Stack:     [Frontend] + [Backend] + [Database] ([ORM]) + [Auth Method]
Mode:      full | speed
Output:    ./audit-reports/YYYY-MM-DD/

Files created:
  ✓ audit-context.md
  ✓ audit-findings.md

Key paths found:
  Auth:       [paths or "none found — manual review needed"]
  API routes: [paths or "none found — manual review needed"]
  DB/schema:  [paths or "none found — manual review needed"]

[Any ⚠️ flags from Notes]

Run next:
  /audit-secrets ./audit-reports/YYYY-MM-DD/audit-context.md
```

If any tech stack field could not be determined automatically, list it explicitly before the "Run next" line:

```
Needs manual review in audit-context.md before proceeding:
  - Auth Method: could not be detected
  - Deployment: could not be detected
```

---

## Done When

- [ ] `$OUT/audit-context.md` exists and every table field is filled (no empty cells, no placeholder text)
- [ ] `$OUT/audit-findings.md` exists with the correct project header and all 7 skill section headers present
- [ ] Handoff summary printed with the exact next command
- [ ] Any `⚠️` flags from Notes are visible in the summary output

---

## Security Note

Never print, echo, or include the contents of `.env` files, `secrets.*` files, or any file containing credentials in your output. Record only their file paths. If you encounter credentials in plain source files during discovery, note the path in the summary as a likely `SEC` finding for `/audit-secrets` to investigate.
