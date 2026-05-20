# /audit-auth

Audits the authentication and session management implementation for security vulnerabilities. Authentication failures are the most exploited class of vulnerability in non-developer applications — weak password hashing, missing route protection, and insecure token handling are common.

Run after `/audit-setup`. Can run in parallel with `/audit-secrets`, `/audit-database`, `/audit-frontend`, `/audit-dependencies`.

**Scope boundary with `/audit-secrets`:** secrets covers whether credentials are hardcoded; this skill covers whether auth is *implemented correctly*. If you find a hardcoded JWT secret here, record it as a cross-reference to `/audit-secrets` rather than a new SEC finding.

---

## Invocation

```
/audit-auth <output-dir>
```

| Argument | Description |
|----------|-------------|
| `<output-dir>` | Path to the audit output directory, e.g. `./audit-reports/2025-01-15/` |

Reads `<output-dir>/audit-context.md`. Appends to the `## audit-auth` section of `<output-dir>/audit-findings.md`.

---

## What This Skill Covers

| Check | Description |
|-------|-------------|
| Auth file mapping | Locate every auth-related file and understand the full implementation |
| Password storage | Hashing algorithm, salting, server-side enforcement |
| JWT security | Algorithm, expiry, storage location, refresh/revocation strategy |
| Session & cookie security | httpOnly/Secure/SameSite flags, session expiry, CSRF protection |
| Route protection coverage | Which API routes are actually protected vs. exposed |
| Client-side auth guards | Frontend-only protection that can be bypassed |
| Password reset flow | Token security, expiry, single-use enforcement |
| Account lockout | Brute force protection on login endpoints |
| User enumeration | Consistent error messages across login/reset flows |
| Auth provider config | Provider-specific checks based on stack (NextAuth, Clerk, Supabase Auth, etc.) |

---

## Steps

### Step 1 — Read audit context

Read `<output-dir>/audit-context.md` and extract:
- `TARGET` — project root path
- `Auth method` — e.g. JWT, NextAuth, Clerk, Supabase Auth, Sessions, Custom, None
- `Frontend` and `Backend` — to know where to look for middleware and guards
- `Auth files` — paths already discovered by `/audit-setup`
- Any `⚠️` flags in Notes (especially "No auth library detected")

Set `FINDINGS="<output-dir>/audit-findings.md"`.

If Auth method is `None` and no auth files were found: record `AUTH-001` as CRITICAL ("No authentication system detected") and skip to Step 12. An application with no auth at all is a single-finding skill run.

---

### Step 2 — Map the auth system

Before scanning for vulnerabilities, understand what you are auditing. Read the files identified in the Auth files path and answer these questions:

```bash
# List all auth-related files not already captured
find "$TARGET" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) | \
  grep -v node_modules | grep -v "/.git/" | grep -v "/dist/" | grep -v "/.next/server" | \
  xargs grep -l -iE "(authenticate|isAuthenticated|requireAuth|verifyToken|authMiddleware|protectedRoute|useAuth|getSession|getServerSession|currentUser)" \
  2>/dev/null

# List all route definition files to use in Step 6
find "$TARGET" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) | \
  grep -v node_modules | grep -v "/.git/" | \
  xargs grep -l -E "(app\.(get|post|put|patch|delete)|router\.(get|post|put|patch|delete)|@app\.(get|post|put|patch|delete))" \
  2>/dev/null | head -20
```

Read the main auth files. Document in a mental model:
- Where does login happen?
- What does the app issue on successful login (JWT, session cookie, both)?
- Where is that token/session validated on subsequent requests?
- What happens if validation fails?

This mental model informs every subsequent step.

---

### Step 3 — Password storage

**Detect hashing approach:**

```bash
# Good: bcrypt, argon2, scrypt, pbkdf2
grep -r -n -iE "(bcrypt|argon2|scrypt|pbkdf2|hash\.verify|checkpw|verify_password|check_password)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Bad: plain cryptographic hashes applied to passwords
grep -r -n -iE "(createHash\s*\(\s*['\"]md5|createHash\s*\(\s*['\"]sha1|createHash\s*\(\s*['\"]sha256|hashlib\.(md5|sha1|sha256|sha512)\s*\()" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | \
  xargs grep -n -iE "password|passwd|pwd" 2>/dev/null

# Check for plain text comparison (no hashing at all)
grep -r -n -iE "(password\s*===|password\s*==|password\s*!=|strcmp.*password|password.*strcmp)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "test\|spec\|mock"
```

**Read the login handler.** Find the code that processes a login request and trace:
1. Where is the submitted password compared to the stored value?
2. What function performs the comparison?
3. Is the comparison timing-safe (bcrypt.compare / argon2.verify) or a plain `===`?

**Triage:**
- Passwords compared with `===` or plain string comparison → CRITICAL
- Passwords hashed with MD5, SHA-1, or SHA-256 without a key-stretching wrapper → CRITICAL
- bcrypt/argon2/scrypt used but work factor is very low (bcrypt rounds < 10) → HIGH
- Auth provider (Clerk, Auth0, Supabase) handles passwords → no finding (record as N/A)

---

### Step 4 — JWT security

Skip this step if Auth method is Sessions, Clerk, Auth0, or Supabase Auth (those providers handle token security).

```bash
# Find all jwt.sign calls
grep -r -n -iE "jwt\.sign\s*\(" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Find all jwt.verify calls
grep -r -n -iE "jwt\.verify\s*\(" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Check algorithm specification
grep -r -n -iE "(algorithm|algorithms)\s*:\s*['\"]" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Check for explicit expiresIn / exp
grep -r -n -iE "(expiresIn|exp\s*:|expires_in)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

**Read each `jwt.sign` and `jwt.verify` call in full context.** Evaluate:

| Question | Finding if answer is bad |
|----------|--------------------------|
| Is `expiresIn` set on `jwt.sign`? | HIGH — tokens never expire |
| Is the algorithm explicitly set to `RS256` or `ES256`? | If not set, or set to `HS256`, check secret strength; `none` → CRITICAL |
| Is `jwt.verify` called with `algorithms` allowlist? | HIGH — alg confusion attack possible |
| Is the secret loaded from `process.env` (not hardcoded)? | If hardcoded → note cross-ref to SEC finding |
| Is there a token refresh mechanism? | MEDIUM if no refresh and short expiry is not set |
| Is there a revocation strategy (blocklist, short expiry + refresh)? | MEDIUM if neither exists |

**`alg: none` check:**
```bash
grep -r -n -iE "algorithm.*none|alg.*none" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```
Any result is CRITICAL.

---

### Step 5 — Token storage location

```bash
# JWT in localStorage (XSS-stealable)
grep -r -n -iE "localStorage\.(setItem|getItem)\s*\([^,)]*['\"][^'\"]*token[^'\"]*['\"]" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# JWT in sessionStorage
grep -r -n -iE "sessionStorage\.(setItem|getItem)\s*\([^,)]*['\"][^'\"]*token[^'\"]*['\"]" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Token appended to Authorization header (client side — check how it's sourced)
grep -r -n -iE "Authorization.*Bearer|Bearer.*token" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules | head -20
```

**Cookie security flags:**

```bash
# Find cookie set calls
grep -r -n -iE "(res\.cookie|response\.set_cookie|set_cookie)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

For each `res.cookie` call found, read the options object and check:
- `httpOnly: true` — prevents JavaScript access
- `secure: true` — HTTPS only (or `secure: process.env.NODE_ENV === 'production'`)
- `sameSite: 'strict'` or `'lax'` — CSRF protection

**Triage:**
- JWT stored in localStorage → HIGH (XSS attack can steal all tokens)
- JWT in sessionStorage → MEDIUM (cleared on tab close, still XSS-stealable)
- `httpOnly` missing on auth cookie → HIGH
- `secure` missing on auth cookie → HIGH in production, MEDIUM in dev-only code
- `sameSite` missing → MEDIUM

---

### Step 6 — Route protection coverage

This is the most important manual reasoning step. The goal is to identify API routes that should require authentication but do not.

```bash
# Step 6a: List every route definition
grep -r -n -E "(app|router)\.(get|post|put|patch|delete)\s*\(['\"]" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Step 6b: List every place auth middleware is applied
grep -r -n -iE "(authenticate|requireAuth|isAuth|verifyToken|protect|authMiddleware|getServerSession|auth\(\))" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Step 6c: For Express-style apps — check if auth middleware is applied globally or per-route
grep -r -n -iE "app\.use\s*\([^)]*auth" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

**Reasoning step:** Cross-reference 6a against 6b. For each route in 6a, determine:
- Does the route definition include an auth middleware argument?
- Is there a global `app.use(authenticate)` that covers it?
- Is it a route that *should* require auth (data reads, mutations, user-specific content)?
- Is it legitimately public (health check, login endpoint, public content)?

Routes that should be protected but are not → CRITICAL (unauthenticated access to data or mutations).

**For Next.js projects — check server-side auth in page components:**

```bash
# Pages/app directory that should check auth
grep -r -n -iE "(getServerSideProps|getServerSession|auth\(\))" \
  --include="*.ts" --include="*.tsx" \
  "$TARGET/pages" "$TARGET/app" 2>/dev/null | grep -v node_modules | head -20

# Find pages with no auth check
find "$TARGET/pages" "$TARGET/app" -name "*.tsx" -o -name "*.ts" 2>/dev/null | \
  grep -v node_modules | \
  xargs grep -L -iE "(getServerSession|auth\(\)|requireAuth|redirect.*login)" 2>/dev/null | \
  grep -v "_app\|_document\|layout\|loading\|error\|not-found\|page\.test\|page\.spec" | head -20
```

---

### Step 7 — Client-side-only auth guards

Frontend-only auth checks are not a defence — they protect UX, not data. The real protection must be on the server. This step identifies cases where client-side checks exist but server-side enforcement is absent.

```bash
# React Router / client-side protected route components
grep -r -n -iE "(PrivateRoute|ProtectedRoute|RequireAuth|AuthGuard|withAuth)" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# useEffect-based auth redirects (client-side only pattern)
grep -r -n -iE "useEffect.*router\.(push|replace).*login" \
  --include="*.ts" --include="*.tsx" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Check if auth state comes from localStorage (forgeable)
grep -r -n -iE "localStorage\.getItem.*token|isAuthenticated.*localStorage|isLoggedIn.*localStorage" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

For each client-side guard found, determine whether the data it protects is also protected server-side (Step 6). If a ProtectedRoute exists in React but the underlying API endpoint has no auth middleware → CRITICAL. If the API is protected server-side and the client guard is just UX → no finding.

---

### Step 8 — Password reset and recovery flow

```bash
# Find password reset handler files
find "$TARGET" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) | \
  grep -v node_modules | \
  xargs grep -l -iE "(reset.?password|forgot.?password|password.?reset|password.?recovery)" 2>/dev/null

# Check token generation approach
grep -r -n -iE "(randomBytes|crypto\.random|uuid|nanoid|secrets\.token)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

Read the password reset flow and evaluate:

| Question | Finding if answer is bad |
|----------|--------------------------|
| Is the reset token generated with a cryptographically secure random function (`crypto.randomBytes`, `secrets.token_urlsafe`)? | HIGH — predictable tokens can be guessed |
| Is the token time-limited (e.g. expires in 1 hour)? | HIGH — tokens valid indefinitely |
| Is the token single-use (invalidated after use)? | HIGH — replay attack possible |
| Is the token stored hashed in the database (not plain)? | MEDIUM — DB read exposes valid tokens |
| Is the old password required to change to a new one (vs. just reset token)? | MEDIUM if no re-auth on password change |
| Does the response reveal whether the email is registered? | MEDIUM — user enumeration |

---

### Step 9 — Account lockout and brute force protection

```bash
# Check for rate limiting on auth endpoints
grep -r -n -iE "(rateLimit|rate.limit|loginAttempt|failedAttempt|lockout|too.many)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Check for express-rate-limit or similar
grep -r -n -iE "(express-rate-limit|rate-limiter-flexible|slowDown|@upstash/ratelimit)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Check if rate limiting is applied specifically to the login route
grep -r -n -iE "rateLimit.*login|loginRateLimit|authRateLimit" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

**Triage:**
- No rate limiting on login endpoint → HIGH (brute force password attacks)
- Global rate limiting exists but not applied to login specifically → MEDIUM
- Rate limiting exists on login → no finding

---

### Step 10 — User enumeration

```bash
# Login error responses
grep -r -n -iE "(user.*not.*found|no.*account|invalid.*email|email.*not.*registered|email.*does.*not.*exist)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Forgot password responses
grep -r -n -iE "(email.*sent|reset.*sent|check.*email)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

Read the login and forgot-password handlers. Check:
- Does a failed login return different messages for "user not found" vs "wrong password"? → MEDIUM (user enumeration — attacker can identify valid accounts)
- Correct pattern: always return a generic message like `"Invalid credentials"` for both cases
- Forgot password: should always say `"If that email is registered, you'll receive a reset link"` — never confirm or deny the email exists

---

### Step 11 — Auth provider-specific checks

Run the section that matches the `Auth method` from audit context.

---

#### NextAuth (`next-auth` / `@auth/core`)

```bash
# Find NextAuth config
find "$TARGET" -name "auth.ts" -o -name "auth.js" -o -name "[...nextauth].ts" -o -name "[...nextauth].js" \
  2>/dev/null | grep -v node_modules

# Check NEXTAUTH_SECRET (value handled by /audit-secrets — here check it's used)
grep -r -n "NEXTAUTH_SECRET\|AUTH_SECRET" \
  --include="*.ts" --include="*.js" --include="*.env*" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Check session strategy
grep -r -n -iE "session\s*:\s*\{[^}]*strategy" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Check callbacks — especially the session/jwt callback for custom claims
grep -r -n -iE "callbacks\s*:\s*\{" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

Evaluate:
- Is `NEXTAUTH_SECRET` / `AUTH_SECRET` set? (Not the value — just that it's referenced from env) → If absent: HIGH
- Does the JWT callback add unchecked role/permission claims from user-controlled input? → HIGH (privilege escalation)
- Are OAuth providers using PKCE? (default in recent NextAuth versions — flag if explicitly disabled)

---

#### Clerk

```bash
# Check clerkMiddleware is applied
grep -r -n -iE "(clerkMiddleware|authMiddleware|withClerkMiddleware)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Check publicRoutes configuration
grep -r -n -iE "publicRoutes\s*:" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Check webhook verification
grep -r -n -iE "(svix|webhook.*secret|verifyWebhook)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

Evaluate:
- Is `clerkMiddleware` present in `middleware.ts`? → If absent: CRITICAL (no route protection)
- Are webhook endpoints verifying the `svix-signature` header? → If not: HIGH (webhook spoofing)
- Are `publicRoutes` patterns overly broad (e.g. `"/api/(.*)"`)? → HIGH

---

#### Supabase Auth

```bash
# Check for anon key vs service role key usage in auth flows
grep -r -n -iE "(supabaseAdmin|createClient.*service_role|SERVICE_ROLE)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Check RLS is not bypassed via service role in user-facing routes
grep -r -n -iE "supabaseAdmin\.(from|rpc|storage)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | head -20

# Check getUser() vs getSession() usage (getSession is insecure without server validation)
grep -r -n -iE "(getSession\(\)|getUser\(\))" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

Evaluate:
- Is `supabaseAdmin` (service role client) used in user-facing API routes? → HIGH (bypasses RLS)
- Is `supabase.auth.getSession()` used server-side without `getUser()` to validate? → HIGH (session data is unverified on server)
- Correct pattern: use `supabase.auth.getUser()` on the server, which validates the JWT with Supabase

---

#### Auth0

```bash
grep -r -n -iE "(auth0|@auth0)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | head -20

# Check audience validation
grep -r -n -iE "audience\s*[=:]" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

Evaluate:
- Is `audience` set in token verification? → If not: MEDIUM (tokens from other Auth0 apps may be accepted)
- Are callback URLs restricted in the Auth0 dashboard? → Note as manual check item in findings

---

#### Manual JWT / custom auth

If no known provider is detected and Auth method is JWT or Custom:

```bash
# Check for middleware.ts / middleware.js (Next.js)
find "$TARGET" -maxdepth 3 -name "middleware.ts" -o -name "middleware.js" \
  2>/dev/null | grep -v node_modules

# Check if every route group has auth applied
grep -r -n -iE "(verify|authenticate|protect)\s*\(" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | head -30
```

Apply Steps 4–6 with extra scrutiny — custom auth implementations have the highest vulnerability density.

---

### Step 12 — Classify and write findings

For every issue flagged across steps 3–11:

1. Confirm it is a real finding — not a test, mock, or correctly handled case
2. Assign an `AUTH-NNN` ID starting at `AUTH-001`
3. Assign severity using the guide below
4. Write each finding into the `## audit-auth` section of `$FINDINGS` using the exact format from `templates/audit-schema.md`

Replace the section header:
```markdown
## audit-auth — [timestamp]
```
with the actual timestamp.

Update the blockquote summary with actual counts.

---

## Severity Guide for This Skill

| Condition | Severity |
|-----------|----------|
| No authentication system at all | CRITICAL |
| API routes with sensitive data or mutations reachable without any auth | CRITICAL |
| Plain text password storage or plain string comparison | CRITICAL |
| `alg: none` accepted by JWT verify | CRITICAL |
| Client-side-only auth guard with no server-side protection on the API | CRITICAL |
| `clerkMiddleware` absent from Next.js middleware | CRITICAL |
| Passwords hashed with MD5, SHA-1, or SHA-256 (no key stretching) | CRITICAL |
| JWT stored in localStorage | HIGH |
| JWT has no expiry (`expiresIn` not set) | HIGH |
| JWT `algorithms` allowlist not set in verify (alg confusion risk) | HIGH |
| `httpOnly` or `secure` flags missing on auth cookie | HIGH |
| No rate limiting on login endpoint | HIGH |
| Password reset token not time-limited or not single-use | HIGH |
| `supabaseAdmin` used in user-facing routes (RLS bypass) | HIGH |
| `getSession()` used server-side without `getUser()` validation (Supabase) | HIGH |
| Webhook endpoints not verifying signature (Clerk, Stripe, etc.) | HIGH |
| User enumeration through different login error messages | MEDIUM |
| No email verification enforced on registration | MEDIUM |
| JWT in sessionStorage | MEDIUM |
| Missing `SameSite` on auth cookie | MEDIUM |
| Password reset token not hashed in DB | MEDIUM |
| `audience` not validated (Auth0) | MEDIUM |
| No refresh token rotation | MEDIUM |
| Overly long session lifetime (> 30 days without refresh) | MEDIUM |
| Missing MFA support | LOW |
| bcrypt work factor below 10 | LOW |

---

## Done When

- [ ] Auth system fully mapped (know what's issued on login, how it's validated on each request)
- [ ] All 11 steps completed — provider-specific step run for the detected auth method
- [ ] Every flagged issue triaged and either recorded or dismissed as false positive
- [ ] All findings written to `## audit-auth` section with correct `AUTH-NNN` IDs
- [ ] Section summary updated with actual counts
- [ ] Handoff: print `"audit-auth complete — [N] findings. Next: /audit-api <output-dir>"`
