# /audit-frontend

Audits client-side code for XSS vulnerabilities, sensitive data exposure in the browser, insecure auth state management, and framework-specific weaknesses. Frontend code in non-developer applications frequently contains secrets, trusts user-controlled data, and implements security checks that are trivially bypassed.

Run after `/audit-setup`. Can run in parallel with `/audit-secrets`, `/audit-auth`, `/audit-database`, `/audit-dependencies`.

**Scope boundaries:**
- `/audit-secrets` covers secrets hardcoded as string literals — this skill covers *patterns* that leak data to the browser (env vars exposed to client, data in localStorage, etc.)
- `/audit-auth` covers auth token storage and client-side guards — this skill covers XSS vectors that could steal those tokens

---

## Invocation

```
/audit-frontend <output-dir>
```

Reads `<output-dir>/audit-context.md`. Appends to the `## audit-frontend` section of `<output-dir>/audit-findings.md`.

---

## What This Skill Covers

| Check | Description |
|-------|-------------|
| XSS vectors | dangerouslySetInnerHTML, innerHTML, eval, document.write |
| Sensitive data in client storage | localStorage, sessionStorage, non-httpOnly cookies |
| Environment variable exposure | Client-bundle-visible env vars with sensitive names |
| Third-party script security | Missing integrity attributes, unvetted CDN scripts |
| Auth state management | How auth is tracked client-side; forgeable state |
| Sensitive data rendered in DOM | API responses with excess data fields in visible source |
| Framework-specific issues | React, Next.js, Vue, Angular patterns |
| Postmessage / iframe security | Cross-origin communication without origin checks |

---

## Steps

### Step 1 — Read audit context

Read `<output-dir>/audit-context.md` and extract:
- `TARGET` — project root
- `Frontend` — React / Next.js / Vue / Angular / None
- `Auth method` — for Step 5 cross-reference
- `Frontend entry point` — starting point for source reading

Set `FINDINGS="<output-dir>/audit-findings.md"`.

If Frontend is `None`: note that no frontend was detected and exit.

---

### Step 2 — XSS injection vectors

XSS is the most impactful frontend vulnerability — it lets attackers steal auth tokens, make API calls as the victim, and take over sessions.

```bash
# React dangerouslySetInnerHTML — most common React XSS vector
grep -r -n -iE "dangerouslySetInnerHTML\s*=\s*\{\s*\{" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Direct innerHTML assignment
grep -r -n -iE "\.innerHTML\s*=" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# document.write
grep -r -n -iE "document\.write\s*\(" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# eval with dynamic content
grep -r -n -iE "\beval\s*\(" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "test\|spec"

# insertAdjacentHTML
grep -r -n -iE "insertAdjacentHTML\s*\(" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Vue v-html directive
grep -r -n -iE "v-html\s*=" \
  --include="*.vue" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Angular [innerHTML] binding
grep -r -n -iE "\[innerHTML\]\s*=" \
  --include="*.html" --include="*.ts" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

For each match, read the surrounding code. Determine:
- **Is the value user-controlled?** (came from user input, URL params, API response with user-generated content)
  - Yes → CRITICAL
- **Is it a static string or a trusted internal value?**
  - Static admin-set HTML content → MEDIUM (still a risk if admin account is compromised)
  - Library code, not application code → likely FALSE_POSITIVE

**DOMPurify or equivalent sanitisation:**
```bash
grep -r -n -iE "(DOMPurify|sanitize\s*\(|sanitizeHtml\s*\(|xss\s*\()" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```
If `dangerouslySetInnerHTML` is used AND DOMPurify wraps the value, severity drops from CRITICAL to LOW (still note it).

---

### Step 3 — Sensitive data in client storage

```bash
# localStorage usage
grep -r -n -iE "localStorage\.(setItem|getItem)\s*\(" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# sessionStorage usage
grep -r -n -iE "sessionStorage\.(setItem|getItem)\s*\(" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

For each `setItem` call, read what is being stored. Classify by what data is stored:

| Data stored | Severity |
|------------|----------|
| Auth token / JWT | HIGH — XSS-stealable; should be httpOnly cookie |
| User ID or session ID | MEDIUM — lower risk but still XSS-exposed |
| User preferences, theme, non-sensitive state | No finding — appropriate use |
| PII (name, email, address) | HIGH — no need for PII in browser storage |
| API response data that includes sensitive fields | MEDIUM |

```bash
# Cookies set from JavaScript (not httpOnly)
grep -r -n -iE "document\.cookie\s*=" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

Any `document.cookie` assignment means the cookie is readable by JavaScript — cannot be httpOnly. If this is an auth cookie → HIGH.

---

### Step 4 — Environment variable exposure to client bundle

This is stack-specific. Read the `Frontend` field from context.

**Next.js:**
```bash
# NEXT_PUBLIC_ vars are intentionally bundled into the client
grep -r -n "NEXT_PUBLIC_" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules

# Non-NEXT_PUBLIC_ process.env in client components
grep -r -l "'use client'" "$TARGET/src" "$TARGET/app" 2>/dev/null | \
  grep -v node_modules | \
  xargs grep -n "process\.env\.[^N]" 2>/dev/null | \
  grep -v "NEXT_PUBLIC_" | head -20
```

For each `NEXT_PUBLIC_` variable, check if its name suggests sensitive data (`KEY`, `SECRET`, `TOKEN`, `PASSWORD`). A database URL or private API key prefixed with `NEXT_PUBLIC_` is a CRITICAL exposure.

**Vite / React:**
```bash
grep -r -n "VITE_" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | \
  grep -iE "VITE_.*(key|secret|password|token|auth|private)" | head -20
```

**Create React App:**
```bash
grep -r -n "REACT_APP_" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | \
  grep -iE "REACT_APP_.*(key|secret|password|token|auth|private)" | head -20
```

---

### Step 5 — Auth state management and forgeable state

```bash
# Auth state from localStorage (forgeable)
grep -r -n -iE "(isLoggedIn|isAuthenticated|user)\s*[=:]\s*.*localStorage" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Role or permission checks on the client only
grep -r -n -iE "(isAdmin|role\s*===|userRole\s*===|permission\s*===)" \
  --include="*.tsx" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Auth context that reads from localStorage or decoded JWT
grep -r -n -iE "(AuthContext|useAuth|AuthProvider)" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | head -10
```

Read the auth context or `useAuth` hook. Determine:
- Is `isAdmin` / `role` derived from a JWT stored in localStorage? → HIGH (user can forge admin role by editing localStorage)
- Is `isAdmin` derived from a server-validated session or httpOnly cookie? → no finding

```bash
# URL parameter-based auth state (e.g. ?token= in URL)
grep -r -n -iE "(searchParams|useSearchParams|query\.token|params\.token)" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

Auth tokens in URL parameters → MEDIUM (tokens appear in browser history, server logs, Referer headers).

---

### Step 6 — Third-party scripts

```bash
# External script tags (look for CDN or external URLs)
grep -r -n -iE "<script.*src\s*=\s*['\"]https?://" \
  --include="*.html" --include="*.tsx" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Scripts without integrity attributes
grep -r -n -iE "<script.*src\s*=\s*['\"]https?://" \
  --include="*.html" --include="*.tsx" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "integrity" | head -20

# next/script without integrity (Next.js)
grep -r -n -iE "<Script.*src\s*=\s*['\"]https?://" \
  --include="*.tsx" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

For each external script:
- No `integrity` (SRI) attribute → MEDIUM (CDN compromise could inject malicious code)
- Script loaded from a non-HTTPS URL → HIGH (MITM script injection)
- Unknown or untrusted CDN → investigate (flag for manual review)

---

### Step 7 — PostMessage and iframe security

```bash
# postMessage usage without origin check
grep -r -n -iE "window\.addEventListener\s*\(['\"]message" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# iframe embeds
grep -r -n -iE "<iframe" \
  --include="*.html" --include="*.tsx" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

For each `message` event listener, read the handler. Does it check `event.origin` before processing the message?
- No origin check → MEDIUM (any window can send messages and have them processed)
- Origin checked → no finding

---

### Step 8 — Framework-specific issues

Run only the section matching `Frontend` from context.

---

#### Next.js

```bash
# Server components fetching and returning sensitive data to client
grep -r -n -iE "(getServerSideProps|getStaticProps)" \
  --include="*.ts" --include="*.tsx" \
  "$TARGET/pages" 2>/dev/null | head -10

# Check what getServerSideProps returns — look for full database objects with sensitive fields
find "$TARGET/pages" -name "*.tsx" -o -name "*.ts" 2>/dev/null | \
  xargs grep -l "getServerSideProps" 2>/dev/null | \
  xargs grep -n -A5 "return\s*\{.*props" 2>/dev/null | head -40

# app router — server actions with no auth check
grep -r -n -iE "'use server'" \
  --include="*.ts" --include="*.tsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

**Check:** Do `getServerSideProps` or server actions expose full database row objects (including password hashes, internal IDs, all fields) to the page props? This data appears in the `__NEXT_DATA__` script tag in the HTML — visible to anyone who views source. → MEDIUM

---

#### React (SPA)

```bash
# React Router — public routes defined (check what's public vs private)
grep -r -n -iE "(Route\s+path|<Route\s)" \
  --include="*.tsx" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules | head -20

# Check if ProtectedRoute wraps sensitive views
grep -r -n -iE "(ProtectedRoute|PrivateRoute|RequireAuth)" \
  --include="*.tsx" --include="*.jsx" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

Cross-reference with `/audit-auth` Step 7 — client-side guards were already checked. Note findings there rather than duplicating.

---

#### Vue

```bash
# v-html with dynamic content
grep -r -n -E "v-html\s*=\s*['\"]" \
  --include="*.vue" "$TARGET" 2>/dev/null | grep -v node_modules

# Pinia/Vuex store with sensitive data
grep -r -n -iE "(defineStore|createStore)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | head -10
```

---

### Step 9 — Classify and write findings

For every issue flagged in Steps 2–8:

1. Assign a `FE-NNN` ID starting at `FE-001`
2. Assign severity using the guide below
3. Write each finding into the `## audit-frontend` section of `$FINDINGS`

Replace the section header with actual timestamp. Update the blockquote summary.

---

## Severity Guide for This Skill

| Condition | Severity |
|-----------|----------|
| `dangerouslySetInnerHTML` / `v-html` / `[innerHTML]` with user-controlled content and no sanitization | CRITICAL |
| `eval()` with user-controlled input | CRITICAL |
| `NEXT_PUBLIC_` / `VITE_` / `REACT_APP_` variable exposing a private API key or secret | CRITICAL |
| Auth token stored in localStorage | HIGH |
| PII stored in localStorage or sessionStorage | HIGH |
| Auth state derived from forgeable localStorage value (`isAdmin` from localStorage) | HIGH |
| External script loaded over HTTP (not HTTPS) | HIGH |
| `dangerouslySetInnerHTML` with static/admin content (no user input) | MEDIUM |
| `innerHTML` with static string | MEDIUM |
| Auth token in URL query parameter | MEDIUM |
| External script without SRI `integrity` attribute | MEDIUM |
| `postMessage` listener without origin check | MEDIUM |
| User session ID in localStorage | MEDIUM |
| `getServerSideProps` returning full DB object including sensitive fields | MEDIUM |
| Server action with no auth check | HIGH |
| Non-sensitive data in localStorage | LOW |
| `document.cookie` for non-auth cookie | LOW |

---

## Done When

- [ ] All XSS patterns searched and each match read in context to confirm user-controlled input
- [ ] All localStorage/sessionStorage writes checked for what data is stored
- [ ] Environment variable exposure checked for the detected frontend framework
- [ ] Framework-specific step run for detected framework
- [ ] All findings written with correct `FE-NNN` IDs
- [ ] Section summary updated
- [ ] Handoff: print `"audit-frontend complete — [N] findings. Next: run remaining parallel skills or /audit-api <output-dir>"`
