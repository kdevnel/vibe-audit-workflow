# Vibe Code Audit Framework

A comprehensive VS Code Copilot-powered framework for systematically auditing applications built by non-developers.

## 🎯 What This Framework Does

This framework transforms code auditing from a manual, ad-hoc process into a guided, systematic workflow powered by GitHub Copilot. It helps you:

- **Identify critical security vulnerabilities** (hardcoded secrets, SQL injection, authentication bypasses)
- **Assess code quality and maintainability** (TypeScript usage, error handling, architecture)
- **Evaluate business logic integrity** (edge cases, race conditions, permission controls)
- **Generate professional audit reports** with prioritized remediation plans

## 👥 Who This Is For

- **Development teams** reviewing code from no-code/low-code developers
- **Security auditors** assessing applications built by business users
- **Technical leads** evaluating handoff projects from contractors
- **Developers** conducting code reviews on unfamiliar codebases

## 🚀 Quick Start

1. **Copy framework files to your target project:**

   ```bash
   cp -r .github /path/to/target-project/
   ```

2. **Open the target project in VS Code**

3. **Start your audit:**
   - Open Copilot Chat
   - Type `@security-auditor` to begin automated security scanning
   - Follow the agent's guidance through the workflow

4. **Generate your report:**
   - Type `@report-generator` to compile findings into a structured audit report

## 📋 Workflow Overview

### Phase 1: Initial Setup & Scan (30 minutes)

Use `@security-auditor` to automatically scan for:

- Hardcoded secrets and credentials
- Authentication vulnerabilities
- Unprotected API endpoints
- Database security issues

### Phase 2: Deep Dive Analysis (2-4 hours)

Use focused prompts from `prompts/deep-dive/` for detailed investigation:

- Authentication system review
- API security assessment
- Database security analysis

### Phase 3: Business Logic Testing (1-2 hours)

Use `prompts/phase3-business-logic.md` to evaluate:

- Workflow integrity
- Edge case handling
- Permission boundaries
- Data consistency

### Phase 4: Report Generation (1 hour)

Use `@report-generator` to create:

- Executive summary with risk assessment
- Prioritized vulnerability list
- Code examples and fixes
- Implementation timeline

### Optional: PDF Generation

Use `@pdf-report-generator` to convert reports to professionally branded PDFs:

- Custom company branding and logo
- Print-optimized formatting
- Professional client deliverables

## 🎨 Key Features

- **Copilot Agents**: Four specialized agents for security, code quality, reporting, and PDF generation
- **Hybrid Prompts**: Comprehensive phase prompts plus targeted sub-prompts
- **Technology Agnostic**: Works with React, Node.js, Python, and more
- **Conversational**: Agents ask clarifying questions only when needed
- **Actionable Reports**: Generate implementation-ready audit reports

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Detailed installation and configuration guide
- **[prompts/](prompts/)** - Ready-to-use audit prompts organized by phase
- **[templates/](templates/)** - Audit report templates
- **[tools/audit-pdf-generator/](tools/audit-pdf-generator/)** - Optional PDF generation tool
- **[archive/](archive/)** - Original framework documentation for reference

## 🔧 Usage Pattern

**Simple workflow:**

1. Use agents first for broad automated analysis
2. Use prompts for detailed investigation of specific findings
3. Use sub-prompts for deep dives into problem areas

**Example:**

```text
1. @security-auditor → finds hardcoded API key in auth.js
2. /Deep-Dive_Auth-Review.md → comprehensive auth analysis
3. @report-generator → compile all findings into audit report
4. @pdf-report-generator → create branded PDF for client delivery
```

## 🎯 Priority Levels

The framework categorizes findings into four priority levels:

- **🚨 CRITICAL** - Fix immediately (within 24 hours): Authentication bypass, SQL injection, exposed secrets
- **⚠️ HIGH** - Fix within 1 week: Input validation gaps, authorization issues, information disclosure
- **📝 MEDIUM** - Fix within 1 month: Code quality issues, performance problems, missing documentation
- **💡 LOW** - Fix when convenient: UI/UX improvements, code organization, non-security configuration

## 🤝 Contributing

This framework is designed to evolve. Feel free to customize agents and prompts for your specific needs.

## 📄 License

MIT License - feel free to adapt this framework for your organization's audit processes.

---

**Need help?** See [SETUP.md](SETUP.md) for detailed configuration and usage instructions.
