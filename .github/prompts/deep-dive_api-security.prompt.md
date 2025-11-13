---
agent: Code_Reviewer
name: "Deep-Dive_API-Security"
description: "Use this prompt when initial scans identify API security vulnerabilities requiring detailed investigation."
---
# API Security Deep Dive

Use this prompt when initial scans identify API security vulnerabilities requiring detailed investigation.

---

Perform a comprehensive security audit of all API endpoints. I need detailed analysis of endpoint protection, input validation, authorization controls, error handling, and potential attack vectors.

## API Endpoint Inventory

### 1. Complete Endpoint Mapping

**Enumerate All Endpoints:**

Using `@workspace`, search for and catalog all API routes:

- GET endpoints and their purposes
- POST endpoints and data they accept
- PUT/PATCH endpoints for updates
- DELETE endpoints
- WebSocket endpoints (if any)
- GraphQL endpoints (if any)

**For each endpoint, document:**

- Route path and HTTP method
- Authentication requirement (yes/no/optional)
- Authorization level required (public/user/admin)
- Input parameters expected
- Response format
- Error handling behavior

### 2. Authentication & Authorization Analysis

**Endpoint Protection:**

For EACH endpoint, verify:

- Is authentication required?
- How is authentication verified? (middleware, manual check, none)
- What happens if no auth token provided?
- What happens if invalid auth token provided?
- Can authentication be bypassed?

**Authorization Checks:**

- Does endpoint verify user has permission?
- Can User A access User B's resources?
- Are ownership checks performed?
- Can regular users access admin endpoints?
- Are authorization checks on server-side?

**Test Scenarios:**

```text
1. Access endpoint without authentication token
2. Access with expired/invalid token
3. Access another user's resource
4. Manipulate request parameters to access unauthorized data
5. Try admin endpoints as regular user
```

**Code Review Required:**

Search for authentication/authorization middleware:

```text
Search for: authenticate, authorize, middleware, protect, guard, requireAuth
Locate: Middleware functions, route protection, authorization logic
Verify: Consistent usage, server-side enforcement, proper error handling
```

### 3. Input Validation Security

**Validation Analysis:**

For each endpoint accepting input:

- What validation library is used? (Zod, Joi, class-validator, custom, none)
- Where is validation performed? (client only, server only, both)
- What happens with invalid input?
- Are all inputs validated?
- What about optional vs required fields?

**Validation Checks:**

- Type validation (string, number, boolean, etc.)
- Format validation (email, URL, date, etc.)
- Length limits (min/max characters)
- Value constraints (ranges, enums, patterns)
- File upload restrictions (type, size, content)

**Common Input Validation Gaps:**

```typescript
// VULNERABLE - No validation
app.post('/api/user', (req, res) => {
  const { name, email } = req.body;
  await db.createUser(name, email);
});

// SECURE - Proper validation
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().max(150).optional()
});

app.post('/api/user', (req, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error });
  }
  await db.createUser(result.data);
});
```

**Test Scenarios:**

```text
1. Send malformed JSON
2. Send wrong data types
3. Send extremely long strings (10,000+ chars)
4. Send negative numbers where positive expected
5. Send special characters and SQL metacharacters
6. Send HTML/JavaScript in text fields
7. Omit required fields
8. Send extra unexpected fields
```

### 4. SQL Injection & Database Security

**Query Analysis:**

For each endpoint that interacts with database:

- How are queries constructed?
- Are parameterized queries used?
- Any string concatenation in queries?
- Any raw SQL execution?
- How is user input incorporated into queries?

**SQL Injection Patterns:**

```typescript
// VULNERABLE - String concatenation
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;

// VULNERABLE - Template literals
const query = `SELECT * FROM users WHERE email = '${email}'`;

// SECURE - Parameterized query (Prisma)
const user = await prisma.user.findUnique({
  where: { id: parseInt(req.params.id) }
});

// SECURE - Parameterized query (raw SQL)
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

**Test Payloads:**

```text
1. ' OR '1'='1
2. 1; DROP TABLE users;--
3. ' UNION SELECT * FROM admin_users--
4. admin'--
5. 1' AND (SELECT COUNT(*) FROM users) > 0--
```

### 5. Error Handling & Information Disclosure

**Error Response Analysis:**

For each endpoint, test error scenarios:

- What happens with unexpected errors?
- Are stack traces exposed?
- Do error messages reveal system information?
- What HTTP status codes are used?
- Are errors logged properly?

**Information Disclosure Risks:**

```typescript
// VULNERABLE - Leaks internal information
catch (error) {
  res.status(500).json({ error: error.message, stack: error.stack });
}

// SECURE - Generic error to user, detailed logging
catch (error) {
  logger.error('User creation failed', { error, userId: req.user.id });
  res.status(500).json({ error: 'An error occurred' });
}
```

**Test Scenarios:**

```text
1. Trigger database errors
2. Cause null pointer exceptions
3. Send malformed requests
4. Exceed rate limits
5. Timeout long operations
```

### 6. Rate Limiting & DOS Protection

**Rate Limiting Analysis:**

- Is rate limiting implemented?
- What endpoints are rate limited?
- What are the limits? (requests per minute/hour)
- How are limits enforced? (IP, user, API key)
- What happens when limit exceeded?

**DOS Vulnerability Checks:**

- Can expensive operations be triggered repeatedly?
- Are there limits on request size?
- Are there limits on response size?
- Can recursive/nested operations cause issues?
- Are there timeout protections?

**Recommended Rate Limits:**

```typescript
// Authentication endpoints - strict limits
POST /api/login: 5 requests per 15 minutes per IP
POST /api/register: 3 requests per hour per IP

// Regular API endpoints
GET /api/*: 100 requests per minute per user
POST /api/*: 50 requests per minute per user

// Expensive operations
POST /api/export: 1 request per 5 minutes per user
POST /api/process-large-file: 1 request per hour per user
```

### 7. CORS & Cross-Origin Security

**CORS Configuration:**

- Is CORS enabled?
- What origins are allowed?
- Are credentials allowed?
- What methods are allowed?
- What headers are allowed?

**Security Issues:**

```typescript
// VULNERABLE - Allow all origins
app.use(cors({ origin: '*', credentials: true }));

// SECURE - Specific origins
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 8. Security Headers

**Required Security Headers:**

Check if these headers are set:

```typescript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HTTPS enforcement
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  next();
});
```

## Output Format

For EACH API security vulnerability:

```markdown
## [Endpoint] - [Vulnerability] (PRIORITY)

**Endpoint**: `[METHOD] /api/path`

**Location**: `path/to/file.ts:lines`

**Current Implementation**:
```typescript
// Current vulnerable code
\`\`\`

**Vulnerability**: [What's wrong]

**Attack Example**:
```bash
curl -X POST https://api.example.com/endpoint \
  -H "Content-Type: application/json" \
  -d '{"malicious": "payload"}'
\`\`\`

**Impact**: [What happens if exploited]

**Secure Implementation**:
```typescript
// Fixed code with validation, auth, etc.
\`\`\`

**Testing**:
[How to verify fix works]

**Priority**: [CRITICAL/HIGH/MEDIUM]
**Estimated Fix Time**: [X hours]
```

## Summary Required

After analysis, provide:

1. **Total API vulnerabilities found**
2. **Endpoints without authentication**
3. **Endpoints without input validation**
4. **Endpoints vulnerable to SQL injection**
5. **Overall API security rating**: Strong/Moderate/Weak/Critical
6. **Priority fix order**
7. **Estimated total fix time**

---

**Remember**: Test every endpoint. Provide curl examples for exploits. Include middleware examples for fixes.
