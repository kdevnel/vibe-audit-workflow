# 🔍 Complete Code Audit Workflow Guide

**Your Single Reference for Auditing Non-Developer Applications**

---

## 📋 Pre-Audit Setup (5 minutes)

### Step 1: Environment Preparation
```bash
# Set up your audit workspace
export AUDIT_PROJECT_PATH="/path/to/project"
export AUDIT_DATE=$(date +%Y-%m-%d)
export AUDIT_OUTPUT_DIR="./audit-reports/$AUDIT_DATE"
mkdir -p $AUDIT_OUTPUT_DIR
```

### Step 2: Quick Project Discovery
Run these commands to understand the project:
```bash
# Find key configuration files
find $AUDIT_PROJECT_PATH -name "package.json" -o -name "*.md" -o -name "README*" | head -10

# Look for environment/config files
find $AUDIT_PROJECT_PATH -name ".env*" -o -name "config*" -o -name "secrets*"

# Identify main technology stack
ls -la $AUDIT_PROJECT_PATH
```

### Step 3: Create Your Audit Report File
```bash
cp AUDIT_PROMPT_LIBRARY.md $AUDIT_OUTPUT_DIR/
touch $AUDIT_OUTPUT_DIR/audit-findings-$(date +%Y%m%d).md
```

---

## 🚀 Phase 1: Automated Security Scan (30 minutes)

### Step 4: Run Initial Security Prompts

**Use this prompt first:**
> 📖 **Reference:** See "Initial Security Scan Prompt" in AUDIT_PROMPT_LIBRARY.md

Copy and paste the Initial Security Scan Prompt from the library, then add this project-specific context:
```
Project Context:
- Technology Stack: [React/Node.js/Python/etc.]
- Database: [PostgreSQL/MySQL/MongoDB/etc.]
- Authentication Method: [Observed method]
- Deployment Platform: [Replit/Heroku/AWS/etc.]

Focus on these specific files first:
- Authentication components
- API route definitions
- Database connection files
- Environment configuration
```

### Step 5: Critical Security Scans
Run these automated searches and document findings:

**Hardcoded Secrets Search:**
```bash
grep -r -i "password\|secret\|token\|key\|auth" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.py" .
```
Record any findings with file locations.

**Environment Variable Usage:**
```bash
grep -r "process\.env\|\.env\|os\.environ" --include="*.js" --include="*.ts" --include="*.py" .
```

**Database Query Patterns:**
```bash
grep -r "SELECT\|INSERT\|UPDATE\|DELETE\|sql\|query" --include="*.js" --include="*.ts" --include="*.py" .
```

### Step 6: Categorize Initial Findings
Create sections in your audit report:
- 🚨 **CRITICAL** (fix immediately)
- ⚠️ **HIGH** (fix this week)
- 📝 **MEDIUM** (fix this month)
- 💡 **LOW** (fix when convenient)

---

## 🔍 Phase 2: Manual Deep Dive (2-4 hours)

### Step 7: Authentication System Review

**Use this specialized prompt:**
> 📖 **Reference:** See "Authentication System Deep Dive" in AUDIT_PROMPT_LIBRARY.md

**Your action steps:**
1. Locate all authentication-related files
2. Trace the login/logout flow
3. Check password storage method
4. Verify session management
5. Test for authentication bypass

**Common files to examine:**
- `components/ProtectedRoute.tsx`
- `auth.js` or `login.js`
- `middleware/auth.js`
- `routes/auth.js`

### Step 8: API Security Assessment

**Use this specialized prompt:**
> 📖 **Reference:** See "API Security Assessment" in AUDIT_PROMPT_LIBRARY.md

**Your action steps:**
1. List all API endpoints
2. Check which require authentication
3. Test input validation
4. Examine error handling
5. Look for information disclosure

**Commands to help:**
```bash
# Find API routes
grep -r "app\.\|router\.\|@app\.\|@router\." --include="*.js" --include="*.ts" --include="*.py" .

# Check for protected routes
grep -r "middleware\|auth\|protect" --include="*.js" --include="*.ts" --include="*.py" .
```

### Step 9: Database Security Review

**Use this specialized prompt:**
> 📖 **Reference:** See "Database Security Review" in AUDIT_PROMPT_LIBRARY.md

**Your action steps:**
1. Examine database schema files
2. Check connection security
3. Review query construction
4. Validate input sanitization
5. Check for SQL injection risks

**Files to examine:**
- `schema.sql` or `models/`
- `db.js` or `database.py`
- Any migration files
- ORM configuration files

### Step 10: Frontend Security (if applicable)

**Use this technology-specific prompt:**
> 📖 **Reference:** See "React/Frontend Applications" in AUDIT_PROMPT_LIBRARY.md

**Your action steps:**
1. Check for client-side secrets
2. Examine authentication state
3. Look for XSS vulnerabilities
4. Review API call patterns
5. Check local storage usage

---

## 🧪 Phase 3: Business Logic Testing (1-2 hours)

### Step 11: Workflow Analysis

**Use this prompt:**
> 📖 **Reference:** See "Business Logic Review Prompt" in AUDIT_PROMPT_LIBRARY.md

**Your testing approach:**
1. **Happy Path Testing:** Follow normal user workflows
2. **Edge Case Testing:** Try invalid inputs, empty values, extreme values
3. **Permission Testing:** Try accessing features you shouldn't have access to
4. **Concurrent Testing:** Consider what happens if multiple users act simultaneously

### Step 12: Create Test Scenarios
Document these scenarios in your report:

**Example Test Cases:**
```
Test 1: Authentication Bypass
- Try accessing protected pages without login
- Manipulate client-side authentication state
- Test expired session handling

Test 2: Input Validation
- Submit forms with malicious scripts
- Try SQL injection patterns
- Test file upload vulnerabilities

Test 3: Business Logic
- Try to access other users' data
- Attempt to modify data you shouldn't
- Test workflow edge cases
```

---

## 📊 Phase 4: Documentation & Reporting (1 hour)

### Step 13: Consolidate Findings
Use this structure in your audit report:

```markdown
# Security Audit Report - [Project Name]

## Executive Summary
- **Risk Level:** [Critical/High/Medium/Low]
- **Critical Issues:** [X]
- **High Priority:** [X]
- **Medium Priority:** [X]
- **Low Priority:** [X]

## Critical Vulnerabilities (Fix Immediately)
### 1. [Vulnerability Name] (CRITICAL)
**File:** `path/to/file:line`
**Risk:** [What could go wrong]
**Impact:** [Business impact]
**Fix:** [Specific solution]

## Implementation Timeline
### Week 1 (Critical)
- [ ] Fix authentication bypass
- [ ] Remove hardcoded secrets
- [ ] Add input validation

### Week 2 (High Priority)
- [ ] Implement rate limiting
- [ ] Add security headers
- [ ] Fix error handling

### Month 1 (Medium Priority)
- [ ] Code quality improvements
- [ ] Performance optimization
- [ ] Documentation updates
```

### Step 14: Provide Specific Code Examples
For each vulnerability, include:
- **Before:** The vulnerable code
- **After:** The fixed code
- **Testing:** How to verify the fix

### Step 15: Risk Assessment Matrix
Create a simple risk matrix:

| Vulnerability | Likelihood | Impact | Risk Level | Priority |
|---------------|------------|---------|------------|----------|
| Hardcoded Password | High | High | Critical | 1 |
| No Authentication | High | High | Critical | 2 |
| SQL Injection | Medium | High | High | 3 |

---

## 🎯 Quick Reference: When to Use Which Prompt

### Use "Initial Security Scan" when:
- You're starting any new audit
- You need a comprehensive overview
- You're unsure what to look for

### Use "Authentication System Deep Dive" when:
- You find authentication-related code
- Login/logout functionality exists
- User management is present

### Use "API Security Assessment" when:
- You identify REST/GraphQL endpoints
- Backend API exists
- Server-side routes are present

### Use "React/Frontend Applications" when:
- React, Vue, Angular, or similar frontend
- Client-side authentication
- SPA (Single Page Application)

### Use "Node.js/Express Backend" when:
- Express.js server
- Node.js backend
- JavaScript/TypeScript server

### Use "Database Security Review" when:
- Database integration exists
- ORM usage (Prisma, Drizzle, etc.)
- SQL files or schemas present

### Use "Code Quality Assessment" when:
- Initial security review is complete
- Looking for maintainability issues
- Preparing long-term recommendations

---

## ⚡ Speed Audit Checklist (15-minute version)

When you only have 15 minutes, run this abbreviated audit:

### Critical Security (5 minutes)
- [ ] **Search for hardcoded secrets:** `grep -r "password\|secret\|key" --include="*.js" --include="*.ts"`
- [ ] **Check authentication:** Look for login components and API protection
- [ ] **Scan for obvious vulnerabilities:** SQL injection patterns, XSS risks

### Code Quality (5 minutes)
- [ ] **Check TypeScript usage:** Strict mode, proper typing
- [ ] **Review error handling:** Try/catch blocks, error messages
- [ ] **Identify code smells:** Large functions, duplication

### Business Logic (5 minutes)
- [ ] **Test main workflow:** Can you break the primary user flow?
- [ ] **Check permissions:** Can you access things you shouldn't?
- [ ] **Validate edge cases:** What happens with invalid inputs?

### Report Priority Issues Only
Focus on Critical and High priority findings only.

---

## 🔧 Tools and Commands Reference

### Essential Grep Patterns
```bash
# Security patterns
grep -r "password\|secret\|token\|api.*key" --include="*.js" --include="*.ts" --include="*.tsx" .
grep -r "process\.env\|\.env" --include="*.js" --include="*.ts" .
grep -r "eval\|innerHTML\|dangerouslySetInnerHTML" --include="*.js" --include="*.ts" --include="*.tsx" .

# Authentication patterns
grep -r "login\|auth\|session\|jwt\|token" --include="*.js" --include="*.ts" .
grep -r "localStorage\|sessionStorage" --include="*.js" --include="*.ts" --include="*.tsx" .

# Database patterns
grep -r "SELECT\|INSERT\|UPDATE\|DELETE" --include="*.js" --include="*.ts" .
grep -r "query\|execute\|sql" --include="*.js" --include="*.ts" .

# Error handling
grep -r "try\|catch\|throw\|error" --include="*.js" --include="*.ts" .
```

### File Discovery
```bash
# Find main application files
find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" | grep -E "(app|main|index|server|auth|api)" | head -20

# Find configuration files
find . -name "package.json" -o -name "tsconfig.json" -o -name "*.config.*" -o -name ".env*"

# Find database-related files
find . -name "*schema*" -o -name "*model*" -o -name "*migration*" -o -name "*db*"
```

---

## 🎯 Success Criteria

After completing this workflow, you should have:
- [ ] **Complete vulnerability inventory** with risk levels
- [ ] **Specific fix recommendations** with code examples
- [ ] **Implementation timeline** with priorities
- [ ] **Test cases** to verify fixes
- [ ] **Risk assessment** for business stakeholders

**Remember:** Focus on critical security issues first. A functional app with security holes is more dangerous than a less-functional but secure app.

---

*This workflow guide references prompts from AUDIT_PROMPT_LIBRARY.md - keep both files together for complete audit capability.*