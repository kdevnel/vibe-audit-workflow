# /audit-dependencies

Scans project dependencies for known vulnerabilities, critically outdated packages, and supply chain risks. Dependency vulnerabilities are the most automated check in the audit — tooling does the heavy lifting.

Run after `/audit-setup`. Can run in parallel with `/audit-secrets`, `/audit-auth`, `/audit-database`, `/audit-frontend`.

---

## Invocation

```
/audit-dependencies <output-dir>
```

Reads `<output-dir>/audit-context.md`. Appends to the `## audit-dependencies` section of `<output-dir>/audit-findings.md`.

---

## What This Skill Covers

| Check | Description |
|-------|-------------|
| Known CVEs | `npm audit` / `pip-audit` — packages with published vulnerabilities |
| Critically outdated packages | Major versions behind on security-sensitive libraries |
| Lock file integrity | Lock file present and not out of sync with manifest |
| Typosquatting / suspicious packages | Package names that look like common packages but are not |
| Overprivileged dependencies | Packages that require network/system access unnecessarily |

---

## Steps

### Step 1 — Read audit context

Read `<output-dir>/audit-context.md` and extract:
- `TARGET` — project root
- `Package manager` — npm / yarn / pnpm / pip / N/A
- `Language(s)` — to know which audit tools to run

Set `FINDINGS="<output-dir>/audit-findings.md"`.

---

### Step 2 — Automated vulnerability scan

Run the appropriate audit tool. These commands must be run from the project root.

**npm:**
```bash
cd "$TARGET" && npm audit --json 2>/dev/null
```

**yarn (v1):**
```bash
cd "$TARGET" && yarn audit --json 2>/dev/null
```

**pnpm:**
```bash
cd "$TARGET" && pnpm audit --json 2>/dev/null
```

**pip / Python:**
```bash
# pip-audit (preferred)
pip-audit --path "$TARGET" --format json 2>/dev/null

# Safety (alternative)
cd "$TARGET" && safety check --json 2>/dev/null

# If neither tool is installed, fall back to manual check
cat "$TARGET/requirements.txt" 2>/dev/null
cat "$TARGET/pyproject.toml" 2>/dev/null
```

**Parse the output.** For each vulnerability reported, extract:
- Package name
- Installed version
- Severity (critical / high / moderate / low)
- CVE or advisory ID
- Whether a patched version exists

Record findings by severity. A package with a patched version available is more actionable than one awaiting a fix.

**Triage:**
- Critical or High severity with a network-accessible exploit (RCE, auth bypass, SQLi in a library) → CRITICAL or HIGH finding
- Critical/High severity in a dev-only dependency (only in `devDependencies`, never reaches production) → downgrade to LOW
- Moderate severity → MEDIUM
- Low severity → LOW (batch all low-severity into one finding rather than listing individually)

---

### Step 3 — Lock file integrity

```bash
# Check lock file exists
[ -f "$TARGET/package-lock.json" ] && echo "npm lock present"
[ -f "$TARGET/yarn.lock" ]         && echo "yarn lock present"
[ -f "$TARGET/pnpm-lock.yaml" ]    && echo "pnpm lock present"

# Check for lock file / manifest mismatch (npm)
cd "$TARGET" && npm ls --json 2>&1 | grep -i "missing\|invalid\|extraneous" | head -10

# Check if lock file is committed to git
git -C "$TARGET" ls-files 2>/dev/null | grep -E "(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)"
```

**Triage:**
- No lock file at all → MEDIUM (installs are non-deterministic; different versions may be installed in production vs development)
- Lock file present but not committed to git → MEDIUM (same problem)
- Lock file out of sync with `package.json` (npm ls reports extraneous/missing) → LOW

---

### Step 4 — Critically outdated security-sensitive packages

The automated audit in Step 2 only covers known CVEs. This step checks for packages that are multiple major versions behind, which often means missing security patches not yet assigned CVEs.

```bash
# npm — check outdated packages (major versions behind)
cd "$TARGET" && npm outdated --json 2>/dev/null | head -80

# pip
cd "$TARGET" && pip list --outdated --format json 2>/dev/null | head -40
```

Focus on packages that are security-sensitive and multiple major versions behind:

| Package category | Examples | Why it matters |
|-----------------|----------|----------------|
| Auth libraries | `jsonwebtoken`, `passport`, `bcrypt`, `next-auth` | Auth bypass CVEs are common |
| HTTP frameworks | `express`, `fastify`, `django`, `flask` | Request smuggling, path traversal |
| Database clients | `pg`, `mysql2`, `mongoose`, `sequelize` | Injection bypass in older versions |
| Parsing libraries | `multer`, `formidable`, `xml2js` | DoS and injection in older versions |
| Crypto libraries | `node-forge`, `cryptography` | Weak algorithm or padding oracle issues |

For packages in these categories: 2+ major versions behind → MEDIUM. 3+ major versions behind with known history of CVEs → HIGH.

Do **not** flag packages for being one minor version behind — focus on security-sensitive packages with significant version gaps.

---

### Step 5 — Suspicious package names

Check `package.json` (or `requirements.txt`) for packages that look like typosquats of common libraries. Non-developers often install packages by guessing names or copying from untrusted sources.

```bash
cat "$TARGET/package.json" 2>/dev/null | grep -E '"dependencies"|"devDependencies"' -A 200 | head -100
```

Manually scan the package list for names that are:
- One character off from a popular package (`expresss`, `requst`, `lodahs`)
- A popular package with a prefix/suffix that doesn't exist (`node-lodash`, `react-core-utils`)
- A very new package (low download count) with a suspicious name

If any are found, note them as `INVESTIGATING` — they require manual verification on npmjs.com / PyPI before being recorded as confirmed findings.

```bash
# Check package download counts (if npm is available)
# For any suspicious package, run:
npm info <package-name> 2>/dev/null | grep -E "(version|description|maintainers|downloads)"
```

Confirmed typosquat or malicious package → CRITICAL.
Suspicious but unverified → note as `INVESTIGATING` with a manual check instruction.

---

### Step 6 — Classify and write findings

For every issue flagged in Steps 2–5:

1. Assign a `DEP-NNN` ID starting at `DEP-001`
2. For CVE findings, include the CVE/advisory ID in the Evidence field
3. Batch low-severity vulnerability findings: if there are more than 5 LOW findings, group them into a single `DEP-NNN · Multiple low-severity dependency vulnerabilities [LOW]` finding with a table listing the packages
4. Write each finding into the `## audit-dependencies` section of `$FINDINGS`

Replace the section header with actual timestamp. Update the blockquote summary.

---

## Severity Guide for This Skill

| Condition | Severity |
|-----------|----------|
| Confirmed typosquat or malicious package installed | CRITICAL |
| Critical/High CVE in a production runtime dependency with available patch | HIGH |
| Auth or crypto library 3+ major versions behind | HIGH |
| No lock file committed (non-deterministic production installs) | MEDIUM |
| Moderate CVE in production dependency | MEDIUM |
| Security-sensitive library 2+ major versions behind | MEDIUM |
| High/Critical CVE in a dev-only dependency (never reaches production) | LOW |
| Low CVE in production dependency | LOW |
| Lock file out of sync with manifest | LOW |

---

## Done When

- [ ] Automated vulnerability scan run with appropriate tool for the detected package manager
- [ ] CVE findings triaged (dev vs prod, patched vs unpatched)
- [ ] Lock file presence and git tracking verified
- [ ] Outdated security-sensitive packages reviewed
- [ ] Package list scanned for suspicious names
- [ ] All findings written with correct `DEP-NNN` IDs and CVE references where available
- [ ] Section summary updated
- [ ] Handoff: print `"audit-dependencies complete — [N] findings. Next: run remaining parallel skills or /audit-api <output-dir>"`
