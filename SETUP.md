# Setup Guide

Complete installation and configuration guide for the Vibe Code Audit Framework.

## Installation

### Step 1: Copy Framework Files

Copy the audit framework files into the root of your target project:

```bash
# Navigate to your target project
cd /path/to/your-project

# Copy framework files (adjust path to where you cloned vibe-audit-workflow)
cp -r /path/to/vibe-audit-workflow/.github .
```

Your project structure should now include:

```text
your-project/
├── .github/
│   ├── copilot-instructions.md
│   ├── agents/
│   │   ├── security-auditor.agent.md
│   │   ├── code-reviewer.agent.md
│   │   └── report-generator.agent.md
│   ├── prompts/
│   │   ├── phase1-initial-scan.prompt.md
│   │   ├── phase2-deep-dive.prompt.md
│   │   ├── phase3-business-logic.prompt.md
│   │   ├── phase4-reporting.prompt.md
│   │   ├── deep-dive_auth-review.prompt.md
│   │   ├── deep-dive_api-security.prompt.md
│   │   └── deep-dive_database-security.prompt.md
│   └── templates/
│       └── audit-report-template.md
└── [your project files...]
```

### Step 2: Optional - Add to .gitignore

If you don't want audit framework files in your project's git history:

```bash
# Add these lines to your .gitignore
echo "/.github/copilot-instructions.md" >> .gitignore
echo "/.github/agents/" >> .gitignore
echo ".github/prompts/" >> .gitignore
echo ".github/templates/audit-report-template.md" >> .gitignore
echo "/audit-reports/" >> .gitignore
```

**Note**: Only do this if you'll copy the framework each time you audit. Otherwise, keep them tracked.

### Step 3: VS Code Configuration

Ensure GitHub Copilot is properly configured in VS Code.

#### Verify Copilot Extension

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X / Ctrl+Shift+X)
3. Verify "GitHub Copilot" and "GitHub Copilot Chat" are installed and enabled

#### Configure Settings (Optional but Recommended)

Add these settings to your `.vscode/settings.json` or merge with existing:

```json
{
  "github.copilot.enable": {
    "*": true
  },
  "github.copilot.editor.enableAutoCompletions": true,
  "github.copilot.chat.scopeSelection": true
}
```

If your project already has `.vscode/settings.json`, merge these settings manually:

```bash
# Create .vscode directory if it doesn't exist
mkdir -p .vscode

# If settings.json exists, edit it manually
# If not, create it:
cat > .vscode/settings.json << 'EOF'
{
  "github.copilot.enable": {
    "*": true
  }
}
EOF
```

### Step 4: Verify Agent Availability

1. Open your project in VS Code
2. Open Copilot Chat (Cmd+Shift+I / Ctrl+Shift+I)
3. Type `@` and verify you see:
   - `@security-auditor`
   - `@code-reviewer`
   - `@report-generator`
   - `@pdf-report-generator`

If agents don't appear, try:

- Reload VS Code window (Cmd+Shift+P → "Reload Window")
- Restart VS Code completely
- Verify `.github/agents/` folder exists with all agent files

## Usage Patterns

### Simple Workflow

**Use this workflow for most audits:**

1. **Start with agents** for automated broad analysis
2. **Use prompts** for detailed investigation of findings
3. **Use sub-prompts** for deep dives into specific areas

### Pattern 1: Agent-First Approach (Recommended)

```text
1. @security-auditor
   → Identifies critical vulnerabilities automatically

2. Review findings and note problem areas

3. Copy/paste relevant prompts for deep dives:
   - prompts/deep-dive/auth-review.md (if auth issues found)
   - prompts/deep-dive/api-security.md (if API issues found)
   - prompts/deep-dive/database-security.md (if DB issues found)

4. @report-generator
   → Compiles all findings into structured report
```

### Pattern 2: Prompt-Based Workflow

```text
1. /phase1-initial-scan
   → Manual control over initial scan

2. /phase2-deep-dive
   → Comprehensive analysis of key areas

3. /phase3-business-logic
   → Test workflows and edge cases

4. /prompts/phase4-reporting
   → Generate final report
```

### Pattern 3: Hybrid Approach

```text
1. @security-auditor
   → Quick automated scan

2. @code-reviewer
   → Code quality assessment

3. Run specific deep-dive prompts for critical areas

4. /phase3-business-logic for workflow testing

4. @report-generator
   → Final comprehensive report

5. @pdf-report-generator (optional)
   → Convert report to branded PDF
```

## Example Workflow

Here's a complete audit from start to finish:

### Hour 1: Initial Scan (30 minutes)

```text
1. Open Copilot Chat
2. Type: @security-auditor
3. Wait for analysis to complete
4. Review findings - note critical issues
```

**Expected output:** List of vulnerabilities by priority, file locations, attack scenarios

### Hour 1-3: Deep Dive (2 hours)

Based on findings, use deep-dive prompts:

```text
If authentication issues found:
1. Open .github/prompts/deep-dive_auth-review.md
2. Copy entire content
3. Paste into Copilot Chat
4. Review detailed authentication analysis

If API vulnerabilities found:
1. Open .github/prompts/deep-dive_api-security.md
2. Copy entire content
3. Paste into Copilot Chat
4. Review detailed API security analysis

If database issues found:
1. Open .github/prompts/deep-dive_database-security.md
2. Copy entire content
3. Paste into Copilot Chat
4. Review detailed database security analysis
```

### Hour 3-4: Business Logic (1 hour)

```text
1. Open .github/prompts/phase3-business-logic.md
2. Copy entire content
3. Paste into Copilot Chat
4. Review workflow integrity findings
```

### Hour 4: Report Generation (30 minutes)

```text
1. Type: @report-generator
2. Wait for comprehensive report
3. Review report structure
4. Request clarifications if needed
5. Save report to /audit-reports/ directory
```

### Optional: PDF Generation

```text
1. Type: @pdf-report-generator
2. Provide path to markdown report
3. Optionally configure branding
4. Generate professional PDF deliverable
```

### Hour 4-5: Fixes (ongoing)

```text
1. Review critical findings
2. Implement fixes from report
3. Test fixes
4. Re-run security scan to verify
```

## Tips & Best Practices

### For Best Results

1. **Be specific**: When asking follow-up questions, reference exact file paths
2. **One at a time**: Focus on one security area before moving to the next
3. **Save context**: Keep Copilot Chat history - it's used by `@report-generator`
4. **Document**: Copy important findings to files as you work
5. **Verify**: Test exploits to confirm vulnerabilities before reporting

### When to Use Agents vs Prompts

**Use Agents when:**

- You want automated, comprehensive analysis
- You're starting a new audit
- You need a quick overview
- You want Copilot to take initiative

**Use Prompts when:**

- You need specific focus on one area
- You want more control over the process
- You're following up on agent findings
- You need structured, thorough analysis

**Use Sub-Prompts when:**

- Agents found issues in specific areas
- You need expert-level deep dive
- You're investigating a specific vulnerability
- You need attack scenarios and fixes

### Common Issues

**Agents not appearing:**

- Verify `.github/agents/` folder exists
- Check agent files have `.agent.md` extension
- Reload VS Code window
- Restart VS Code

**Copilot doesn't follow instructions:**

- Check `.github/copilot-instructions.md` exists
- Verify you're in the correct project folder
- Reload window to re-read instructions

**Analysis is too generic:**

- Provide more context in your prompts
- Reference specific files or areas
- Use deep-dive prompts for detailed analysis
- Break down large requests into smaller ones

## Output Organization

### Create Audit Reports Directory

```bash
mkdir -p audit-reports
```

### Naming Convention

```bash
audit-reports/
├── 2025-11-12-initial-scan.md
├── 2025-11-12-authentication-analysis.md
├── 2025-11-12-api-security.md
├── 2025-11-12-final-report.md
├── 2025-11-12-final-report.pdf    # PDF version
└── 2025-11-12-fix-verification.md
```

### Save Findings

As you work through the audit:

1. Copy important findings from Copilot Chat
2. Save to `audit-reports/` with descriptive names
3. Use dates for easy tracking
4. Keep final report separate

## PDF Report Generation (Optional)

The framework includes an optional PDF generation tool for creating professionally branded audit reports.

### Installation (PDF generator)

```bash
# Copy PDF generator to your project
cp -r /path/to/vibe-audit-workflow/tools/audit-pdf-generator ./tools/

# Install dependencies
cd tools/audit-pdf-generator
npm install
```

### Basic Usage

```bash
# Generate PDF from markdown report
node tools/audit-pdf-generator/bin/generate-pdf.js \
  audit-reports/2025-11-13-final-report.md \
  -o audit-reports/2025-11-13-final-report.pdf
```

### Custom Branding

Create `audit-pdf-config.json` in your project root:

```json
{
  "branding": {
    "logo": "./assets/company-logo.png",
    "company": "Your Security Firm",
    "colors": {
      "primary": "#1a365d",
      "danger": "#e53e3e",
      "warning": "#dd6b20"
    }
  },
  "cover": {
    "enabled": true,
    "title": "Security Audit Report",
    "subtitle": "Client Name - November 2025"
  }
}
```

Then generate with branding:

```bash
node tools/audit-pdf-generator/bin/generate-pdf.js \
  audit-reports/final-report.md \
  -o deliverables/ClientAudit-Nov2025.pdf \
  -c audit-pdf-config.json
```

### Using the PDF Agent

For guided PDF generation:

1. Open Copilot Chat
2. Type: `@pdf-report-generator`
3. Follow the prompts to generate your PDF

The agent will:

- Help locate your markdown report
- Check if the PDF tool is installed
- Guide you through branding configuration
- Provide the exact command to generate your PDF

### PDF Generation Tips

- **Logo format**: PNG, JPG, or SVG (max 200px wide recommended)
- **Report optimization**: Use horizontal rules (`---`) for page breaks
- **Code blocks**: Specify language for syntax highlighting
- **Tables**: Keep tables reasonably sized for page width
- **File size**: Compress images before including in reports

See `tools/audit-pdf-generator/README.md` for detailed documentation.

## Next Steps

1. Verify installation is complete
2. Review the [README.md](../README.md) for framework overview
3. Start your first audit with `@security-auditor`
4. Review the phase prompts in `.github/prompts/` directory
5. Generate your first report with `@report-generator`
6. (Optional) Set up PDF generation for client deliverables

## Support

If you encounter issues:

1. Check this SETUP guide
2. Review agent files in `.github/agents/`
3. Verify Copilot subscription is active
4. Check VS Code output panel for errors

## Customization

Feel free to customize:

- **Agents**: Edit `.github/agents/*.agent.md` for your specific needs
- **Prompts**: Modify `.github/prompts/*.prompt.md` for your tech stack
- **Instructions**: Update `.github/copilot-instructions.md` for your workflow
- **Templates**: Adjust `.github/templates/audit-report-template.md` for your format

---

**Ready to start?** Run `Security-Auditor` in Copilot Chat with the promp `Run security audit` to begin your first audit!
