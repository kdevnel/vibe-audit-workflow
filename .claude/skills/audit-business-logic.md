# /audit-business-logic

Audits the application's business logic for flaws that automated scanners miss: IDOR at the data layer, race conditions, workflow bypass, price manipulation, privilege escalation through normal UI flows, and abuse of external service integrations. This skill requires reasoning about the application's purpose and data model — not just pattern matching.

Run after all parallel skills complete and after `/audit-api`.

---

## Invocation

```
/audit-business-logic <output-dir>
```

Reads `<output-dir>/audit-context.md` and all prior findings in `<output-dir>/audit-findings.md`. Appends to the `## audit-business-logic` section.

---

## What This Skill Covers

| Check | Description |
|-------|-------------|
| IDOR at the data layer | Ownership checks present in API layer but absent at the service/ORM level |
| Horizontal privilege escalation | User A can perform actions on User B's resources |
| Vertical privilege escalation | Regular user can elevate to admin through normal flows |
| Race conditions | Concurrent operations on shared mutable state (double-spend, double-booking) |
| Workflow bypass | Required steps skippable by crafting direct API calls |
| Numeric edge cases | Negative values, zero values, integer overflow, floating-point precision |
| Price and discount manipulation | Overrideable price fields, stackable discounts, coupon abuse |
| Email and notification abuse | Triggering emails/SMS to arbitrary recipients using the app |
| External API proxy abuse | Using the app as a free proxy to make unlimited calls to paid external APIs |
| Denial of service via logic | Operations that can be triggered repeatedly to degrade service |

---

## Steps

### Step 1 — Build domain model from prior findings and code

Unlike previous skills, this one starts by understanding *what the application does* before looking for flaws.

Read `<output-dir>/audit-context.md` — especially Notes, External integrations, and Key paths.

Then read the prior findings in `<output-dir>/audit-findings.md` to understand what's already known:
- Which routes exist (from `API-` section)
- What auth system is used and what roles/permissions exist (from `AUTH-` section)
- What the data schema looks like (from `DB-` section)

Then read the main application code to answer:
1. **What does this app do?** (e.g. marketplace, SaaS dashboard, booking system, e-commerce, internal tool)
2. **Who are the user types?** (anonymous, authenticated user, admin, etc.)
3. **What are the main entities?** (User, Order, Product, Booking, etc.)
4. **What are the key workflows?** (registration → checkout → fulfilment; create listing → receive offer → accept)
5. **What money or value flows through the app?** (payments, credits, subscriptions)
6. **What external services are called?** (from External integrations in context)

Document this mental model — it directs the rest of the skill.

---

### Step 2 — IDOR at the data and service layer

The API skill checked whether route handlers verify ownership. This step checks whether the underlying service functions or repository layer also enforce ownership, and whether ownership checks can be bypassed through indirect access patterns.

```bash
# Find service layer functions that take an ID parameter
grep -r -n -iE "async\s+(get|find|fetch|load|read|update|delete)[A-Z][a-zA-Z]+\s*\([^)]*[Ii]d\b" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "test\|spec"

# Find ORM queries that filter by ID only (no userId filter)
grep -r -n -iE "(findUnique|findFirst|findById|find_by_id|get_by_id)\s*\(\s*\{[^}]*\bwhere\b[^}]*\bid\b[^}]*\}" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "test\|spec" | head -20
```

For each service function that retrieves a resource by ID, read it in full and ask:
- Does the query include `AND userId = $currentUserId` (or equivalent)?
- Or does it just do `WHERE id = $resourceId`?
- If no ownership filter at the query level, is there a check in the calling code that compares `resource.userId === currentUser.id`?

Either approach is acceptable — what is not acceptable is neither.

```bash
# Look for post-fetch ownership checks
grep -r -n -iE "(\.userId\s*!==|\.userId\s*!=|\.ownerId\s*!==|\.createdBy\s*!==)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

---

### Step 3 — Horizontal privilege escalation

Can User A take actions that belong to User B without being an admin?

Focus on:
1. **Update and delete operations** — can a user update someone else's profile, post, order?
2. **Relationship operations** — can a user add themselves to someone else's organisation, team, or group?
3. **File operations** — can a user read or delete files belonging to another user?

```bash
# Update operations — check what identifies the target resource
grep -r -n -iE "(\.update\s*\(|\.updateOne\s*\(|\.save\s*\()" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "test\|spec" | head -20
```

For each mutation handler in the API route list (from prior findings), trace the code path:
1. What value identifies the resource being modified? (usually `req.params.id`)
2. Is this ID validated against the current user's ownership before the mutation executes?
3. Could an attacker change this ID in the request to modify another user's resource?

---

### Step 4 — Vertical privilege escalation

Can a regular user gain admin or elevated permissions through normal application flows?

```bash
# Role or permission assignment endpoints
grep -r -n -iE "(role\s*:|isAdmin\s*:|permissions\s*:|userRole\s*=)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "test\|spec" | head -20

# Invitation or team-join flows
grep -r -n -iE "(invite|addMember|joinTeam|addUser|grantAccess)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | head -20

# Admin routes or admin-only functions
grep -r -n -iE "(\/admin|isAdmin|requireAdmin|adminOnly|role\s*===\s*['\"]admin)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | head -20
```

Evaluate:
- Can a user set their own `role` field by including it in a profile update request? (mass assignment from Step 9 in `/audit-api` — note cross-reference)
- Can a user invite themselves to a group with a higher-privilege role?
- Are admin routes protected by a role check server-side, or only hidden in the UI?

---

### Step 5 — Race conditions

Race conditions occur when two concurrent requests modify shared state and the application assumes sequential execution. Most common in financial operations and inventory systems.

```bash
# Check for atomic operations / transactions
grep -r -n -iE "(\$transaction|beginTransaction|BEGIN\s+TRANSACTION|transaction\s*\(|START TRANSACTION)" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Check for balance/credit/quantity update patterns (read-modify-write without transaction)
grep -r -n -iE "(balance|credit|quantity|stock|seats|inventory)\s*[-+]=\|balance\s*=\s*balance\s*[-+]" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"
```

For any operation that:
1. Reads a value (balance, quantity, seat count)
2. Performs a calculation
3. Writes the new value back

…without wrapping steps 1–3 in a database transaction or using an atomic DB operation (`UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1`), there is a race condition.

**Common vulnerable patterns in vibe-coded apps:**
- Redeeming a discount code: check if used, mark as used, apply discount — if two requests arrive simultaneously, code gets used twice
- Booking last seat: check availability, create booking — double-booking possible
- Processing a payment: check subscription status, deduct credits, grant access — double-spend possible

**Triage:**
- Race condition on financial operations (payment, balance deduction) → HIGH
- Race condition on inventory / limited-availability items → HIGH
- Race condition on rate-limiting or single-use tokens → HIGH
- Race condition on non-financial shared state → MEDIUM

---

### Step 6 — Workflow bypass

Can an attacker skip required steps in a multi-step workflow by making direct API calls?

Reference the endpoint list from the `API-` findings and the mental model from Step 1. For each multi-step workflow (e.g. registration → email verification → account activation; cart → checkout → payment → fulfilment):

1. What step is each API endpoint associated with?
2. Does later-step endpoint verify that earlier steps were completed?
3. Can an attacker call the fulfilment endpoint without completing payment?

```bash
# Status fields that track workflow progress
grep -r -n -iE "(status\s*===|status\s*!==|orderStatus|paymentStatus|verificationStatus)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "test\|spec" | head -20
```

**Triage:**
- Payment step skippable → CRITICAL
- Email verification bypassable → HIGH
- Approval workflow skippable → HIGH
- Non-financial workflow step skippable → MEDIUM

---

### Step 7 — Numeric and boundary edge cases

```bash
# Numeric fields used in calculations
grep -r -n -iE "(quantity|amount|price|total|discount|credits|balance)\s*\*\s*|parseFloat\s*\(|parseInt\s*\(" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "test\|spec" | head -20
```

For each numeric field that flows from user input into a calculation:
- Is the value validated as positive? (negative quantity → negative charge → money back)
- Is the value validated as non-zero?
- Are there upper bounds? (quantity = 999999 to trigger large order)
- Is floating-point arithmetic used for money? (use integers/decimals for currency)

```bash
# Check for floating-point money arithmetic
grep -r -n -iE "(price|amount|total|charge)\s*[\*\/\+\-]\s*[0-9]" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | grep -v "test\|spec" | head -20
```

Floating-point used for money (e.g. `0.1 + 0.2 !== 0.3`) → MEDIUM (financial rounding errors).

---

### Step 8 — Price and discount manipulation

Only run if the application handles payments or has a pricing model (check External integrations for Stripe, Paddle, etc.).

```bash
# Price field in API request body
grep -r -n -iE "(req\.body\.(price|amount|total|cost)|body\['price'\])" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/"

# Discount / coupon code validation
grep -r -n -iE "(coupon|discount|promo|voucher)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | head -20

# Price lookup — is price read from DB or from request?
grep -r -n -iE "(product\.price|item\.price|stripe\.checkout|paymentIntent\.create)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | head -20
```

**Critical check:** When creating a payment intent (Stripe, etc.), is the price:
- Read from the database based on the product ID → correct
- Taken from `req.body.price` or a client-supplied value → CRITICAL (user can set price to $0.01)

**Discount abuse:**
- Can a coupon code be applied multiple times? (Check for single-use enforcement)
- Can multiple discount codes be stacked beyond the intended maximum?
- Can a discount code from one user account be used by another?

---

### Step 9 — Email and notification abuse

```bash
# Email sending calls
grep -r -n -iE "(sendMail|sendEmail|transporter\.send|resend\.emails\.send|sgMail\.send|mailgun)" \
  --include="*.ts" --include="*.js" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | head -20
```

For each email-sending call, trace where the recipient address comes from:
- **From authenticated user's own profile** → correct (they can only email themselves)
- **From `req.body.email`** — ask: is this the user's own email or an arbitrary address they supply?
  - If arbitrary: can an attacker trigger spam emails to any address using your app's email domain? → HIGH
- **Invite flows** — is the invited email address validated? Can an attacker mass-invite to trigger email spam?

---

### Step 10 — External API proxy abuse

```bash
# External API calls that use user-supplied parameters
grep -r -n -iE "(fetch\s*\(|axios\.(get|post)|requests\.(get|post))" \
  --include="*.ts" --include="*.js" --include="*.py" \
  "$TARGET" 2>/dev/null | grep -v node_modules | grep -v "/.git/" | head -20
```

For each outbound API call from the server:
- Is the URL or endpoint path constructed from user input? → SSRF risk (HIGH)
- Is the API call rate-limited per user? If not, can an attacker trigger unlimited paid API calls (OpenAI, SMS, etc.) through your app? → MEDIUM to HIGH depending on cost

---

### Step 11 — Classify and write findings

For every issue identified in Steps 2–10:

1. Assign a `BL-NNN` ID starting at `BL-001`
2. For each finding, write a concrete **attack scenario** in the Evidence field — not just an abstract description. Example: *"Attacker sends `DELETE /api/orders/456` where order 456 belongs to another user. The handler calls `deleteOrder(req.params.id)` with no ownership check, successfully deleting another user's order."*
3. Write each finding into the `## audit-business-logic` section of `$FINDINGS`

Replace the section header with actual timestamp. Update the blockquote summary.

---

## Severity Guide for This Skill

| Condition | Severity |
|-----------|----------|
| Price/amount taken from client request body (user sets their own price) | CRITICAL |
| Payment or financial workflow step is bypassable | CRITICAL |
| Horizontal IDOR — user can read/modify any user's data | CRITICAL |
| SSRF via user-controlled URL in server-side fetch | CRITICAL |
| Vertical privilege escalation via mass assignment (`role` settable) | CRITICAL |
| Race condition on financial / payment operations | HIGH |
| Race condition on single-use tokens (discount codes, invite links) | HIGH |
| Email verification or required approval workflow bypassable | HIGH |
| User can trigger emails to arbitrary external recipients | HIGH |
| Unlimited external paid API calls triggerable per user | HIGH |
| Negative or zero value accepted in financial calculation | HIGH |
| Horizontal IDOR — user can read (not modify) another user's data | HIGH |
| Race condition on inventory / limited availability | HIGH |
| Discount code reusable without limit | HIGH |
| Non-financial workflow step bypassable | MEDIUM |
| Floating-point used for monetary calculations | MEDIUM |
| Missing upper-bound validation on numeric fields | MEDIUM |
| Admin routes visible in UI to non-admins (UX only, server-side protected) | LOW |

---

## Done When

- [ ] Application domain model documented (purpose, user types, entities, workflows, money flows)
- [ ] All 10 steps completed
- [ ] Every finding includes a concrete attack scenario in the Evidence field
- [ ] All findings written with correct `BL-NNN` IDs
- [ ] Section summary updated
- [ ] Handoff: print `"audit-business-logic complete — [N] findings. Next: /audit-report <output-dir>"`
