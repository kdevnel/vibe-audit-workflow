# Code Audit Framework for Non-Developer Built Applications

## Overview
This framework provides a systematic approach to auditing applications built by non-developers, focusing on security vulnerabilities, code quality, architecture issues, and business logic flaws. It's designed to be reusable across different technology stacks and application types.

## Pre-Audit Setup

### 1. Initial Reconnaissance
```bash
# Environment setup
export AUDIT_PROJECT_PATH="/path/to/project"
export AUDIT_DATE=$(date +%Y-%m-%d)
export AUDIT_OUTPUT_DIR="./audit-reports/$AUDIT_DATE"
mkdir -p $AUDIT_OUTPUT_DIR

# Basic project analysis
find $AUDIT_PROJECT_PATH -name "*.json" -o -name "*.md" -o -name "README*" | head -10
find $AUDIT_PROJECT_PATH -name ".env*" -o -name "config*" -o -name "secrets*"
```

### 2. Technology Stack Identification
Create a `tech-stack-analysis.md` file documenting:
- Primary frameworks and languages
- Database technologies
- Authentication mechanisms
- External dependencies
- Deployment environment (Replit, Heroku, etc.)

## Audit Checklist

### CRITICAL SECURITY ISSUES (Priority 1)

#### Authentication & Authorization
- [ ] **Hardcoded Credentials**: Search for passwords, API keys, tokens in source code
- [ ] **Weak Authentication**: Simple passwords, no MFA, weak session management
- [ ] **Client-Side Security**: Sensitive data/logic in frontend code
- [ ] **Authorization Bypass**: Missing access controls, role-based security gaps

**Audit Commands:**
```bash
# Search for hardcoded secrets
grep -r -i "password\|secret\|token\|key\|auth" --include="*.js" --include="*.ts" --include="*.tsx" .
grep -r "const.*=.*['\"][a-zA-Z0-9]{8,}['\"]" --include="*.js" --include="*.ts" --include="*.tsx" .

# Environment variable usage
grep -r "process\.env\|\.env" --include="*.js" --include="*.ts" --include="*.tsx" .
```

#### Input Validation & Injection Prevention
- [ ] **SQL Injection**: Raw queries, unsanitized inputs
- [ ] **XSS Prevention**: Input sanitization, output encoding
- [ ] **CSRF Protection**: Anti-CSRF tokens, same-site cookies
- [ ] **Schema Validation**: Zod/Joi validation on all inputs

**Audit Commands:**
```bash
# Database query patterns
grep -r "SELECT\|INSERT\|UPDATE\|DELETE\|sql\`" --include="*.js" --include="*.ts" .
grep -r "dangerouslySetInnerHTML\|innerHTML\|eval" --include="*.js" --include="*.ts" --include="*.tsx" .
```

#### Data Protection
- [ ] **Sensitive Data Exposure**: Logging secrets, exposing internal data
- [ ] **Data Encryption**: Passwords hashed, sensitive data encrypted
- [ ] **Database Security**: Connection strings, access controls
- [ ] **File Upload Security**: File type validation, size limits

### HIGH PRIORITY ISSUES (Priority 2)

#### Error Handling & Information Disclosure
- [ ] **Error Information Leakage**: Stack traces in production, detailed errors
- [ ] **Logging Security**: No sensitive data in logs, appropriate log levels
- [ ] **Exception Handling**: Proper try/catch blocks, graceful failures

**Audit Commands:**
```bash
# Error handling patterns
grep -r "console\.log\|console\.error\|throw\|catch" --include="*.js" --include="*.ts" --include="*.tsx" .
grep -r "stack\|trace\|debug" --include="*.js" --include="*.ts" --include="*.tsx" .
```

#### API Security
- [ ] **Rate Limiting**: DOS protection, API throttling
- [ ] **CORS Configuration**: Proper origin restrictions
- [ ] **HTTP Security Headers**: HSTS, CSP, X-Frame-Options
- [ ] **API Versioning**: Backward compatibility, deprecation strategy

#### Business Logic Vulnerabilities
- [ ] **Race Conditions**: Concurrent access, atomic operations
- [ ] **Business Rule Enforcement**: Server-side validation, state consistency
- [ ] **Privilege Escalation**: Role boundaries, permission checks

### MEDIUM PRIORITY ISSUES (Priority 3)

#### Code Quality & Maintainability
- [ ] **TypeScript Usage**: Type safety, proper interfaces
- [ ] **Code Duplication**: DRY principle violations
- [ ] **Function Complexity**: Large functions, deep nesting
- [ ] **Documentation**: Code comments, API documentation

#### Architecture & Design
- [ ] **Separation of Concerns**: Business logic separation
- [ ] **Dependency Management**: Outdated packages, security vulnerabilities
- [ ] **Configuration Management**: Environment-specific configs
- [ ] **Database Design**: Normalization, indexing, constraints

#### Performance & Scalability
- [ ] **N+1 Queries**: Database query optimization
- [ ] **Resource Management**: Memory leaks, connection pooling
- [ ] **Caching Strategy**: Data caching, CDN usage
- [ ] **Bundle Size**: Frontend optimization, code splitting

### LOW PRIORITY ISSUES (Priority 4)

#### User Experience & Accessibility
- [ ] **Error Messages**: User-friendly error handling
- [ ] **Loading States**: Proper feedback during operations
- [ ] **Accessibility**: ARIA labels, keyboard navigation
- [ ] **Mobile Responsiveness**: Cross-device compatibility

#### Testing & Quality Assurance
- [ ] **Test Coverage**: Unit tests, integration tests
- [ ] **Linting**: ESLint, Prettier configuration
- [ ] **CI/CD Pipeline**: Automated testing, deployment
- [ ] **Monitoring**: Error tracking, performance monitoring

## Audit Execution Workflow

### Phase 1: Automated Scanning (30 minutes)
1. **Security Scan**: Run automated security tools
2. **Dependency Audit**: Check for vulnerable packages
3. **Code Quality Scan**: Static analysis tools
4. **Configuration Review**: Environment variables, config files

### Phase 2: Manual Code Review (2-4 hours)
1. **Authentication Flow**: Trace login/logout processes
2. **Data Flow Analysis**: Follow data from input to storage
3. **API Endpoint Review**: Check all routes for vulnerabilities
4. **Database Schema Review**: Analyze data model and constraints

### Phase 3: Business Logic Testing (1-2 hours)
1. **Edge Case Testing**: Boundary conditions, error scenarios
2. **Workflow Validation**: End-to-end business processes
3. **Data Integrity**: Consistency checks, validation rules
4. **Permission Testing**: Role-based access verification

### Phase 4: Documentation & Reporting (1 hour)
1. **Vulnerability Classification**: Categorize by severity
2. **Risk Assessment**: Impact analysis and likelihood
3. **Remediation Plan**: Prioritized action items
4. **Code Examples**: Specific fixes and improvements

## Specialized Audit Prompts

### For Authentication Systems
```
Analyze this authentication system for security vulnerabilities:
1. How are passwords stored and validated?
2. What session management is implemented?
3. Are there any authentication bypass vulnerabilities?
4. How is user authorization handled?
5. What happens during login/logout processes?

Focus on: credential storage, session security, authorization checks, password policies.
```

### For Database Interactions
```
Review this data layer for security and integrity issues:
1. How are database queries constructed?
2. What input validation is performed?
3. Are there any SQL injection vulnerabilities?
4. How is sensitive data protected?
5. What database constraints exist?

Focus on: query parameterization, input sanitization, data validation, encryption.
```

### For API Endpoints
```
Audit these API endpoints for security vulnerabilities:
1. What authentication/authorization is required?
2. How is input validated and sanitized?
3. What error information is exposed?
4. Are there rate limiting protections?
5. How are permissions enforced?

Focus on: access controls, input validation, error handling, information disclosure.
```

### For Frontend Security
```
Examine this frontend code for security issues:
1. What sensitive data is exposed in the client?
2. How is user input handled and validated?
3. Are there XSS vulnerabilities?
4. What authentication state management exists?
5. How are API calls secured?

Focus on: client-side secrets, XSS prevention, input validation, authentication state.
```

## Technology-Specific Checklists

### Node.js/Express Applications
- [ ] Helmet.js for security headers
- [ ] Express rate limiting middleware
- [ ] CORS configuration
- [ ] Body parser size limits
- [ ] Cookie security settings
- [ ] Environment variable management

### React/Frontend Applications
- [ ] Component security patterns
- [ ] State management security
- [ ] Client-side routing protection
- [ ] API key management
- [ ] Bundle security analysis
- [ ] CSP configuration

### Database Security (PostgreSQL/MySQL)
- [ ] Connection string security
- [ ] Query parameterization
- [ ] Database user permissions
- [ ] Data encryption at rest
- [ ] Backup security
- [ ] Access logging

## Common Vulnerability Patterns in Non-Developer Code

### 1. Authentication Antipatterns
- Hardcoded passwords in source code
- Simple string comparison for authentication
- No session expiration
- Client-side authentication checks only

### 2. Database Security Issues
- String concatenation in SQL queries
- No input validation
- Overprivileged database users
- Sensitive data in plain text

### 3. Error Handling Problems
- Detailed error messages to users
- Stack traces in production
- Logging sensitive information
- No graceful error recovery

### 4. Input Validation Gaps
- Client-side validation only
- No type checking
- Missing length/format validation
- No sanitization of user input

## Remediation Priority Guidelines

### Critical (Fix Immediately)
- Authentication bypass vulnerabilities
- SQL injection possibilities
- Hardcoded credentials
- Data exposure issues

### High (Fix Within Week)
- Input validation gaps
- Authorization issues
- Error information disclosure
- Missing security headers

### Medium (Fix Within Month)
- Code quality issues
- Performance problems
- Missing documentation
- Dependency updates

### Low (Fix When Convenient)
- UI/UX improvements
- Code organization
- Non-security configuration
- Testing coverage

## Output Template

Create a `audit-report-template.md` with sections for:
1. Executive Summary
2. Critical Vulnerabilities
3. Security Recommendations
4. Code Quality Issues
5. Architecture Improvements
6. Implementation Timeline
7. Code Examples & Fixes

This framework provides a systematic approach to auditing non-developer built applications while being adaptable to different technology stacks and project types.