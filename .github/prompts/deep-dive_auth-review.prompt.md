---
agent: Code_Reviewer
name: "Deep-Dive_Auth-Review"
description: "Use this prompt when initial scans identify authentication-related vulnerabilities requiring detailed investigation."
---
# Authentication System Deep Dive

Use this prompt when initial scans identify authentication-related vulnerabilities requiring detailed investigation.

---

Perform a comprehensive security audit of the authentication system. I need detailed analysis of credential storage, session management, authorization controls, and potential attack vectors.

## Authentication Flow Analysis

### 1. User Registration & Credential Storage

**Registration Process:**
- Locate all user registration/signup code
- How are passwords validated during registration?
- What password complexity requirements exist?
- Are there email verification or other confirmations?

**Password Storage:**
- Search for password hashing implementation using `@workspace`
- What hashing algorithm is used? (bcrypt, argon2, pbkdf2, scrypt)
- Are salts unique per user or global?
- What is the work factor/cost parameter?
- Are passwords ever logged or stored in plain text anywhere?

**Code Review Required:**
```
Search for: hash, bcrypt, argon2, pbkdf2, password, encrypt
Locate: User model, registration handler, password utility functions
Verify: Proper hashing before storage, no plain text passwords
```

**For each finding:**
- File path and line numbers
- Current implementation
- Security assessment (strong/weak/vulnerable)
- Recommendations if weak

### 2. Login & Authentication Process

**Login Flow:**
- Trace the complete login process from form submission to session creation
- How are credentials verified?
- What happens on successful login?
- What happens on failed login?
- Is there account lockout after failed attempts?
- Are there timing attack vulnerabilities in login checks?

**Authentication Verification:**
- How is password comparison performed?
- Is there protection against timing attacks?
- Are there any authentication bypass vulnerabilities?
- Can SQL injection bypass authentication?

**Test Scenarios:**
```
1. Standard login attempt
2. Login with incorrect password
3. Login with non-existent user
4. Multiple failed login attempts
5. SQL injection in username/password fields
6. Empty or null credentials
```

**For each vulnerability:**
- Description and location
- Attack demonstration
- Fix recommendation with code

### 3. Session Management

**Session Creation:**
- How are sessions/tokens generated?
- What entropy source is used for randomness?
- Are session IDs predictable?
- Where are sessions stored? (memory, database, Redis, client-side)
- What data is stored in sessions?

**Session Lifecycle:**
- What is the session expiration time?
- Are sessions refreshed?
- How are sessions invalidated on logout?
- Are old sessions cleaned up?
- Can users have multiple concurrent sessions?

**Session Security:**
- Are session tokens transmitted securely (HTTPS only)?
- Are session cookies configured properly?
  - httpOnly flag?
  - secure flag?
  - sameSite attribute?
- Is there protection against session fixation?
- Is there CSRF protection?

**Code Review Required:**
```
Search for: session, jwt, token, cookie, authenticate
Locate: Session middleware, token generation, cookie configuration
Verify: Secure configuration, proper expiration, token entropy
```

**For each issue:**
- Configuration problem
- Security risk
- Attack scenario
- Secure configuration example

### 4. Authorization & Access Control

**Permission System:**
- How are user roles and permissions defined?
- Where are authorization checks performed?
- Are checks consistent across all endpoints?
- Can permissions be bypassed?

**Authorization Implementation:**
- Search for all authorization/permission checks
- Are they on server-side only or also client-side?
- What happens when authorization fails?
- Are error messages informative but not revealing?

**Test Scenarios:**
```
1. Access admin endpoint as regular user
2. Modify other users' data
3. Access resources without authentication
4. Manipulate role/permission in request
5. Try horizontal privilege escalation
6. Try vertical privilege escalation
```

**Code Review Required:**
```
Search for: authorize, permission, role, admin, protect, guard
Locate: Middleware, route handlers, authorization checks
Verify: Server-side enforcement, consistent checking, proper error handling
```

**For each vulnerability:**
- Access control gap
- What can be accessed inappropriately
- Exploit demonstration
- Fix with proper authorization middleware

### 5. Password Reset & Recovery

**Reset Flow:**
- How is password reset initiated?
- How are reset tokens generated?
- How long are reset tokens valid?
- Can reset tokens be reused?
- Can reset tokens be predicted?

**Reset Security:**
- Are reset links sent via secure channel (email)?
- Is there account enumeration via reset?
- Can reset tokens be brute-forced?
- What happens after password is reset?
- Are existing sessions invalidated?

**Vulnerabilities to Check:**
- Predictable reset tokens
- Reset tokens that don't expire
- Account enumeration through reset
- Reset token reuse
- No rate limiting on reset requests

### 6. Multi-Factor Authentication (if applicable)

**MFA Implementation:**
- What MFA methods are supported?
- How are MFA secrets stored?
- Can MFA be bypassed?
- What happens if MFA device is lost?

**MFA Security:**
- Are backup codes secure?
- Is there rate limiting on MFA attempts?
- Are MFA codes time-based and single-use?

## Common Authentication Vulnerabilities

Check for these specific issues:

### Vulnerability 1: Weak Password Hashing
```typescript
// VULNERABLE - Plain MD5 or SHA1
const hash = crypto.createHash('md5').update(password).digest('hex');

// SECURE - bcrypt with proper cost factor
const hash = await bcrypt.hash(password, 12);
```

### Vulnerability 2: Timing Attack in Password Comparison
```typescript
// VULNERABLE - Early return on mismatch
if (userPassword !== inputPassword) return false;

// SECURE - Constant-time comparison
const match = await bcrypt.compare(inputPassword, userPassword);
```

### Vulnerability 3: Insecure Session Configuration
```typescript
// VULNERABLE
res.cookie('session', token);

// SECURE
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
});
```

### Vulnerability 4: No Authorization Checks
```typescript
// VULNERABLE - No authorization check
app.get('/api/user/:id', (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
});

// SECURE - Verify user can access resource
app.get('/api/user/:id', authenticate, (req, res) => {
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = await db.getUser(req.params.id);
  res.json(user);
});
```

## Output Format

For EACH authentication vulnerability:

```markdown
## [Vulnerability Name] (PRIORITY)

**Location**: `path/to/file.ts:lines`

**Current Implementation**:
```typescript
// Current vulnerable code
\`\`\`

**Vulnerability**: [What's wrong]

**Attack Scenario**:
[Step-by-step exploitation]

**Impact**: [What happens if exploited]

**Secure Implementation**:
```typescript
// Fixed code
\`\`\`

**Testing**:
[How to verify fix works]

**Priority**: [CRITICAL/HIGH/MEDIUM]
**Estimated Fix Time**: [X hours]
```

## Summary Required

After analysis, provide:

1. **Total authentication vulnerabilities found**
2. **Critical issues requiring immediate attention**
3. **Overall authentication security rating**: Strong/Moderate/Weak/Critical
4. **Recommended fixes in priority order**
5. **Estimated total fix time**

---

**Remember**: Focus on server-side security. Client-side checks are easily bypassed. Provide specific code examples for all fixes.
