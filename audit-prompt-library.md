# Reusable Audit Prompts for Non-Developer Applications

## Quick Assessment Prompts

### 1. Initial Security Scan Prompt
```
Perform a security audit of this codebase. Focus on:

1. **Authentication & Authorization**
   - Are there hardcoded passwords, tokens, or secrets?
   - How is user authentication implemented?
   - Are API endpoints properly protected?
   - What session management exists?

2. **Input Validation & Injection Prevention**
   - How is user input validated?
   - Are there SQL injection vulnerabilities?
   - Is there XSS prevention?
   - How are file uploads handled?

3. **Data Security**
   - How is sensitive data stored and transmitted?
   - Are passwords properly hashed?
   - What database security measures exist?
   - How are environment variables managed?

4. **Error Handling**
   - Do error messages leak sensitive information?
   - How are exceptions handled?
   - What gets logged and where?

Search the codebase for these patterns and report findings with specific file locations and code snippets.
```

### 2. Code Quality Assessment Prompt
```
Analyze this codebase for code quality and maintainability issues:

1. **TypeScript/JavaScript Quality**
   - Type safety implementation
   - Proper error handling patterns
   - Code organization and structure
   - Function complexity and size

2. **Architecture & Design**
   - Separation of concerns
   - Code duplication
   - Dependency management
   - Configuration management

3. **Performance Issues**
   - Database query efficiency (N+1 problems)
   - Resource management
   - Bundle size and optimization
   - Caching strategies

4. **Best Practices**
   - Documentation quality
   - Testing coverage
   - Linting and formatting
   - Security best practices

Provide specific examples and recommendations for improvement.
```

### 3. Business Logic Review Prompt
```
Review the business logic implementation for this application:

1. **Data Flow Analysis**
   - Trace the main user workflows from input to output
   - Identify potential race conditions
   - Check for data consistency issues
   - Validate business rule enforcement

2. **Edge Case Handling**
   - What happens with invalid inputs?
   - How are error states managed?
   - Are there boundary condition issues?
   - What about concurrent user actions?

3. **Permission & Access Control**
   - Who can access what features?
   - How are permissions enforced?
   - Are there privilege escalation risks?
   - What about data access controls?

4. **Integration Points**
   - External API security
   - Third-party service integration
   - Database interaction patterns
   - Email/communication security

Provide specific scenarios where the logic might fail or be exploited.
```

## Technology-Specific Prompts

### React/Frontend Applications
```
Audit this React application for frontend-specific security and quality issues:

**Security Focus:**
- Client-side secret exposure (API keys, passwords, tokens)
- XSS vulnerability patterns (dangerouslySetInnerHTML, eval)
- Authentication state management
- Local storage security
- Bundle analysis for sensitive data

**Quality Focus:**
- Component architecture and reusability
- State management patterns
- Performance optimization (memoization, lazy loading)
- Accessibility compliance
- Error boundary implementation

**Search Patterns:**
- `process.env` usage in client code
- `localStorage` / `sessionStorage` usage
- `innerHTML` / `dangerouslySetInnerHTML`
- Authentication token handling
- API call patterns and error handling

Provide specific file locations and recommend fixes.
```

### Node.js/Express Backend
```
Audit this Node.js/Express backend for security and performance issues:

**Security Analysis:**
- Route-level authentication and authorization
- Input validation and sanitization
- SQL injection prevention
- Rate limiting implementation
- Security headers configuration

**Performance Review:**
- Database connection management
- Query optimization
- Memory leak potential
- Async/await usage patterns
- Error handling and logging

**Search Patterns:**
- Unprotected routes (`app.get`, `app.post` without middleware)
- Database query construction
- Error message content
- Environment variable usage
- Middleware implementation

Focus on production-readiness and security hardening.
```

### Database Security Review
```
Analyze database security and design for this application:

**Security Checklist:**
- Connection string security
- Query parameterization
- Database user privileges
- Data encryption at rest
- Access logging and monitoring

**Design Review:**
- Schema normalization
- Index optimization
- Constraint implementation
- Foreign key relationships
- Data validation rules

**Migration Safety:**
- Schema change management
- Data migration scripts
- Backup and recovery procedures
- Environment consistency

Examine schema files, migration scripts, and database interaction code.
```

## Specialized Vulnerability Prompts

### Authentication System Deep Dive
```
Perform a comprehensive audit of the authentication system:

**Areas to Examine:**
1. **Credential Storage**
   - How are passwords stored?
   - Are proper hashing algorithms used?
   - Salt implementation and uniqueness

2. **Session Management**
   - Token generation and validation
   - Session expiration handling
   - Secure cookie configuration
   - CSRF protection

3. **Authentication Flow**
   - Login/logout processes
   - Password reset functionality
   - Account lockout mechanisms
   - Multi-factor authentication

4. **Authorization Controls**
   - Role-based access control
   - Permission inheritance
   - Privilege escalation prevention
   - Resource-level permissions

**Critical Questions:**
- Can authentication be bypassed?
- Are sessions properly invalidated?
- How are permissions enforced?
- What happens if tokens are compromised?

Provide attack scenarios and specific remediation steps.
```

### API Security Assessment
```
Audit all API endpoints for security vulnerabilities:

**Endpoint Analysis:**
1. **Authentication Requirements**
   - Which endpoints require authentication?
   - How is authentication verified?
   - What about public endpoints?

2. **Input Validation**
   - Parameter validation and sanitization
   - Content-type validation
   - File upload restrictions
   - Size and rate limiting

3. **Output Security**
   - Information disclosure in responses
   - Error message content
   - Data serialization security
   - Response headers

4. **Business Logic**
   - Proper authorization checks
   - State consistency
   - Transaction integrity
   - Race condition prevention

**Test Scenarios:**
- Attempt to access protected endpoints without authentication
- Try malformed inputs and observe error responses
- Test parameter manipulation and injection
- Check for information leakage in error messages

Document each vulnerability with curl examples and fix recommendations.
```

## Quick Reference Checklists

### Critical Security Checklist (5-minute scan)
- [ ] Search for hardcoded passwords/secrets: `grep -r "password\|secret\|key" --include="*.js" --include="*.ts"`
- [ ] Check for unprotected API routes
- [ ] Look for client-side authentication logic
- [ ] Verify environment variable security
- [ ] Check error message information disclosure

### Code Quality Checklist (10-minute scan)
- [ ] TypeScript strict mode configuration
- [ ] Proper error handling patterns
- [ ] Code duplication analysis
- [ ] Large function identification
- [ ] Dependency vulnerability scan

### Performance Checklist (15-minute scan)
- [ ] Database N+1 query patterns
- [ ] Memory leak potential
- [ ] Bundle size analysis
- [ ] Caching implementation
- [ ] Resource optimization

## Audit Report Templates

### Executive Summary Template
```
# Security Audit Report - [Application Name]

**Date:** [Date]
**Auditor:** [Name]
**Risk Level:** [Critical/High/Medium/Low]

## Summary
[Brief description of application and key findings]

**Vulnerabilities Found:**
- Critical: [X] issues
- High: [X] issues
- Medium: [X] issues
- Low: [X] issues

**Key Recommendations:**
1. [Most critical fix needed]
2. [Second priority]
3. [Third priority]

**Timeline for Fixes:**
- Critical issues: Fix immediately (within 24 hours)
- High priority: Fix within 1 week
- Medium priority: Fix within 1 month
- Low priority: Fix when convenient
```

### Vulnerability Detail Template
```
### [Vulnerability Number]. [Vulnerability Name] ([CRITICAL/HIGH/MEDIUM/LOW])

**File:** `path/to/file.js:line`

**Code:**
```javascript
// Vulnerable code snippet
```

**Risk:** [Description of what could go wrong]

**Impact:** [Business/technical impact]

**Fix:**
```javascript
// Corrected code example
```

**Testing:** [How to verify the fix works]
```

## Usage Instructions

1. **Start with Quick Assessment**: Use the initial security scan prompt to get an overview
2. **Focus on Critical Issues**: Use specialized prompts for areas flagged as high-risk
3. **Technology-Specific Review**: Apply framework-specific prompts based on the tech stack
4. **Document Everything**: Use the report templates to structure findings
5. **Prioritize Fixes**: Focus on critical security issues first

This framework can be adapted for different programming languages, frameworks, and application types by modifying the search patterns and focus areas while maintaining the same systematic approach.