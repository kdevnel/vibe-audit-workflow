# /audit-secrets

Scans the target project for exposed credentials, hardcoded secrets, and insecure secret management. This is the highest-yield skill in the audit — non-developer codebases routinely contain live API keys, passwords, and connection strings committed directly to source code.

Run after `/audit-setup`. Can run in parallel with `/audit-auth`, `/audit-database`, `/audit-frontend`, `/audit-dependencies`.

---

## Invocation

```
/audit-secrets <output-dir>
```

| Argument | Description |
|----------|-------------|
| `<output-dir>` | Path to the audit output directory, e.g. `./audit-reports/2025-01-15/` |

The skill reads `<output-dir>/audit-context.md` for project path and stack, and appends findings to `<output-dir>/audit-findings.md`.

---

## What This Skill Covers

| Check | Description |
|-------|-------------|
| Hardcoded credentials | Passwords, API keys, tokens assigned as string literals in source |
| Known service key patterns | Stripe, AWS, GitHub, Google, Slack, OpenAI, Twilio, SendGrid, etc. |
| Private key material | RSA/EC private keys, SSH keys, certificate material in source files |
| Database connection strings | Connection URIs with embedded credentials |
| JWT secret strength | Hardcoded or weak JWT signing secrets |
| `.env` file security | Not in `.gitignore`, committed to git, real values in `.env.example` |
| Git history | Previously committed secrets no longer in working tree |
| Client-side exposure | Stack-specific checks for secrets leaked into browser bundles |
| Credential logging | Sensitive values passed to `console.log` or equivalent |

---

## Steps

### Step 1 — Read audit context

Read `<output-dir>/audit-context.md` and extract:
- `TARGET` — the project path (from the Key File Paths or Notes section — it is the project root)
- `Frontend` — to activate client-side exposure checks
- `Auth method` — to target JWT checks
- `Database` — to scope connection string patterns
- `Environment / config files` — paths to `.env` and config files already discovered

Set `FINDINGS="<output-dir>/audit-findings.md"` for all subsequent writes.

---

### Step 2 — Hardcoded credential assignment patterns

These patterns catch the most common form: a variable name that sounds like a credential assigned a string literal value.

```bash
# Pattern A: Classic assignment — password/secret/key/token = "value"
grep -r -n -iE \
  "(password|passwd|pwd|secret|api[_-]?key|api[_-]?secret|access[_-]?token|auth[_-]?token|private[_-]?key|client[_-]?secret|signing[_-]?key|encryption[_-]?key)\s*[=:]\s*['\"][^'\"\$\{][^'\"]{3,}['\"]" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" \
  --include="*.py" --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "/dist/" | grep -v "/.next/"

# Pattern B: Object/dict key form — { password: "value" } or { "secret": "value" }
grep -r -n -iE \
  "['\"]?(password|secret|token|api_key|api_secret|auth_key)['\"]?\s*:\s*['\"][^'\"\$\{][^'\"]{3,}['\"]" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "/dist/" | grep -v "test\|spec\|mock\|fixture\|example\|sample"
```

**Triage guidance for Pattern A/B results:**
- Any result where the right-hand value is NOT `process.env.*`, `os.environ[...]`, or a clear placeholder (e.g. `"YOUR_KEY_HERE"`, `"<replace>"`) → record as a finding
- Values that look like dummy data (`"password"`, `"test"`, `"admin"`, `"example"`) in test/mock files → LOW
- Values that look like dummy data in production code → HIGH (wrong pattern, even if value is fake)
- Any real-looking value anywhere → CRITICAL or HIGH depending on service sensitivity

---

### Step 3 — Known service credential patterns

These patterns detect real credentials by their structural signature, regardless of variable name.

```bash
# Stripe — live and test keys
grep -r -n -E "(sk_live_|sk_test_|rk_live_|pk_live_)[0-9a-zA-Z]{20,}" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" --include="*.json" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# AWS Access Key IDs
grep -r -n -E "AKIA[0-9A-Z]{16}" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" --include="*.json" --include="*.yml" --include="*.yaml" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# GitHub Personal Access Tokens and App tokens
grep -r -n -E "(ghp_|ghs_|ghr_|github_pat_)[0-9a-zA-Z]{20,}" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Google API Keys
grep -r -n -E "AIza[0-9A-Za-z_-]{35}" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" --include="*.json" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Slack tokens
grep -r -n -E "(xoxb|xoxp|xoxa|xoxs|xapp)-[0-9a-zA-Z-]+" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# OpenAI API keys
grep -r -n -E "sk-[a-zA-Z0-9]{20,}" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Twilio
grep -r -n -E "(AC[0-9a-f]{32}|SK[0-9a-f]{32})" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# SendGrid
grep -r -n -E "SG\.[a-zA-Z0-9_-]{22,}\.[a-zA-Z0-9_-]{43,}" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Anthropic API keys
grep -r -n -E "sk-ant-[a-zA-Z0-9_-]{20,}" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

**Any match here is CRITICAL** — these patterns have essentially zero false-positive rate. Rotate the key immediately as part of remediation guidance.

---

### Step 4 — Private key material and certificates

```bash
# PEM-format private keys
grep -r -n -E "\-\-\-\-\-BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY\-\-\-\-\-" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# SSH private key files committed (check git-tracked files)
git -C "$TARGET" ls-files 2>/dev/null | grep -iE "\.(pem|key|p12|pfx|der)$"
git -C "$TARGET" ls-files 2>/dev/null | grep -iE "(id_rsa|id_ed25519|id_ecdsa|id_dsa)$"
```

Any match is CRITICAL — private key material in version control must be considered permanently compromised.

---

### Step 5 — Database connection strings with embedded credentials

```bash
# Connection URIs with user:password@ format
grep -r -n -iE "(postgresql|postgres|mysql|mongodb|redis|amqp)://[^@\s'\"]+:[^@\s'\"]+@[a-zA-Z0-9]" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" --include="*.json" --include="*.yaml" --include="*.yml" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# DATABASE_URL style that might be hardcoded
grep -r -n -iE "DATABASE_URL\s*=\s*['\"][^'\"\$\{][^'\"]+['\"]" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

**Triage:** Connection string with credentials embedded → CRITICAL if production host, HIGH if dev/local.

---

### Step 6 — JWT signing secret strength

```bash
# Hardcoded JWT secrets
grep -r -n -iE "(jwt[._]?secret|signing[._]?secret|token[._]?secret)\s*[=:]\s*['\"][^'\"\$\{][^'\"]*['\"]" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Weak/short secrets passed to jwt.sign or similar
grep -r -n -iE "jwt\.sign\([^,]+,\s*['\"][^'\"\$\{]{1,30}['\"]" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

**Triage:**
- Hardcoded JWT secret in source → HIGH
- JWT secret shorter than 32 characters → HIGH  
- JWT secret that looks like a dictionary word or phrase → HIGH
- JWT secret loaded from `process.env` → no finding (correct pattern)

---

### Step 7 — `.env` file security

```bash
# 7a — Is .env in .gitignore?
if [ -f "$TARGET/.gitignore" ]; then
  grep -E "^\s*\.env" "$TARGET/.gitignore" || echo "WARNING: .env not found in .gitignore"
else
  echo "WARNING: No .gitignore file found"
fi

# 7b — Is .env (or any .env.*) currently tracked by git?
git -C "$TARGET" ls-files 2>/dev/null | grep -E "^\.env"

# 7c — Do .env.example or .env.sample files contain real-looking values?
#      (check existence first, then inspect for non-placeholder values)
find "$TARGET" -maxdepth 3 -name ".env.example" -o -name ".env.sample" -o -name ".env.template" \
  2>/dev/null | grep -v node_modules
```

For any `.env.example` files found in 7c, read them and check:
- Values that follow the `KEY=your_value_here` or `KEY=` pattern → safe template
- Values that look like real credentials (long random strings, known key prefixes) → HIGH finding

**Triage:**
- `.env` committed to git AND contains real values → CRITICAL  
- `.env` committed to git but appears to be a template only → MEDIUM
- `.env` not in `.gitignore` → HIGH (will be committed next time someone runs `git add .`)
- No `.gitignore` at all → HIGH
- `.env.example` contains real credentials → HIGH

---

### Step 8 — Git history search

Check whether secrets were ever committed and later removed. This is important: a rotated key still needs to be treated as compromised if it appeared in git history.

```bash
# Check if this is a git repo first
git -C "$TARGET" rev-parse --git-dir 2>/dev/null || echo "NOT A GIT REPO — skip git history checks"

# Search git history for common secret patterns
git -C "$TARGET" log --all --oneline -S "password" 2>/dev/null | head -10
git -C "$TARGET" log --all --oneline -S "secret" 2>/dev/null | head -10
git -C "$TARGET" log --all --oneline -S "api_key" 2>/dev/null | head -10
git -C "$TARGET" log --all --oneline -S "sk_live_" 2>/dev/null | head -5
git -C "$TARGET" log --all --oneline -S "AKIA" 2>/dev/null | head -5
```

**Note:** `git log -S` searches for commits where the string was added or removed. Any results indicate the term was in a committed file at some point.

For any commits returned, investigate whether they contained real secrets:
```bash
# View the diff of a specific commit
git -C "$TARGET" show <commit-hash> -- "*.ts" "*.js" "*.py" "*.env" 2>/dev/null | head -60
```

**Triage:**
- Git history contains a real credential (even if now removed) → HIGH
  - Remediation must include key rotation, not just code removal
- Git history contains generic terms like "password" in comments or tests → likely FALSE_POSITIVE, investigate before recording

---

### Step 9 — Client-side secret exposure

This check is stack-dependent. Read the `Frontend` field from audit context before running.

**For Next.js projects:**
```bash
# NEXT_PUBLIC_ vars are intentionally exposed — check they don't contain sensitive values
grep -r -n "NEXT_PUBLIC_" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules | \
  grep -iE "NEXT_PUBLIC_.*(key|secret|password|token|auth|api)" | head -20

# process.env access in client components (files with 'use client' or in pages/)
grep -r -l "'use client'" "$TARGET/src" "$TARGET/app" 2>/dev/null | \
  xargs grep -n "process\.env\." 2>/dev/null | \
  grep -v "NEXT_PUBLIC_" | head -20
```

**For React (Vite) projects:**
```bash
# VITE_ vars are exposed to the browser — check for sensitive names
grep -r -n -iE "VITE_.*(key|secret|password|token|auth)" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

**For React (Create React App) projects:**
```bash
grep -r -n -iE "REACT_APP_.*(key|secret|password|token|auth)" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env" --include="*.env.*" \
  "$TARGET" 2>/dev/null | grep -v node_modules
```

**For all frontend projects — check for hardcoded values in client files:**
```bash
find "$TARGET/src" "$TARGET/app" "$TARGET/pages" "$TARGET/components" \
  -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) \
  2>/dev/null | grep -v node_modules | \
  xargs grep -n -iE "(api[_-]?key|secret|password|token)\s*[=:]\s*['\"][^'\"\$\{]{8,}['\"]" \
  2>/dev/null | head -20
```

**Triage:**
- Sensitive-named `NEXT_PUBLIC_` / `VITE_` / `REACT_APP_` var with real value → HIGH
- `process.env.SECRET_KEY` in a client-rendered file (non-NEXT_PUBLIC_) → MEDIUM in dev, HIGH if it might reach production
- Hardcoded string in a component file → HIGH

---

### Step 10 — Credential logging

```bash
# console.log / print of variables with sensitive names
grep -r -n -iE "(console\.log|console\.info|print|logger\.(info|debug|log))\s*\([^)]*\b(password|secret|token|key|credential)\b" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "/test" | grep -v "/spec"
```

**Triage:**
- Logging a password or secret variable directly → HIGH
- Logging a request object that might contain auth headers → MEDIUM
- Logging variable *names* (not values) in debug messages → LOW or FALSE_POSITIVE

---

### Step 11 — Classify and write findings

For every item flagged across steps 2–10:

1. **Confirm it is a real finding** — not a placeholder, comment, test fixture, or false positive. If uncertain, mark `OPEN` and note the ambiguity.
2. **Assign a finding ID** using the `SEC-NNN` prefix, starting at `SEC-001` and incrementing.
3. **Assign severity** using the guide below.
4. **Write each finding** into the `## audit-secrets` section of `$FINDINGS` using the exact finding block format from `templates/audit-schema.md`.

Replace the section header placeholder:
```markdown
## audit-secrets — [timestamp]
```
with the actual timestamp (`date +"%Y-%m-%d %H:%M"`).

Update the blockquote summary line to reflect actual counts:
```markdown
> 3 findings: 2 critical, 1 high
```
or:
```markdown
> No findings. All checks passed.
```

---

## Severity Guide for This Skill

| Condition | Severity |
|-----------|----------|
| Live/production service credential in source (Stripe `sk_live_`, AWS AKIA, real DB password) | CRITICAL |
| Private key or certificate material committed | CRITICAL |
| `.env` file with real values tracked by git | CRITICAL |
| Any service credential in source (even test/dev keys) | HIGH |
| Hardcoded JWT signing secret | HIGH |
| `.env` not in `.gitignore` | HIGH |
| Real credentials found in git history (even if now removed) | HIGH |
| Sensitive-named env var exposed client-side | HIGH |
| JWT secret shorter than 32 chars or dictionary-based | HIGH |
| Credentials logged to console in production code | HIGH |
| `.env.example` with real-looking values | HIGH |
| NEXT_PUBLIC_/VITE_ var with mildly sensitive name but no real value | MEDIUM |
| Commented-out credentials | MEDIUM |
| Test credentials in non-test files | MEDIUM |
| `process.env` access in client code that isn't exposed to browser in practice | MEDIUM |
| Dummy/placeholder passwords in test files | LOW |

---

## Remediation Templates

Include these standard remediation notes in findings to save the report reader time:

**For any hardcoded service key:**
> Rotate this key immediately in the [service] dashboard — treat it as compromised. Replace the hardcoded value with `process.env.KEY_NAME` and ensure the `.env` file containing it is listed in `.gitignore`.

**For `.env` committed to git:**
> Remove `.env` from git tracking: `git rm --cached .env`. Add `.env` to `.gitignore`. If the file contained real values, rotate every credential it referenced — git history retains the file even after removal.

**For secrets in git history:**
> The key must be rotated regardless of code changes — git history is permanent unless the repository is rewritten with `git filter-repo`. Rotate the credential first, then optionally clean history.

**For client-side secret exposure:**
> Move this value to a server-side API route or serverless function. The client should receive only the minimum data it needs — never the raw credential.

---

## Done When

- [ ] All 10 search steps have been run — no step skipped
- [ ] Every flagged result has been triaged (confirmed finding, false positive, or needs investigation)
- [ ] All confirmed findings written to `## audit-secrets` section of `audit-findings.md` with correct IDs, severity, and status
- [ ] Section summary blockquote updated with actual counts
- [ ] No `.env` file contents printed in output
- [ ] Handoff: print `"audit-secrets complete — [N] findings. Next: /audit-auth <output-dir>"`
