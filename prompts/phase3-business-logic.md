# Phase 3: Business Logic Testing

Copy and paste this prompt into Copilot Chat to evaluate business logic, workflows, and edge case handling.

---

I need a comprehensive analysis of the business logic implementation, focusing on workflow integrity, edge case handling, permission boundaries, and data consistency.

## Analysis Framework

### 1. Core Workflow Analysis

Identify and trace the main business workflows:

**Workflow Mapping:**
- What are the primary user workflows? (e.g., user registration → profile setup → data entry → submission)
- Map the complete flow from start to finish
- Identify all state transitions
- Document validation points and business rules

**For each workflow, analyze:**
- **Happy path**: Does the normal flow work correctly?
- **Edge cases**: What happens with boundary values, empty inputs, null values?
- **Error states**: How are errors handled at each step?
- **State management**: Can workflows be interrupted and resumed?
- **Data consistency**: Is data kept consistent throughout the workflow?

### 2. Edge Case & Boundary Condition Testing

Test scenarios that non-developers often miss:

**Input Boundaries:**
- **Empty values**: What happens with empty strings, null, undefined?
- **Extreme values**: Maximum integers, very long strings, large files
- **Special characters**: Unicode, emojis, SQL metacharacters, HTML tags
- **Type mismatches**: Sending strings where numbers expected, etc.
- **Missing required fields**: What if optional fields become required later?

**Temporal Edge Cases:**
- **Race conditions**: Multiple users editing same data simultaneously
- **Timeout scenarios**: Long-running operations, network delays
- **Order of operations**: What if steps happen out of expected order?
- **Stale data**: User has old data cached, server has new data

**State Edge Cases:**
- **Invalid state transitions**: Can users skip required steps?
- **State rollback**: What happens if operation fails mid-transaction?
- **Orphaned records**: Data left in limbo from incomplete operations

**Test each scenario and report:**
- What is the expected behavior?
- What actually happens?
- What error occurs (if any)?
- What are the security/data integrity implications?
- How should it be fixed?

### 3. Permission & Access Control Testing

Verify that authorization works correctly across all scenarios:

**Permission Boundary Testing:**
- **Horizontal privilege escalation**: Can User A access User B's data?
- **Vertical privilege escalation**: Can regular users access admin functions?
- **Resource ownership**: Are ownership checks consistent?
- **Shared resources**: How are multi-user resources protected?

**Test Scenarios:**
- Try to access another user's profile/data
- Attempt to modify data you don't own
- Try to delete resources owned by others
- Access admin endpoints as regular user
- Manipulate IDs in URLs/requests to access other records

**For each test:**
- Describe the attempt
- Show the result (success/failure)
- If successful (vulnerability): explain the impact
- Provide fix recommendation with code

### 4. Data Consistency & Integrity

Verify data remains consistent across operations:

**Transaction Integrity:**
- Are multi-step operations atomic?
- What happens if one step fails?
- Are there partial updates that leave inconsistent state?
- How are database transactions handled?

**Validation Consistency:**
- Is validation the same on client and server?
- Can client-side validation be bypassed?
- Are business rules enforced server-side?
- What happens when validation rules change?

**Referential Integrity:**
- Are foreign key relationships properly maintained?
- What happens when deleting referenced records?
- How are cascading operations handled?
- Are there orphaned records?

**Concurrent Access:**
- What happens with simultaneous updates?
- Are there optimistic/pessimistic locks?
- How are conflicts resolved?
- Can race conditions cause data corruption?

### 5. Integration Point Security

Examine external service integrations:

**Third-Party API Usage:**
- How are external APIs authenticated?
- Where are API keys stored?
- What error handling exists for API failures?
- Are rate limits considered?
- How is user data sent to third parties?

**Webhooks & Callbacks:**
- How are webhooks authenticated?
- Can webhook endpoints be abused?
- What validation occurs on webhook data?
- How are retries handled?

**Email/Communication:**
- How are emails sent?
- Can email content be injected?
- Are email addresses validated?
- How are sensitive links protected?

## Output Format

For each area tested:

```markdown
## [Business Logic Area] Testing Results

### Workflow: [Workflow Name]

#### Test Case 1: [Test Description]

**Scenario**: [What was tested]

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happens]

**Security/Data Impact**: [Implications]

**Priority**: [CRITICAL/HIGH/MEDIUM/LOW]

**Fix Recommendation**:
```language
// Code fix if applicable
\`\`\`

**Testing Steps**: [How to verify the fix]

#### Test Case 2: [Next Test]
[Continue pattern]

### Summary
- Tests performed: [X]
- Vulnerabilities found: [X]
- By priority: Critical [X], High [X], Medium [X], Low [X]
```

## Common Business Logic Vulnerabilities

Focus on these patterns:

**1. Missing Server-Side Validation:**
- Client-side validation can always be bypassed
- Business rules must be enforced server-side
- Price manipulation, quantity limits, etc.

**2. Race Conditions:**
- Double-spending problems
- Concurrent inventory updates
- Multiple account creation
- Simultaneous withdrawal/transfer

**3. State Machine Flaws:**
- Skipping required workflow steps
- Repeating one-time operations
- Accessing features before prerequisites met
- Invalid state transitions

**4. Business Rule Bypasses:**
- Manipulating discount codes
- Bypassing payment requirements
- Circumventing resource limits
- Exploiting referral systems

**5. Insecure Direct Object References (IDOR):**
- Accessing resources by guessing IDs
- Modifying URL parameters to access other users' data
- Sequential ID prediction
- No ownership verification

## Test Scenarios to Execute

### Scenario 1: User Data Access
```
1. Login as User A, note resource ID (e.g., /api/profile/123)
2. Login as User B
3. Try to access User A's resource (/api/profile/123)
4. Document whether access is granted or denied
```

### Scenario 2: Workflow Step Skipping
```
1. Start a multi-step process
2. Note the URL/state for step 3
3. Try to directly access step 3 from step 1
4. Document if validation prevents this
```

### Scenario 3: Concurrent Modification
```
1. Open same resource in two browser tabs
2. Modify in tab 1 and save
3. Modify in tab 2 and save
4. Check which version persists
5. Verify no data loss occurs
```

### Scenario 4: Edge Case Inputs
```
1. Try empty string, null, undefined
2. Try extremely long inputs (10,000 characters)
3. Try special characters: <script>, ' OR '1'='1, etc.
4. Try negative numbers where positive expected
5. Try future dates, past dates, invalid dates
```

## Next Steps

After completing business logic testing:

1. Compile all vulnerability findings
2. Prioritize by business impact
3. Create test cases for regression testing
4. Proceed to Phase 4 for report generation
5. Use `@report-generator` to document all findings

---

**Remember**: Think like an attacker trying to break business rules. Test every assumption. Document every unexpected behavior.
