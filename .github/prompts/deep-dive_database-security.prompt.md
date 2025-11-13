---
agent: Code_Reviewer
name: "Deep-Dive_Database-Security"
description: "Use this prompt when initial scans identify database security vulnerabilities requiring detailed investigation."
---
# Database Security Deep Dive

Use this prompt when initial scans identify database security vulnerabilities requiring detailed investigation.

---

Perform a comprehensive security audit of all database interactions. I need detailed analysis of connection security, query construction, input sanitization, permissions, and data protection.

## Database Security Analysis

### 1. Connection Security

**Database Connection Configuration:**

Search for database connection setup:

```text
Search for: createConnection, connect, DATABASE_URL, connection string, pool
Locate: Database configuration files, connection modules
Verify: Secure connection setup, credential management
```

**Connection Analysis:**

- How is database connection established?
- Where are database credentials stored?
- Are credentials in environment variables or hardcoded?
- Is the connection encrypted (SSL/TLS)?
- Is connection pooling used?
- What are the pool size limits?

**Security Checks:**

```typescript
// VULNERABLE - Hardcoded credentials
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password123',
  database: 'myapp'
});

// SECURE - Environment variables + SSL
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(process.env.DB_SSL_CA),
    rejectUnauthorized: true
  }
});
```

### 2. Query Construction & SQL Injection

**Query Pattern Analysis:**

For EVERY database query in the codebase:

- How is the query constructed?
- Are parameterized queries used?
- Any string concatenation or template literals?
- Any raw SQL execution?
- How is user input incorporated?

**Find All Queries:**

```text
Search for: query, execute, SELECT, INSERT, UPDATE, DELETE, sql, db.
Locate: All database interaction points
Verify: Parameterization, no string concatenation, safe ORM usage
```

**SQL Injection Vulnerabilities:**

```typescript
// VULNERABLE - String concatenation
const users = await db.query(
  "SELECT * FROM users WHERE email = '" + email + "'"
);

// VULNERABLE - Template literals
const user = await db.query(
  `SELECT * FROM users WHERE id = ${userId}`
);

// VULNERABLE - Unsafe ORM usage
const users = await db.query(
  `SELECT * FROM users WHERE role = '${role}'`
);

// SECURE - Parameterized query (PostgreSQL)
const users = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// SECURE - Prisma (type-safe)
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// SECURE - Drizzle (type-safe)
const users = await db.select().from(users).where(eq(users.email, email));
```

**Test SQL Injection Payloads:**

For each query accepting user input, test:

```text
1. ' OR '1'='1
2. admin'--
3. '; DROP TABLE users;--
4. ' UNION SELECT * FROM admin_users--
5. 1' AND (SELECT COUNT(*) FROM sensitive_table) > 0--
6. ' OR 1=1--
7. \\'; EXEC xp_cmdshell('dir'); --
```

**Blind SQL Injection Tests:**

```text
1. ' AND SLEEP(5)--
2. ' AND (SELECT COUNT(*) FROM users) > 0--
3. ' AND SUBSTRING(@@version,1,1) = '5'--
```

### 3. Input Sanitization & Validation

**Input Handling Analysis:**

Before any data reaches the database:

- What input validation occurs?
- What sanitization is performed?
- Are data types validated?
- Are special characters handled?
- What about null/undefined values?

**Sanitization Requirements:**

```typescript
// VULNERABLE - No sanitization
const name = req.body.name;
await db.query('INSERT INTO users (name) VALUES ($1)', [name]);

// SECURE - Validation + sanitization
const userSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  age: z.number().int().positive().max(150)
});

const validated = userSchema.parse(req.body);
await db.query(
  'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)',
  [validated.name, validated.email, validated.age]
);
```

**Special Character Handling:**

Test how these are handled in database operations:

```text
- Single quotes: '
- Double quotes: "
- Backslashes: \\
- Semicolons: ;
- SQL comments: --, /* */
- Null bytes: \\0
- Unicode characters: 你好, 🔥
```

### 4. Database User Permissions

**Permission Audit:**

- What database user does the application use?
- What permissions does this user have?
- Can the application user CREATE/DROP tables?
- Can it access system tables?
- Are there separate users for different operations?

**Recommended Permission Model:**

```sql
-- Application read-only user
CREATE USER app_read WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read;

-- Application write user
CREATE USER app_write WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_write;

-- Migration user (separate, not used by app)
CREATE USER app_migrate WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE myapp TO app_migrate;

-- Application should NOT have:
-- - DROP table permissions
-- - CREATE database permissions
-- - Access to system tables
-- - Superuser privileges
```

**Check Current Permissions:**

```sql
-- PostgreSQL
SELECT * FROM information_schema.role_table_grants
WHERE grantee = 'your_app_user';

-- MySQL
SHOW GRANTS FOR 'your_app_user'@'localhost';
```

### 5. Data Protection & Encryption

**Sensitive Data Analysis:**

Identify what sensitive data is stored:

- Passwords (should be hashed, not encrypted)
- Personal Identifiable Information (PII)
- Payment information
- API keys, tokens, secrets
- Health information
- Financial data

**Encryption at Rest:**

- Is sensitive data encrypted in the database?
- What encryption method is used?
- Where are encryption keys stored?
- Are backups encrypted?

**Data Exposure Risks:**

```typescript
// VULNERABLE - Plain text sensitive data
await db.query(
  'INSERT INTO users (email, password, ssn) VALUES ($1, $2, $3)',
  [email, password, ssn]  // Password not hashed, SSN not encrypted
);

// SECURE - Proper data protection
const hashedPassword = await bcrypt.hash(password, 12);
const encryptedSSN = await encrypt(ssn, process.env.ENCRYPTION_KEY);

await db.query(
  'INSERT INTO users (email, password_hash, ssn_encrypted) VALUES ($1, $2, $3)',
  [email, hashedPassword, encryptedSSN]
);
```

### 6. Database Schema Security

**Schema Analysis:**

Review database schema for security issues:

- Are there proper constraints (NOT NULL, CHECK, UNIQUE)?
- Are foreign keys defined?
- Are indexes on sensitive columns secure?
- What default values are set?
- Are there any backdoor columns (is_admin defaulting to true)?

**Schema Security Issues:**

```sql
-- VULNERABLE - No constraints
CREATE TABLE users (
    id INTEGER,
    email TEXT,
    is_admin TEXT
);

-- SECURE - Proper constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### 7. Migration Safety

**Migration Analysis:**

- How are schema changes managed?
- Are migrations version controlled?
- Can migrations be rolled back?
- Are migrations tested before production?
- Are there any dangerous migrations?

**Dangerous Migration Patterns:**

```typescript
// DANGEROUS - Data loss
await db.query('ALTER TABLE users DROP COLUMN email');

// DANGEROUS - No rollback possible
await db.query('TRUNCATE TABLE users');

// SAFER - Add column with default
await db.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL');

// SAFER - Backup before destructive operation
await db.query('CREATE TABLE users_backup AS SELECT * FROM users');
await db.query('DROP TABLE users');
```

### 8. Logging & Monitoring

**Database Operation Logging:**

- Are database queries logged?
- Are sensitive values logged?
- Are failed queries logged?
- Is there anomaly detection?

**Logging Issues:**

```typescript
// VULNERABLE - Logging sensitive data
logger.info('User login', { email, password });

// SECURE - Log without sensitive data
logger.info('User login attempt', {
  email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
  success: true
});
```

### 9. ORM-Specific Security

**Prisma Security:**

```typescript
// Check for raw queries
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;  // Vulnerable if userId not validated

// Secure Prisma usage
await prisma.user.findUnique({ where: { id: userId } });
```

**Drizzle Security:**

```typescript
// Check for SQL template usage
db.execute(sql`SELECT * FROM users WHERE email = '${email}'`);  // Vulnerable

// Secure Drizzle usage
db.select().from(users).where(eq(users.email, email));
```

**TypeORM Security:**

```typescript
// Vulnerable - String interpolation
userRepository.query(`SELECT * FROM users WHERE id = ${id}`);

// Secure - Parameterized
userRepository.query('SELECT * FROM users WHERE id = $1', [id]);
```

## Output Format

For EACH database security vulnerability:

```markdown
## [Vulnerability Name] (PRIORITY)

**Location**: `path/to/file.ts:lines`

**Query Type**: [SELECT/INSERT/UPDATE/DELETE/Schema]

**Vulnerable Code**:
```typescript
// Current vulnerable implementation
\`\`\`

**Vulnerability**: [SQL injection/Permission issue/Data exposure/etc.]

**Attack Example**:
```text
Input: ' OR '1'='1'--
Resulting query: SELECT * FROM users WHERE email = '' OR '1'='1'--'
Effect: Returns all users
\`\`\`

**Impact**: [Data breach/Unauthorized access/Data corruption/etc.]

**Secure Implementation**:
```typescript
// Fixed code with parameterization
\`\`\`

**Testing**:
```text
Test with malicious inputs to verify injection blocked
\`\`\`

**Priority**: [CRITICAL/HIGH/MEDIUM]
**Estimated Fix Time**: [X hours]
```

## Summary Required

After analysis, provide:

1. **Total database vulnerabilities found**
2. **SQL injection vulnerabilities count**
3. **Queries using string concatenation**
4. **Permission issues identified**
5. **Sensitive data exposure risks**
6. **Overall database security rating**: Strong/Moderate/Weak/Critical
7. **Priority fix order**
8. **Estimated total fix time**

---

**Remember**: Test every database query. Provide SQL injection examples. Include both vulnerable and secure implementations for all findings.
