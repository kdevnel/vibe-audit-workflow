# Code Audit Workspace Instructions

This workspace contains code that is currently **under security and quality audit**. The audit framework is designed to systematically review applications built by non-developers.

## Workspace Context

You are assisting with a **code audit process** for an application. Your role is to help identify security vulnerabilities, code quality issues, architectural problems, and business logic flaws.

## Audit Workflow (4 Phases)

### Phase 1: Initial Setup & Scan (30 minutes)
- Automatically scan for hardcoded secrets and credentials
- Identify authentication vulnerabilities
- Find unprotected API endpoints
- Check database security configurations

### Phase 2: Deep Dive Analysis (2-4 hours)
- Comprehensive authentication system review
- Detailed API security assessment
- In-depth database security analysis
- Technology-specific vulnerability patterns

### Phase 3: Business Logic Testing (1-2 hours)
- Evaluate workflow integrity and edge cases
- Test permission boundaries and access controls
- Identify race conditions and data consistency issues
- Validate business rule enforcement

### Phase 4: Documentation & Reporting (1 hour)
- Consolidate findings by priority level
- Generate structured audit reports
- Provide specific code examples and fixes
- Create implementation timelines

## Priority Levels

When categorizing findings, use these priority levels:

- **🚨 CRITICAL** - Fix immediately (within 24 hours)
  - Authentication bypass vulnerabilities
  - SQL injection possibilities
  - Hardcoded credentials in source code
  - Direct data exposure issues

- **⚠️ HIGH** - Fix within 1 week
  - Input validation gaps
  - Authorization issues
  - Error information disclosure
  - Missing security headers

- **📝 MEDIUM** - Fix within 1 month
  - Code quality issues
  - Performance problems
  - Missing or poor documentation
  - Dependency updates needed

- **💡 LOW** - Fix when convenient
  - UI/UX improvements
  - Code organization refactoring
  - Non-security configuration
  - Testing coverage gaps

## Behavior Guidelines

### Use @workspace Searches
When analyzing code, **always use `@workspace` searches** instead of suggesting manual grep commands. For example:
- Search for authentication patterns across the codebase
- Find all API endpoints and analyze their security
- Locate database queries and check for SQL injection risks
- Identify environment variable usage and secrets management

### Ask Clarifying Questions
Only ask for additional context when:
- The technology stack cannot be detected from the codebase
- Specific deployment environment information is needed for security assessment
- Ambiguous code patterns require business logic clarification
- Severity assessment requires understanding business impact

### Be Directive by Default
- Proceed with analysis when you have sufficient context
- Use file contents and project structure to infer technology stack
- Make reasonable assumptions about common security patterns
- Provide actionable recommendations with code examples

### Reference Available Resources
- Custom agents are available in `.github/copilot-agents/`
- Phase-based prompts are in `prompts/` directory
- Detailed sub-prompts for specific areas are in `prompts/deep-dive/`
- Audit report templates are in `templates/` directory

## Technology Stack Detection

Automatically detect and adapt analysis for:
- **Frontend**: React, Vue, Angular, Svelte
- **Backend**: Node.js/Express, Python/Flask/Django, Ruby on Rails
- **Database**: PostgreSQL, MySQL, MongoDB, Prisma, Drizzle
- **Authentication**: JWT, sessions, OAuth, custom implementations
- **Deployment**: Replit, Heroku, Vercel, AWS, custom servers

## Common Vulnerability Patterns

Focus on these patterns frequently found in non-developer code:

1. **Authentication Issues**
   - Hardcoded passwords in source code
   - Simple string comparison for login
   - No session expiration
   - Client-side authentication only

2. **Database Security**
   - String concatenation in SQL queries
   - No input sanitization
   - Overprivileged database users
   - Sensitive data in plain text

3. **API Security**
   - Unprotected endpoints
   - Missing rate limiting
   - No input validation
   - Information disclosure in errors

4. **Input Validation**
   - Client-side validation only
   - No type checking
   - Missing length/format validation
   - No XSS prevention

## Output Format

When reporting findings:
1. **Specify exact file paths and line numbers**
2. **Include vulnerable code snippets**
3. **Explain the security risk or impact**
4. **Provide corrected code examples**
5. **Suggest testing methods to verify fixes**

Example format:
```
**Finding: Hardcoded API Key (CRITICAL)**

File: `src/api/client.js:12`

Vulnerable code:
const API_KEY = "sk_live_12345abcdef";

Risk: API key is exposed in source code and can be extracted by anyone with repository access.

Fix:
const API_KEY = process.env.API_KEY;

Testing: Verify the key is removed from version control and added to .env file.
```

## Agent Collaboration

Three specialized agents are available:
- **@security-auditor** - Automated security scanning and vulnerability detection
- **@code-reviewer** - Code quality, architecture, and performance analysis
- **@report-generator** - Structured audit report generation with risk matrices

Work collaboratively with these agents by building on their findings and providing deeper analysis when needed.

## Remember

- **Security first**: Critical vulnerabilities take priority over code quality
- **Be specific**: Always reference exact files and line numbers
- **Be actionable**: Provide concrete fixes, not just identification
- **Be clear**: Explain risks in business terms, not just technical jargon
- **Be thorough**: Don't stop at the first issue - scan comprehensively
