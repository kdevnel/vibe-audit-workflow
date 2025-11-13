---
agent: Code_Reviewer
name: "Phase2-Deep_Dive_Analysis"
description: "Perform a thorough deep-dive analysis of specific security areas identified in the initial scan."
---
# Phase 2: Deep Dive Analysis

Copy and paste this prompt into Copilot Chat for comprehensive deep-dive analysis of specific security areas.

---

I need a thorough deep-dive analysis of the security areas identified in the initial scan. This phase should provide detailed investigation of authentication, API security, and database security.

## Areas to Analyze

### 1. Authentication System Comprehensive Review

Analyze the complete authentication system:

**Login/Registration Flow:**
- Trace the entire user registration process
- Examine password validation and strength requirements
- Check password storage mechanism (hashing algorithm, salt usage)
- Review login process and credential verification
- Analyze session creation and token generation

**Session Management:**
- How are sessions stored? (memory, database, Redis)
- What session expiration policies exist?
- How are sessions invalidated on logout?
- Is there protection against session fixation?
- Are there concurrent session limits?

**Authorization Controls:**
- How are user roles and permissions defined?
- Where are authorization checks performed?
- Can users escalate their privileges?
- Are there resource-level access controls?
- How is ownership/access validated?

**Password Security:**
- What hashing algorithm is used? (bcrypt, argon2, pbkdf2)
- Are salts unique per user?
- What is the password complexity policy?
- How is password reset handled?
- Are there account lockout mechanisms?

**For each finding, provide:**
- Complete file paths and line numbers
- Current implementation code
- Security vulnerability or weakness
- Attack scenario demonstrating the risk
- Secure implementation with code example
- Testing method to verify the fix

### 2. API Security In-Depth Assessment

Examine all API endpoints and their security:

**Endpoint Inventory:**
- List all API routes and their purposes
- Identify which require authentication
- Map authentication middleware usage
- Check for undocumented or forgotten endpoints

**Input Validation:**
- What validation library is used? (Zod, Joi, class-validator)
- Where is validation performed? (client, server, both)
- Are all inputs validated before processing?
- What happens with invalid inputs?
- Are file uploads properly restricted?

**Authorization at API Level:**
- How is user context determined for each request?
- Are permission checks consistent across endpoints?
- Can users access resources they don't own?
- Are there insecure direct object references?

**Error Handling & Information Disclosure:**
- What information is exposed in error messages?
- Are stack traces visible in responses?
- How are errors logged?
- What HTTP status codes are used correctly?

**Rate Limiting & DOS Protection:**
- Is there rate limiting implemented?
- What endpoints are most vulnerable to abuse?
- Are there resource consumption limits?
- How are large payloads handled?

**For each vulnerability, provide:**
- API endpoint and method
- Current security gaps
- Exploit demonstration
- Secure implementation
- Testing approach

### 3. Database Security Comprehensive Analysis

Deep-dive into database security:

**Connection Security:**
- How is database connection configured?
- Where are credentials stored?
- Is connection pooling implemented?
- Are connections encrypted (SSL/TLS)?

**Query Construction:**
- How are queries built? (raw SQL, query builder, ORM)
- Are parameterized queries used consistently?
- Any string concatenation in queries?
- How are dynamic queries handled?

**Input Sanitization:**
- What sanitization occurs before database operations?
- Are there any bypass possibilities?
- How are special characters handled?
- What about stored XSS in database content?

**Database Permissions:**
- What database user privileges are configured?
- Does the application have excessive permissions?
- Are there separate users for different operations?
- How are migrations handled?

**Data Protection:**
- Is sensitive data encrypted at rest?
- What fields contain PII or sensitive information?
- How is data sanitized before logging?
- Are there backups and how are they secured?

**For each issue, provide:**
- Database query location and context
- Current vulnerable implementation
- Injection attack example
- Secure parameterized version
- Database security recommendations

## Output Format

For each security area, provide:

```markdown
## [Security Area] Analysis

### Overview
[Summary of current implementation]

### Vulnerabilities Discovered

#### 1. [Vulnerability Name] (PRIORITY)

**Location**: `file/path:line`

**Current Implementation**:
```language
// Current code
\`\`\`

**Vulnerability**: [Description]

**Attack Scenario**: [How it could be exploited]

**Secure Implementation**:
```language
// Fixed code
\`\`\`

**Testing**: [How to verify]

#### 2. [Next Vulnerability]
[Continue pattern]

### Summary
- Total vulnerabilities found: [X]
- Critical: [X], High: [X], Medium: [X], Low: [X]
- Estimated fix time: [X hours]
```

## Technology-Specific Guidance

**If React/Frontend:**
- Check for secrets in client-side code
- Analyze authentication state management
- Review API call patterns and error handling
- Examine local storage usage for sensitive data

**If Node.js/Express:**
- Review middleware stack and order
- Check route protection patterns
- Analyze async/await error handling
- Examine body parser configuration

**If using ORM (Prisma, Drizzle, TypeORM):**
- Review query methods for injection risks
- Check raw query usage
- Analyze migration security
- Examine seed data for secrets

## Next Steps

After completing deep-dive analysis:
1. Compile all findings into priority order
2. Create proof-of-concept exploits for critical issues
3. Estimate fix time for each vulnerability
4. Proceed to Phase 3 for business logic testing
5. Use `@report-generator` to create comprehensive audit report

---

**Remember**: Be thorough, provide specific code examples, include attack scenarios, and offer concrete fixes with testing methods.
