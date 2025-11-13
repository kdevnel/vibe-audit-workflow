const fs = require('fs-extra');
const path = require('path');

/**
 * Apply HTML template with branding and content
 */
function applyTemplate(content, config) {
  // Load base template
  const templatePath = path.join(__dirname, '../templates/base.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  // Load and inject CSS
  const defaultCss = fs.readFileSync(path.join(__dirname, '../templates/styles/default.css'), 'utf8');
  const printCss = fs.readFileSync(path.join(__dirname, '../templates/styles/print.css'), 'utf8');
  const brandingCss = generateBrandingCss(config);

  // Replace placeholders
  template = template
    .replace('{{DEFAULT_CSS}}', defaultCss)
    .replace('{{PRINT_CSS}}', printCss)
    .replace('{{BRANDING_CSS}}', brandingCss)
    .replace('{{TITLE}}', config.cover.title || 'Security Audit Report')
    .replace('{{COMPANY}}', config.branding.company || 'Security Audit')
    .replace('{{CONTENT}}', content)
    .replace('{{COVER_PAGE}}', config.cover.enabled ? generateCoverPage(config) : '');

  return template;
}

/**
 * Generate CSS from branding configuration
 */
function generateBrandingCss(config) {
  const colors = config.branding.colors;
  const fonts = config.branding.fonts;

  return `
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-accent: ${colors.accent};
      --color-danger: ${colors.danger};
      --color-warning: ${colors.warning};
      --color-success: ${colors.success};

      --font-heading: ${fonts.heading};
      --font-body: ${fonts.body};
      --font-code: ${fonts.code};
    }

    body {
      font-family: var(--font-body);
      color: var(--color-secondary);
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
      color: var(--color-primary);
    }

    code, pre {
      font-family: var(--font-code);
    }

    .vulnerability-critical {
      border-left: 4px solid var(--color-danger);
      background-color: rgba(229, 62, 62, 0.05);
      padding: 1rem;
      margin: 1rem 0;
    }

    .vulnerability-high {
      border-left: 4px solid var(--color-warning);
      background-color: rgba(221, 107, 32, 0.05);
      padding: 1rem;
      margin: 1rem 0;
    }

    .vulnerability-medium {
      border-left: 4px solid var(--color-accent);
      background-color: rgba(49, 130, 206, 0.05);
      padding: 1rem;
      margin: 1rem 0;
    }

    .vulnerability-low {
      border-left: 4px solid var(--color-success);
      background-color: rgba(56, 161, 105, 0.05);
      padding: 1rem;
      margin: 1rem 0;
    }
  `;
}

/**
 * Generate cover page HTML
 */
function generateCoverPage(config) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div class="cover-page">
      <div class="cover-content">
        <h1 class="cover-title">${config.cover.title}</h1>
        <p class="cover-subtitle">${config.cover.subtitle}</p>
        <div class="cover-company">${config.branding.company}</div>
        <div class="cover-date">${date}</div>
      </div>
    </div>
    <div class="page-break"></div>
  `;
}

module.exports = {
  applyTemplate
};
