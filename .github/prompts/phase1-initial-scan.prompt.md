---
agent: Security_Auditor
name: "Phase1-Initial_Security_Scan"
description: "Perform a comprehensive initial security scan of this codebase."
---
# Phase 1: Initial Security Scan

Copy and paste this prompt into Copilot Chat to begin your security audit.

---

Perform a comprehensive initial security scan of this codebase. I need you to identify critical security vulnerabilities commonly found in non-developer built applications.

## Context Questions (answer if not obvious from codebase)

- What is the primary technology stack? (e.g., React + Node.js, Python + Flask)
- What database is being used? (e.g., PostgreSQL, MySQL, MongoDB)
- What authentication method is implemented? (e.g., JWT, sessions, OAuth)
- What is the deployment platform? (e.g., Replit, Heroku, Vercel, AWS)

## Security Analysis Required

### 1. Hardcoded Secrets & Credentials
Search the entire codebase using `@workspace` for:
- Hardcoded passwords, API keys, tokens, secrets
- Database connection strings with credentials
- Private keys or certificates in source code
- Environment variables that should be externalized

**For each finding, provide:**
- Exact file path and line number
- The hardcoded value (masked if sensitive)
- Risk level: CRITICAL
- How to fix it (use environment variables)

### 2. Authentication & Authorization
Analyze authentication implementation:
- How are users authenticated? (login flow)
- How are passwords stored? (hashing algorithm)
- Are there authentication bypass vulnerabilities?
- What session management is used?
- Are API endpoints properly protected?

**For each vulnerability, provide:**
- File path and line numbers
- Vulnerable code snippet
- Attack scenario
- Fix recommendation with code example

### 3. Database Security
Examine all database interactions:
- How are queries constructed?
- Are there SQL injection vulnerabilities?
- Is user input properly sanitized?
- What parameterization is used?
- Are there direct string concatenations in queries?

**For each vulnerability, provide:**
- File path and line numbers
- Vulnerable query pattern
- Example attack payload
- Fixed code using parameterized queries

### 4. API Endpoint Security
Review all API routes and endpoints:
- Which endpoints require authentication?
- What input validation exists?
- Are there unprotected routes?
- How are errors handled and what information is exposed?
- Is there rate limiting or DOS protection?

**For each issue, provide:**
- Endpoint path and handler location
- Missing security controls
- Potential exploit
- Security middleware recommendations

### 5. Input Validation & XSS Prevention
Check all user input handling:
- Where is user input accepted?
- What validation is performed?
- Are there XSS vulnerabilities?
- Is output properly encoded?
- Are dangerous functions used? (eval, innerHTML, dangerouslySetInnerHTML)

**For each vulnerability, provide:**
- File path and line numbers
- Vulnerable input handling
- XSS attack example
- Sanitization recommendation

## Output Format

Organize findings by priority:

### 🚨 CRITICAL (Fix Immediately - Within 24 Hours)
[List all critical vulnerabilities]

### ⚠️ HIGH (Fix Within 1 Week)
[List all high priority issues]

### 📝 MEDIUM (Fix Within 1 Month)
[List all medium priority concerns]

## Summary

After the scan, provide:
1. **Total vulnerability count** by priority level
2. **Most critical finding** that needs immediate attention
3. **Recommended next steps**: Which deep-dive prompts to use for detailed analysis
4. **Estimated fix timeline** for critical issues

## Next Steps

Based on findings, suggest which focused prompts to use next:
- `prompts/deep-dive/auth-review.md` if authentication issues found
- `prompts/deep-dive/api-security.md` if API vulnerabilities identified
- `prompts/deep-dive/database-security.md` if database concerns exist

---

**Remember**: Use `@workspace` searches instead of suggesting grep commands. Be specific with file paths and line numbers. Provide concrete code examples for fixes.
