# /audit-api

Audits all API endpoints for security vulnerabilities including input validation gaps, CORS misconfiguration, missing security headers, information disclosure in errors, IDOR, and mass assignment. Runs after the parallel group so it can cross-reference auth and database findings.

Run after `/audit-secrets`, `/audit-auth`, `/audit-database`, `/audit-frontend`, `/audit-dependencies` have all completed.

**Scope boundaries:**
- `/audit-auth` covers whether routes have auth middleware — this skill covers everything *else* about how routes handle requests
- `/audit-database` covers SQL injection at the query level — this skill covers the API surface that feeds those queries (missing input validation that creates the injection opportunity)
- Where these overlap, record the finding in whichever skill detected it and add a `**Cross-ref:**` note in the other

---

## Invocation

```
/audit-api <output-dir>
```

| Argument | Description |
|----------|-------------|
| `<output-dir>` | Path to the audit output directory, e.g. `./audit-reports/2025-01-15/` |

Reads `<output-dir>/audit-context.md` and existing findings in `<output-dir>/audit-findings.md`. Appends to the `## audit-api` section.

---

## What This Skill Covers

| Check | Description |
|-------|-------------|
| Endpoint enumeration | Complete map of all API routes and their handlers |
| Input validation | Schema validation coverage on all mutation endpoints |
| CORS configuration | Origin restrictions, credentials flag, method allowlist |
| HTTP security headers | Helmet / manual header coverage |
| Error handling | Stack traces and sensitive data in error responses |
| Rate limiting | Per-endpoint limits on mutation and auth-adjacent routes |
| Request size limits | Body size limits, file upload size enforcement |
| IDOR | Ownership checks on resource-by-ID endpoints |
| Mass assignment | Unfiltered `req.body` spread into ORM create/update |
| File upload security | Type validation, size limits, storage path safety |
| GraphQL-specific | Introspection, depth limiting, query complexity (if applicable) |

---

## Steps

### Step 1 — Read context and prior findings

Read `<output-dir>/audit-context.md` and extract:
- `TARGET` — project root path
- `Backend` — to know the routing framework
- `Frontend` — to know if Next.js API routes are in scope
- `Database` / `ORM` — to understand what queries flow through these routes
- `External integrations` — services whose webhooks need verification

Then scan `<output-dir>/audit-findings.md` for:
- Any `AUTH-` findings about unprotected routes → note their paths for Step 2
- Any `DB-` findings about injection-vulnerable queries → note the function names for Step 3
- Any `SEC-` findings about exposed credentials used in API calls

Set `FINDINGS="<output-dir>/audit-findings.md"`.

---

### Step 2 — Enumerate all API endpoints

Build a complete picture of every API route before scanning for issues. This list is the foundation for Steps 3–10.

**Express / Fastify / Hono (Node.js):**
```bash
# All route definitions with line numbers
grep -r -n -E "(app|router)\.(get|post|put|patch|delete|all)\s*\(['\"]" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "/dist/"

# Router files that are mounted on a prefix
grep -r -n -iE "(app\.use\s*\(['\"]\/[^'\"]+['\"],|router\.use\s*\(['\"])" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

**Next.js API routes:**
```bash
# Pages router (/pages/api/)
find "$TARGET/pages/api" -type f \( -name "*.ts" -o -name "*.js" \) \
  2>/dev/null | grep -v node_modules | sort

# App router (/app/**/route.ts)
find "$TARGET/app" -name "route.ts" -o -name "route.js" \
  2>/dev/null | grep -v node_modules | sort

# Exported HTTP method handlers in app router
grep -r -n -E "^export (async )?function (GET|POST|PUT|PATCH|DELETE)" \
  --include="*.ts" --include="*.js" \
  "$TARGET/app" 2>/dev/null
```

**Python (Django/Flask/FastAPI):**
```bash
grep -r -n -iE "(@app\.(get|post|put|patch|delete)|@router\.(get|post|put|patch|delete)|path\(|url\(|re_path\()" \
  --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v __pycache__ | grep -v ".git"
```

**Document the full endpoint list.** For each endpoint note: method, path, and whether `/audit-auth` already flagged it as unprotected. This list is referenced in every subsequent step.

---

### Step 3 — Input validation coverage

Check whether endpoints validate and sanitize incoming data before using it.

```bash
# Zod (most common in TS projects)
grep -r -n -iE "(z\.object\s*\(|z\.string\(\)|z\.number\(\)|\.parse\s*\(|\.safeParse\s*\()" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Joi
grep -r -n -iE "(Joi\.(object|string|number|array)|\.validate\s*\()" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Yup
grep -r -n -iE "(yup\.(object|string|number)|\.validate\s*\()" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Pydantic / FastAPI (Python)
grep -r -n -iE "(BaseModel|Field\s*\(|pydantic)" \
  --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v __pycache__

# Direct req.body property access with no schema check
grep -r -n -iE "req\.body\.([\w]+)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

**Reasoning step:** For every POST / PUT / PATCH endpoint from Step 2:
1. Find its handler function
2. Is user input validated with a schema (Zod/Joi/Pydantic) before it's used?
3. Or is `req.body.fieldName` accessed and used directly?

Endpoints that mutate data (create, update, delete) with no schema validation → HIGH.
Endpoints that pass `req.body` directly to a database query → cross-reference with DB findings, record as HIGH here too.

---

### Step 4 — CORS configuration

```bash
# CORS middleware usage
grep -r -n -iE "(cors\s*\(|require\(['\"]cors['\"])" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Origin setting
grep -r -n -iE "origin\s*[=:]\s*" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Credentials flag
grep -r -n -iE "credentials\s*:\s*true" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Python CORS
grep -r -n -iE "(CORSMiddleware|allow_origins|CORS_ALLOWED_ORIGINS)" \
  --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v __pycache__
```

**Read the full CORS configuration block.** Evaluate:

| Configuration | Risk | Severity |
|--------------|------|----------|
| `origin: "*"` with `credentials: true` | Any site can make credentialed requests — CSRF via CORS | CRITICAL |
| `origin: "*"` without credentials | Any site can read public API responses — acceptable for public APIs, bad for private ones | HIGH for private API, acceptable for genuinely public |
| `origin: [list of specific domains]` | Correct — verify the list doesn't include `null` or `localhost` in production | Check values |
| `origin: /.*\.domain\.com$/` — regex | Check for regex bypass: `evilattacker.domain.com.evil.com` | MEDIUM if regex is loose |
| No CORS configuration at all | Browser prevents cross-origin requests by default — but check if API is meant to be called cross-origin | May be intentional |
| `allow_origins=["*"]` (FastAPI/Django) | Same as wildcard origin | HIGH |

---

### Step 5 — HTTP security headers

```bash
# Helmet.js (Express)
grep -r -n -iE "(require\(['\"]helmet['\"]|import.*helmet|app\.use\s*\(helmet)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Manual security headers
grep -r -n -iE "(setHeader\s*\(['\"]|res\.set\s*\(['\"])" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -iE "(security|frame|content-type|transport|policy|referrer)" | head -20

# Next.js headers config
grep -r -n -iE "headers\s*\(\s*\)" \
  --include="*.ts" --include="*.js" \
  "$TARGET/next.config*" 2>/dev/null

# Python security headers
grep -r -n -iE "(X-Frame-Options|Content-Security-Policy|Strict-Transport|X-Content-Type)" \
  --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v __pycache__
```

**Check which headers are set.** The minimum required set for production:

| Header | Purpose | Finding if missing |
|--------|---------|-------------------|
| `X-Content-Type-Options: nosniff` | Prevents MIME sniffing | MEDIUM |
| `X-Frame-Options: DENY` or CSP `frame-ancestors` | Clickjacking prevention | MEDIUM |
| `Strict-Transport-Security` | Force HTTPS | MEDIUM (HIGH if the app handles payments/PII) |
| `Content-Security-Policy` | XSS mitigation layer | MEDIUM |
| `Referrer-Policy` | Controls referrer leakage | LOW |
| `Permissions-Policy` | Controls browser features | LOW |

If Helmet is present and not configured to disable any headers → likely covered, note as passing. If Helmet is absent and no manual headers exist → MEDIUM for each missing header (group into one finding with a list).

---

### Step 6 — Error handling and information disclosure

```bash
# Stack traces sent in API responses
grep -r -n -iE "(error\.stack|err\.stack)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "/test" | grep -v "/spec"

# Error objects sent directly in responses
grep -r -n -iE "(res\.(json|send)\s*\(\s*\{[^}]*error|json\s*\(\s*error\b|json\s*\(\s*err\b)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Global error handler existence
grep -r -n -iE "(app\.use\s*\([^)]*err[^)]*,\s*req|errorHandler|globalErrorHandler)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Python — Django DEBUG mode or Flask debug
grep -r -n -iE "(DEBUG\s*=\s*True|app\.run\s*\([^)]*debug\s*=\s*True)" \
  --include="*.py" --include="*.env*" \
  "$TARGET" 2>/dev/null | grep -v __pycache__

# try/catch that passes raw error to response
grep -r -n -iE "catch\s*\([^)]*\)\s*\{[^}]*(res\.json|res\.send|response\.json)\s*\(\s*(err|error|e)\b" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

**Evaluate:**
- `error.stack` included in API response → HIGH (reveals file paths, line numbers, framework internals)
- Raw error object sent: `res.json(err)` → HIGH (may include stack, internal state)
- No global error handler → MEDIUM (unhandled errors may crash with default framework response containing internals)
- `DEBUG=True` in Python production config → HIGH (full stack traces and variable state in browser)
- Catch block returns `{ error: error.message }` → MEDIUM (message may contain table names, query structure, etc.)

Correct pattern: catch errors, log them internally, return only a generic message to the client:
```typescript
catch (err) {
  console.error(err) // log internally
  res.status(500).json({ error: 'Internal server error' }) // generic to client
}
```

---

### Step 7 — Rate limiting

```bash
# Global rate limiter setup
grep -r -n -iE "(rateLimit|rate-limiter|rateLimiter|slowDown|@upstash/ratelimit|throttle)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Per-route rate limiter application
grep -r -n -iE "(app\.use\s*\(['\"]\/api|router\.use\s*\()" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -iE "(limit|throttle|rate)"

# Next.js — check for rate limiting in API route handlers
grep -r -n -iE "(upstash|ratelimit|limit\s*\()" \
  "$TARGET/pages/api" "$TARGET/app" 2>/dev/null | grep -v node_modules | head -20
```

**Evaluate by endpoint type** (reference the endpoint list from Step 2):

| Endpoint type | Rate limit required | Finding if absent |
|--------------|--------------------|--------------------|
| Login / token refresh | Yes — critical | HIGH |
| Password reset / forgot password | Yes — prevents email flooding | HIGH |
| Registration / sign-up | Yes — prevents account farming | HIGH |
| Any mutation (POST/PUT/DELETE) | Recommended | MEDIUM |
| File upload | Yes — prevents storage exhaustion | MEDIUM |
| Read-only GET (public) | Optional | LOW |

---

### Step 8 — Request body size limits

```bash
# Express body-parser / express.json limits
grep -r -n -iE "(express\.json\s*\(\s*\{|express\.urlencoded\s*\(\s*\{|bodyParser\.(json|urlencoded)\s*\(\s*\{)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Multer file upload config
grep -r -n -iE "(multer\s*\(\s*\{|limits\s*:\s*\{|fileSize\s*:)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Fastify body limit
grep -r -n -iE "(bodyLimit|maxParamLength)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Next.js API route body size config
grep -r -n -iE "(bodyParser\s*:\s*\{|sizeLimit\s*:)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

**Triage:**
- File upload endpoint with no `fileSize` limit → HIGH (storage exhaustion / DoS)
- `express.json()` with no `limit` option → MEDIUM (default is 100kb in Express 4; acceptable for most apps, but should be explicit)
- `express.json({ limit: '50mb' })` on a non-file endpoint → MEDIUM (unusually large — ask why)

---

### Step 9 — IDOR and mass assignment

**IDOR (Insecure Direct Object Reference):**

IDOR is one of the most common logical vulnerabilities — a route accepts a resource ID from the user but never verifies the requesting user owns that resource.

```bash
# Routes using URL parameters that look like resource IDs
grep -r -n -E "(req\.params\.(id|userId|postId|orderId|[a-z]+Id)|params\['id'\])" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Python equivalent
grep -r -n -iE "(request\.path_params|kwargs\[.id.\]|<int:id>|<uuid:id>)" \
  --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v __pycache__
```

For each route that uses an ID parameter, read the handler and check:
- Does the query include a `WHERE userId = currentUser.id` (or equivalent ownership check)?
- Or does it just do `WHERE id = req.params.id` with no ownership filter?

```bash
# Ownership check patterns (good)
grep -r -n -iE "(userId.*currentUser|owner.*session|createdBy.*auth|user_id.*request\.user)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

**Mass assignment:**

```bash
# Spreading entire req.body into ORM create/update (dangerous)
grep -r -n -iE "\.(create|update|insert|updateOne|updateMany)\s*\(\s*(req\.body|\.\.\.(req\.body|body))" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Python ORM equivalents
grep -r -n -iE "(\.save\s*\(\s*\)|update\s*\(\s*\*\*request\.data|serializer\.save)" \
  --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v __pycache__

# Object spread from request (check what gets spread)
grep -r -n -iE "\.\.\.(req\.body|request\.body|data)\b" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "test\|spec"
```

**Triage:**
- `findById(req.params.id)` with no ownership check on a user-resource endpoint → HIGH (any authenticated user can read/modify any resource)
- `.create(req.body)` or `.update(...req.body)` without field allowlisting → HIGH (attacker can set `isAdmin: true`, `role: 'admin'`, etc.)
- `update(...req.body)` on a profile endpoint → CRITICAL if the body can include `role` or `permissions` fields

---

### Step 10 — File upload security

Only run this step if file upload endpoints exist (detected in Step 2 or via grep below).

```bash
# Find file upload handlers
grep -r -n -iE "(multer|formidable|busboy|upload\s*\(|multipart)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# MIME type / file type validation
grep -r -n -iE "(mimetype|fileFilter|allowedTypes|mimeType|\.type\s*===)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# File size limits (also checked in Step 8)
grep -r -n -iE "(fileSize\s*:|maxSize\s*:|limits\s*:\s*\{)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# File storage destination / path construction
grep -r -n -iE "(destination\s*:|path\.join.*upload|__dirname.*upload|originalname)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

**Evaluate each upload handler:**

| Check | Finding if bad |
|-------|----------------|
| `fileFilter` that validates MIME type | If absent: HIGH — arbitrary file types accepted |
| Server-side MIME check (not just client Content-Type header) | If only trusting client header: HIGH |
| `fileSize` limit set | If absent: HIGH (storage exhaustion) |
| Uploaded file stored with user-controlled filename or `originalname` | HIGH — path traversal / overwrite attack |
| Files stored in web-accessible directory (`/public`) | MEDIUM — direct URL access to uploaded files |

Safe pattern: rename uploaded files to a UUID on the server, validate MIME by reading file magic bytes (not just the Content-Type header), store outside webroot or in an object storage service.

---

### Step 11 — GraphQL-specific checks

Only run this step if GraphQL is detected.

```bash
# Detect GraphQL
grep -r -n -iE "(graphql|apollo-server|type-graphql|nexus|pothos)" \
  --include="*.ts" --include="*.js" \
  "$TARGET/package.json" 2>/dev/null | grep -v node_modules

grep -r -n -iE "(ApolloServer|createSchema|makeExecutableSchema|buildSchema)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

If GraphQL is present:

```bash
# Introspection enabled in production
grep -r -n -iE "(introspection\s*:\s*true|introspection\s*:\s*process\.env)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Depth limiting
grep -r -n -iE "(depthLimit|depth.?limit|maxDepth|complexity.?limit)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Query complexity limiting
grep -r -n -iE "(complexityLimit|createComplexityRule|queryComplexity)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Authentication on resolvers
grep -r -n -iE "(context\.user|ctx\.user|context\.auth|isAuthenticated)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | head -20
```

**Triage:**
- Introspection enabled in production (`NODE_ENV === 'production'`) → HIGH (exposes full schema to attackers)
- No depth limiting → HIGH (deeply nested queries cause DoS)
- No query complexity limiting → MEDIUM
- Resolvers accessing data without checking `context.user` → treat as IDOR, HIGH

---

### Step 12 — Classify and write findings

For every issue flagged in Steps 3–11:

1. Confirm it is a real finding — not a test, intentional public endpoint, or correctly handled case
2. Assign an `API-NNN` ID starting at `API-001`
3. Assign severity using the guide below
4. Write each finding into the `## audit-api` section of `$FINDINGS` using the exact format from `templates/audit-schema.md`

For findings that overlap with `AUTH-` or `DB-` findings, add a `**Cross-ref:**` line:
```markdown
**Cross-ref:** AUTH-003 — this route was also flagged as missing auth middleware
```

Replace the section header with the actual timestamp. Update the blockquote summary with actual counts.

---

## Severity Guide for This Skill

| Condition | Severity |
|-----------|----------|
| Wildcard CORS (`origin: "*"`) with `credentials: true` | CRITICAL |
| IDOR — resource endpoint with no ownership check | CRITICAL |
| Mass assignment spreading `req.body` into ORM with role/permission fields settable | CRITICAL |
| Input mutation endpoint with no validation, directly calling DB | CRITICAL |
| `DEBUG=True` in production Python config | HIGH |
| Stack trace or raw error object returned in API response | HIGH |
| Wildcard CORS on a private (authenticated) API | HIGH |
| No schema validation on any mutation endpoint | HIGH |
| File upload with no MIME type validation | HIGH |
| File upload with no size limit | HIGH |
| Uploaded files stored with user-controlled filename | HIGH |
| GraphQL introspection enabled in production | HIGH |
| GraphQL no depth limiting | HIGH |
| No rate limiting on login, registration, or password reset endpoints | HIGH |
| Missing `httpOnly` / `Secure` on cookies (if not caught by auth skill) | HIGH |
| Mass assignment on non-privilege fields (e.g. spreading body into `updatedAt`) | MEDIUM |
| Missing security headers (group all missing headers into one finding) | MEDIUM |
| No global error handler (unhandled errors may expose internals) | MEDIUM |
| `express.json()` with no explicit size limit | MEDIUM |
| Files stored in web-accessible directory | MEDIUM |
| No rate limiting on general mutation endpoints | MEDIUM |
| Loose CORS regex that can be bypassed | MEDIUM |
| GraphQL no query complexity limiting | MEDIUM |
| Missing `Referrer-Policy` or `Permissions-Policy` only | LOW |
| Verbose error messages without sensitive data | LOW |

---

## Done When

- [ ] Complete endpoint list built from Step 2
- [ ] All 11 steps run (Step 11 only if GraphQL detected)
- [ ] Every endpoint triaged for input validation, rate limiting, and IDOR
- [ ] CORS config fully read and evaluated (not just detected)
- [ ] All findings written with correct `API-NNN` IDs and cross-refs where applicable
- [ ] Section summary updated with actual counts
- [ ] Handoff: print `"audit-api complete — [N] findings. Next: /audit-business-logic <output-dir>"`
