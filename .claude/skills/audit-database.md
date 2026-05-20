# /audit-database

Audits database interactions for SQL injection, insecure query construction, ORM misuse, connection security, and schema weaknesses. Non-developer applications routinely use string-concatenated queries and skip database constraints entirely.

Run after `/audit-setup`. Can run in parallel with `/audit-secrets`, `/audit-auth`, `/audit-frontend`, `/audit-dependencies`.

**Scope boundary with `/audit-api`:** this skill audits the query layer; `/audit-api` audits the HTTP layer that feeds it. If a route passes unvalidated `req.body` directly to a query found here, add a `**Cross-ref:**` to the corresponding `API-` finding.

---

## Invocation

```
/audit-database <output-dir>
```

Reads `<output-dir>/audit-context.md`. Appends to the `## audit-database` section of `<output-dir>/audit-findings.md`.

---

## What This Skill Covers

| Check | Description |
|-------|-------------|
| SQL injection | String concatenation and template literal query construction |
| ORM injection surfaces | Raw query methods in Prisma, Drizzle, Sequelize, Mongoose |
| Parameterization | Verify safe queries use placeholders, not concatenation |
| Connection security | SSL/TLS enforcement, connection string handling, pool config |
| Schema integrity | Missing constraints, nullable critical columns, missing indexes |
| Sensitive data at rest | Unencrypted PII, password column types |
| Privilege analysis | Database user permissions inferable from connection config |
| Platform-specific | Supabase RLS, Firebase security rules, migration safety |

---

## Steps

### Step 1 — Read audit context

Read `<output-dir>/audit-context.md` and extract:
- `TARGET` — project root
- `Database` — PostgreSQL / MySQL / MongoDB / SQLite / Supabase / Firebase / None
- `ORM / Query builder` — Prisma / Drizzle / Sequelize / Mongoose / raw / None
- `Database schema / models` and `ORM config / migrations` — paths to examine

Set `FINDINGS="<output-dir>/audit-findings.md"`.

If Database is `None` or `N/A`: write a passing note and exit. If Database is `Supabase` or `Firebase`, jump to Step 8 after completing Steps 5–6.

---

### Step 2 — SQL injection via string concatenation

The highest-severity check. Look for queries built by joining strings or using template literals with variables.

```bash
# Template literal SQL — the clearest injection signal
grep -r -n -E "(\`|\"|\')(SELECT|INSERT|UPDATE|DELETE|WHERE|FROM|JOIN).*\$\{" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# String concatenation in SQL
grep -r -n -iE "(SELECT|INSERT|UPDATE|DELETE|WHERE).*['\"].*\+" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Python f-string SQL
grep -r -n -E "f['\"].*(SELECT|INSERT|UPDATE|DELETE|WHERE).*\{" \
  --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v __pycache__

# Python % formatting in SQL
grep -r -n -E "(SELECT|INSERT|UPDATE|DELETE).*%\s*[(\[]" \
  --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v __pycache__
```

Any SQL query where a variable is interpolated directly (not via a placeholder) is a potential injection point. Read each match in context: is the variable user-supplied or an internal constant?

- User-supplied variable in SQL → CRITICAL
- Internal constant (hardcoded ID, enum value) in SQL → LOW (not exploitable but bad pattern)

---

### Step 3 — ORM injection surfaces

Most ORM operations are parameterized by default. These are the escape hatches that reintroduce injection risk.

**Prisma:**
```bash
grep -r -n -iE "(\$queryRaw|\$executeRaw|\$queryRawUnsafe|\$executeRawUnsafe)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```
- `$queryRaw` with template literal: `` prisma.$queryRaw`SELECT * WHERE id = ${userId}` `` → safe (Prisma handles parameterization in tagged template literals)
- `$queryRaw(Prisma.sql`...`)` → safe
- `$queryRawUnsafe(sql, ...values)` → check if values are passed as parameters
- `$queryRawUnsafe("SELECT * WHERE id = " + userId)` → CRITICAL

**Drizzle:**
```bash
grep -r -n -iE "(sql\.raw\s*\(|sql`[^`]*\$\{)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```
- `sql.raw(userInput)` → CRITICAL
- `sql\`WHERE id = ${userId}\`` → safe (Drizzle parameterizes tagged template interpolations)

**Sequelize:**
```bash
grep -r -n -iE "sequelize\.query\s*\(" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```
For each `sequelize.query()` call, read it in full: does it use `replacements: [values]` or `bind: { values }`? If not, it's a raw string query → HIGH.

**Mongoose operator injection:**
```bash
# User-supplied objects passed directly to find/findOne (MongoDB operator injection)
grep -r -n -iE "\.(find|findOne|findById|updateOne|deleteOne)\s*\(\s*(req\.body|req\.query|req\.params)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```
Passing `req.body` directly to `find()` allows `{ "$where": "..." }` injection → HIGH.

---

### Step 4 — Parameterized query verification

Confirm that non-ORM raw queries use parameterized placeholders.

```bash
# pg (node-postgres) — correct pattern uses $1, $2 placeholders
grep -r -n -iE "client\.(query|execute)\s*\(" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | head -20

# mysql2 — correct pattern uses ? placeholders
grep -r -n -iE "connection\.(query|execute)\s*\(" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | head -20

# Python — psycopg2 correct pattern uses %s with tuple
grep -r -n -iE "cursor\.(execute|executemany)\s*\(" \
  --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v __pycache__ | head -20
```

For each query call found, read the SQL string argument:
- `client.query('SELECT * FROM users WHERE id = $1', [userId])` → correct
- `client.query('SELECT * FROM users WHERE id = ' + userId)` → CRITICAL (already flagged in Step 2, but cross-check here)

---

### Step 5 — Connection security

```bash
# SSL/TLS in connection config
grep -r -n -iE "(ssl\s*:|sslmode|ssl\s*=\s*true|rejectUnauthorized)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Connection pool settings
grep -r -n -iE "(pool\s*:\s*\{|connectionLimit|max\s*:|min\s*:)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Connection timeout
grep -r -n -iE "(connectionTimeout|connect_timeout|idleTimeoutMillis)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

**Key checks:**
- `rejectUnauthorized: false` → HIGH (SSL certificate validation disabled; MITM attacks possible)
- No SSL config at all for a remote database (non-localhost DATABASE_URL) → HIGH
- No connection timeout configured → MEDIUM (resource exhaustion from hung connections)
- Connection pool `max` not set or very large (> 20 for a typical app) → LOW

**Note:** The actual DATABASE_URL value (credentials) is handled by `/audit-secrets`. Here we only evaluate the structural security of the connection configuration.

---

### Step 6 — Schema integrity

Examine schema files, Prisma schema, or migration files for structural weaknesses.

```bash
# Find schema definition files
find "$TARGET" -type f \( \
  -name "*.prisma" -o \
  -name "schema.sql" -o \
  -name "*.sql" -o \
  -name "models.py" -o \
  -name "models.ts" \
\) | grep -v node_modules | grep -v "/.git/"
```

Read the schema and check:

**Missing NOT NULL constraints:**
- Columns that should never be null (e.g. `userId`, `email`, `createdAt`) defined as nullable → MEDIUM
- Especially: foreign key columns nullable without a clear reason

**Missing unique constraints:**
- `email` column without `@unique` (Prisma) or `UNIQUE` constraint → HIGH (duplicate account registration possible)
- Any column used as a lookup key without uniqueness enforcement

**Missing foreign key constraints:**
- Relationships without declared FK constraints → MEDIUM (orphaned records, data integrity issues)

**Missing indexes on lookup columns:**
- Columns used in `WHERE` clauses (e.g. `userId`, `sessionToken`, `email`) without an index → MEDIUM (performance degrades as data grows, but not a direct security issue — note as code quality)

**Password column type:**
- `password VARCHAR(60)` or `password TEXT` — acceptable for bcrypt hashes
- `password VARCHAR(20)` or shorter → HIGH (too short for any real hash; likely plain text or broken hashing)

---

### Step 7 — Sensitive data at rest

```bash
# PII columns in schema
grep -r -n -iE "(ssn|national_id|passport|credit_card|card_number|cvv|bank_account|tax_id|date_of_birth|dob)" \
  --include="*.prisma" --include="*.sql" --include="*.py" --include="*.ts" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Encryption usage
grep -r -n -iE "(encrypt|decrypt|aes|cipher|createCipheriv|cryptography\.fernet)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

**Evaluate:**
- PII fields (SSN, card numbers, government IDs) with no encryption → HIGH
- Sensitive fields stored as plain text with no encryption at rest → MEDIUM
- Application-level encryption present for PII → no finding (note as passing)

Note: password hashing is covered in `/audit-auth`. This step focuses on non-password sensitive data.

---

### Step 8 — Platform-specific checks

Run the section matching `Database` from audit context.

---

#### Supabase

```bash
# Check if RLS is enabled on tables — look for RLS policy definitions
find "$TARGET" -type f | grep -v node_modules | \
  xargs grep -l -iE "(enable row level security|create policy|alter table.*enable)" 2>/dev/null

# Check for service role key usage bypassing RLS (cross-ref with audit-auth)
grep -r -n -iE "(SUPABASE_SERVICE_ROLE|createClient.*service_role)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Tables created in migrations — check each for RLS
find "$TARGET" -name "*.sql" -o -name "*migration*" | grep -v node_modules | \
  xargs grep -n -iE "create table" 2>/dev/null
```

**Evaluate:**
- Tables with no RLS policies in a Supabase project → CRITICAL (any authenticated user can read/write all rows)
- Service role key used in a context reachable by end users → HIGH (RLS bypass)
- `anon` key used for admin operations → HIGH

Correct pattern: every table should have `ENABLE ROW LEVEL SECURITY` plus at least one `CREATE POLICY` that restricts access by `auth.uid()`.

---

#### Firebase / Firestore

```bash
# Find Firestore security rules
find "$TARGET" -name "firestore.rules" -o -name "*.rules" | grep -v node_modules

# Find Realtime Database rules
find "$TARGET" -name "database.rules.json" | grep -v node_modules
```

Read the rules files. Check for:
- `allow read, write: if true;` → CRITICAL (anyone can read/write everything)
- `allow read, write: if request.auth != null;` → HIGH (any authenticated user can read/write all documents)
- Missing `request.resource.data` validation → MEDIUM (no input validation at the DB layer)
- Correct pattern: rules should check `request.auth.uid == resource.data.userId` for user-owned documents

---

#### Migration safety

```bash
find "$TARGET" -type f \( -name "*.sql" -o -path "*/migrations/*" \) | \
  grep -v node_modules | grep -v "/.git/" | sort | head -30
```

Read recent migration files and check:
- `DROP TABLE` or `DROP COLUMN` without a corresponding backup or check → MEDIUM (data loss risk if run on wrong environment)
- `ALTER TABLE ... ADD COLUMN ... NOT NULL` without a default value → MEDIUM (will fail on non-empty tables)
- Migrations that modify data (UPDATE statements) without a transaction wrapper → MEDIUM

---

### Step 9 — Classify and write findings

For every issue flagged in Steps 2–8:

1. Confirm it is a real finding — not a test fixture, seed file, or migration already rolled back
2. Assign a `DB-NNN` ID starting at `DB-001`
3. Assign severity using the guide below
4. Write each finding into the `## audit-database` section of `$FINDINGS`

Replace the section header with actual timestamp. Update the blockquote summary.

---

## Severity Guide for This Skill

| Condition | Severity |
|-----------|----------|
| User-supplied variable concatenated into SQL string | CRITICAL |
| `$queryRawUnsafe` / `sql.raw()` with user input | CRITICAL |
| Mongoose `find(req.body)` — operator injection | CRITICAL |
| Supabase tables with no RLS policies | CRITICAL |
| Firebase rules `allow read, write: if true` | CRITICAL |
| `rejectUnauthorized: false` on DB SSL connection | HIGH |
| No SSL on remote DB connection | HIGH |
| Email column without unique constraint | HIGH |
| Sequelize `query()` without replacements | HIGH |
| Firebase rules permit any authenticated user full access | HIGH |
| Supabase service role key in user-facing code | HIGH |
| PII column stored unencrypted | HIGH |
| Short password column (likely plain text) | HIGH |
| No connection timeout configured | MEDIUM |
| Missing NOT NULL on critical FK columns | MEDIUM |
| Missing FK constraints | MEDIUM |
| Sensitive data without application-level encryption | MEDIUM |
| Unsafe migration (DROP without backup, ADD NOT NULL without default) | MEDIUM |
| Missing indexes on frequently queried columns | LOW |
| Internal constant (not user-supplied) in SQL string | LOW |

---

## Done When

- [ ] All query construction code read and evaluated (not just grep output)
- [ ] ORM raw escape hatches checked for each detected ORM
- [ ] Schema files read and checked for constraints and sensitive columns
- [ ] Platform-specific section run if Supabase or Firebase detected
- [ ] All findings written with correct `DB-NNN` IDs
- [ ] Section summary updated
- [ ] Handoff: print `"audit-database complete — [N] findings. Next: run remaining parallel skills or /audit-api <output-dir>"`
