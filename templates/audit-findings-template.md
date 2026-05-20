# Audit Findings — [Project Name]
**Date:** YYYY-MM-DD | **Mode:** full | **Auditor:** [name]

> This file is append-only during the audit. Each skill adds its own section below.
> `/audit-report` reads this file to generate the final consolidated report.
> Do not reorder or delete sections — mark findings as FALSE_POSITIVE or DEFERRED instead.

---

<!-- Skills append their sections below, in execution order -->

## audit-secrets — [timestamp]

> [summary: e.g. "2 findings: 1 critical, 1 high" — or "No findings. All checks passed."]

---

## audit-auth — [timestamp]

> [summary]

---

## audit-api — [timestamp]

> [summary]

---

## audit-database — [timestamp]

> [summary]

---

## audit-frontend — [timestamp]

> [summary]

---

## audit-dependencies — [timestamp]

> [summary]

---

## audit-business-logic — [timestamp]

> [summary]

---

<!-- Example of a completed finding block — delete this before use -->
<!--
### SEC-001 · Hardcoded Stripe API Key [CRITICAL]
**Skill:** audit-secrets
**File:** `src/config/payments.js:14`
**Category:** Secrets / Credential Exposure

**Evidence:**
```javascript
const STRIPE_KEY = "sk_live_abc123xyzREALKEY"
```

**Risk:** Any developer with read access to the repository can use this live key to make real charges or read customer payment data.

**Remediation:** Remove the hardcoded value, rotate the key immediately in the Stripe dashboard, and replace with `process.env.STRIPE_SECRET_KEY` loaded from a `.env` file excluded from version control.

**OWASP:** A02:2021 – Cryptographic Failures
**Status:** OPEN
-->
