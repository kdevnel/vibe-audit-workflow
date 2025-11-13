# Archive - Original Framework Documentation

This directory contains the original markdown documentation files from the Vibe Code Audit Framework before it was restructured into the VS Code Copilot-based system.

## Files

### complete-audit-workflow.md
The original comprehensive workflow guide with step-by-step numbered instructions, bash commands, and manual audit process. This was the primary reference document for conducting audits using traditional methods.

### code-audit-framework.md
The foundational framework document outlining the systematic approach to auditing applications built by non-developers. Contains checklists, audit commands, and technology-specific guidance.

### audit-prompt-library.md
A collection of reusable audit prompts for different security areas and technology stacks. These prompts formed the basis for the current Copilot agent and prompt system.

## Why These Are Archived

These files have been superseded by the new VS Code Copilot-integrated system which includes:

- **Workspace Instructions**: `.github/copilot-instructions.md`
- **Custom Agents**: `.github/copilot-agents/*.md`
- **Phase Prompts**: `prompts/phase*.md`
- **Deep-Dive Prompts**: `prompts/deep-dive/*.md`
- **Setup Guide**: `SETUP.md`
- **Report Template**: `templates/audit-report-template.md`

## Reference Value

These files are kept for:

1. **Historical reference**: Understanding the evolution of the framework
2. **Manual audits**: If you need to conduct audits without Copilot
3. **Bash commands**: Useful grep patterns and file discovery commands
4. **Alternative approach**: Command-line based auditing when preferred

## Usage

Feel free to reference these documents if:

- You want to understand the manual audit process
- You need specific bash commands for security scanning
- You're conducting an audit without VS Code/Copilot
- You want to see the original prompt structures

---

**Note**: For current framework usage, see the main [README.md](../README.md) and [SETUP.md](../SETUP.md).
