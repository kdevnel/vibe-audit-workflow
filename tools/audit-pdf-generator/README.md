# Audit PDF Generator

Convert markdown audit reports to professionally branded PDFs.

## Installation

### Option 1: Per-Project Installation (Recommended)

In your target project:

```bash
# Copy the tool directory
cp -r /path/to/vibe-audit-workflow/tools/audit-pdf-generator ./tools/

# Install dependencies
cd tools/audit-pdf-generator
npm install
```

### Option 2: Global Installation

```bash
# Install globally
cd /path/to/audit-pdf-generator
npm install -g
```

## Quick Start

### 1. Generate PDF from Markdown Report

```bash
# From project root (if installed per-project)
node tools/audit-pdf-generator/bin/generate-pdf.js audit-reports/final-report.md

# Or if installed globally
audit-pdf audit-reports/final-report.md
```

### 2. Customize Branding

Create `audit-pdf-config.json` in your project root:

```json
{
  "branding": {
    "logo": "./assets/company-logo.png",
    "company": "Your Security Firm",
    "colors": {
      "primary": "#1a365d",
      "secondary": "#2d3748",
      "accent": "#3182ce",
      "danger": "#e53e3e",
      "warning": "#dd6b20",
      "success": "#38a169"
    },
    "fonts": {
      "heading": "Inter, sans-serif",
      "body": "Inter, -apple-system, sans-serif",
      "code": "JetBrains Mono, Consolas, monospace"
    }
  },
  "layout": {
    "pageSize": "A4",
    "margins": {
      "top": "2cm",
      "right": "2cm",
      "bottom": "2cm",
      "left": "2cm"
    }
  },
  "cover": {
    "enabled": true,
    "title": "Security Audit Report",
    "subtitle": "Application Security Assessment"
  }
}
```

### 3. Generate with Custom Branding

```bash
node tools/audit-pdf-generator/bin/generate-pdf.js \
  audit-reports/final-report.md \
  -o client-deliverable.pdf \
  -c audit-pdf-config.json
```

## CLI Options

```bash
audit-pdf <input.md> [options]

Options:
  -o, --output    Output PDF file path [default: "audit-report.pdf"]
  -c, --config    Branding configuration file [default: "./audit-pdf-config.json"]
  --help         Show help
```

## Configuration Options

### Branding

- **logo**: Path to your company logo (PNG, JPG, SVG)
- **company**: Your company/firm name
- **colors**: Color scheme for priority levels and styling
- **fonts**: Font families for headings, body text, and code

### Layout

- **pageSize**: Page size (A4, Letter, Legal)
- **margins**: Page margins (top, right, bottom, left)

### Cover Page

- **enabled**: Whether to include a cover page
- **title**: Main title on cover
- **subtitle**: Subtitle on cover

## Usage with Copilot Agent

Use the `@pdf-report-generator` agent in VS Code Copilot Chat:

1. Generate your markdown audit report using `@report-generator`
2. Save the report to a file (e.g., `audit-reports/2025-11-13-final-report.md`)
3. Type `@pdf-report-generator` and provide the report file path
4. The agent will guide you through PDF generation

## Examples

### Basic PDF Generation

```bash
audit-pdf audit-reports/security-audit.md
```

### Custom Output Location

```bash
audit-pdf audit-reports/security-audit.md -o reports/client-deliverable.pdf
```

### With Custom Branding

```bash
audit-pdf audit-reports/security-audit.md -c custom-branding.json -o branded-report.pdf
```

## Troubleshooting

### Puppeteer Installation Issues

If Puppeteer fails to install:

```bash
# Skip Chromium download during install
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Then install Chromium manually
npx puppeteer browsers install chrome
```

### Font Issues

If custom fonts don't display correctly, ensure they're installed on your system or use web-safe fonts.

### Large File Sizes

To reduce PDF size:

- Compress images before including in markdown
- Use web-optimized logo formats (SVG or compressed PNG)
- Avoid embedding large code blocks

## Requirements

- Node.js 18.x or higher
- 500MB free disk space (for Puppeteer Chromium)

## License

MIT
