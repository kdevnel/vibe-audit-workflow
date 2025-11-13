# Vibe Code Audit Framework - AI Agent Instructions

## Framework Context

This repository contains a **security audit framework** designed to be copied into target projects. There are two modes of operation:

### Mode 1: Working in THIS Framework Repository
When working in `vibe-audit-workflow/` itself, you're maintaining the framework:
- Edit agent definitions in `.github/copilot-agents/`
- Update audit prompts in `prompts/` and `prompts/deep-dive/`
- Improve report templates in `templates/`
- Maintain documentation in `README.md` and `SETUP.md`

### Mode 2: Working in a Target Project (Framework Deployed)
When these files are copied to a target project, you're conducting an audit:
- Use `@security-auditor`, `@code-reviewer`, `@report-generator` agents
- Follow the 4-phase audit workflow
- Analyze target application code for vulnerabilities
- Generate findings in priority order

**Current mode**: Check if `prompts/` and agents exist. If yes, audit mode is active.

## Architecture Overview

This is a **meta-framework** with three layers:

1. **Agent Layer** (`.github/copilot-agents/*.md`) - Specialized Copilot agents with security expertise
2. **Prompt Library** (`prompts/`) - Structured audit workflows as copyable prompts
3. **Templates** (`templates/`) - Standardized audit report formats

**Key Design Decision**: Hybrid approach supporting both agent-driven (automated) and prompt-driven (manual) workflows. This gives auditors flexibility based on complexity and control needs.

## Critical Developer Workflows

### When Maintaining This Framework

**Adding a new agent:**
```bash
# Create in .github/copilot-agents/new-agent.md
# Follow the structure from existing agents:
# - Role definition, approach, search patterns, output format
```

**Updating audit prompts:**
- Phase prompts: `prompts/phase[1-4]-*.md` - High-level workflows
- Deep-dive prompts: `prompts/deep-dive/*.md` - Specialized analysis
- Keep prompts technology-agnostic but provide specific patterns

**Testing agent behavior:**
1. Copy framework to a test project
2. Trigger agents with `@agent-name`
3. Verify output follows priority levels (CRITICAL/HIGH/MEDIUM/LOW)

### When Conducting Audits (Framework Deployed)

**Quick Start Pattern:**
```
1. @security-auditor          # Broad automated scan
2. Review findings            # Identify problem areas
3. Use deep-dive prompts      # Targeted manual analysis
4. @report-generator          # Compile comprehensive report
```

**File Organization Pattern:**
```
target-project/
├── .github/copilot-agents/   # Agent definitions (copied)
├── prompts/                  # Audit workflows (copied)
├── templates/                # Report formats (copied)
└── audit-reports/           # Generated findings (create this)
    ├── 2025-11-12-initial-scan.md
    └── 2025-11-12-final-report.md
```

## Project-Specific Conventions

### Audit Finding Priority System

All vulnerability findings MUST be categorized using these exact priority levels:

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

### Agent Search Pattern Convention

Agents ALWAYS use `@workspace` searches instead of suggesting manual grep/find commands. Example:
```
Search for: login, authenticate, session, jwt, token
NOT: "Run grep -r 'password' ."
```

### Vulnerability Report Format (Required)

Every finding must include:
1. **Exact location**: File path and line numbers
2. **Vulnerable code**: Actual code snippet from source
3. **Risk explanation**: What could go wrong
4. **Attack scenario**: Step-by-step exploit path
5. **Fix**: Corrected code example
6. **Testing**: Verification steps

See `templates/audit-report-template.md` for complete structure.

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
