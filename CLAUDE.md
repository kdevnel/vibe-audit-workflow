# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **documentation-only repository** — no build system, no runtime, no dependencies. It contains a reusable framework and prompt library for auditing applications built by non-developers ("vibe-coded" apps).

There are no build, lint, or test commands to run.

## File Architecture

The core docs form a layered system:

| File | Role |
|------|------|
| `README.md` | Entry point; quick-start guide and index |
| `code-audit-framework.md` | Foundation: checklists, vulnerability patterns, technology-specific guidance |
| `audit-prompt-library.md` | Copy-paste prompt library organized by audit type and technology |
| `complete-audit-workflow.md` | Execution guide: four-phase workflow with time estimates and success criteria |

**Dependency direction**: `README` → `complete-audit-workflow` → `code-audit-framework` + `audit-prompt-library`. The framework and prompt library are referenced by the workflow but designed to be used independently.

The `templates/` directory holds the shared data contract for the skill-based workflow:

| File | Role |
|------|------|
| `templates/audit-schema.md` | The contract: defines both file formats, finding IDs, severity levels, OWASP mapping, and status values. Read this before writing any skill. |
| `templates/audit-context-template.md` | Filled in by `/audit-setup` at the start of each run; all subsequent skills read it to know the stack and key file paths. |
| `templates/audit-findings-template.md` | Created per audit run; each skill appends its findings section; `/audit-report` reads the complete file to generate the final report. |

## Content Conventions

- Checklists use `[ ]` checkboxes — these are intentionally left unchecked as templates.
- Severity levels follow a four-tier scale: **Critical → High → Medium → Low**.
- Time estimates in `complete-audit-workflow.md` are guidelines, not hard limits (Full audit: ~4–7 hours; Speed audit: 15 minutes).
- Prompts in `audit-prompt-library.md` are written to be used verbatim with Claude or another LLM — keep them self-contained and copy-paste friendly.

## Skill Files

Audit skills live in `.claude/skills/`. Each skill is a markdown instruction file that Claude Code executes when invoked with `/skill-name`.

| Skill | File | Status |
|-------|------|--------|
| `/audit-setup` | `.claude/skills/audit-setup.md` | ✓ built |
| `/audit-secrets` | `.claude/skills/audit-secrets.md` | ✓ built |
| `/audit-auth` | `.claude/skills/audit-auth.md` | ✓ built |
| `/audit-api` | `.claude/skills/audit-api.md` | ✓ built |
| `/audit-database` | `.claude/skills/audit-database.md` | ✓ built |
| `/audit-frontend` | `.claude/skills/audit-frontend.md` | ✓ built |
| `/audit-dependencies` | `.claude/skills/audit-dependencies.md` | ✓ built |
| `/audit-business-logic` | `.claude/skills/audit-business-logic.md` | ✓ built |
| `/audit-report` | `.claude/skills/audit-report.md` | ✓ built |
| `/audit` | `.claude/skills/audit.md` | ✓ built |

Every skill reads `templates/audit-schema.md` as its contract. `/audit-setup` produces the two files (`audit-context.md`, `audit-findings.md`) that all other skills depend on.

## Editing Guidelines

When updating these docs:
- New vulnerability patterns belong in `code-audit-framework.md` under the appropriate severity tier and technology section.
- New reusable prompts belong in `audit-prompt-library.md` under the closest existing category.
- Workflow changes (phases, timing, process steps) belong in `complete-audit-workflow.md`.
- Keep `README.md` as a concise index — deep content lives in the other files.
