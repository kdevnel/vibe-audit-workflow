const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const { processMarkdown } = require('./markdown-processor');
const { loadConfig } = require('./config-loader');
const { applyTemplate } = require('./template-engine');

/**
 * Generate PDF from markdown audit report
 * @param {string} inputFile - Path to markdown file
 * @param {object} options - Generation options
 * @param {string} options.output - Output PDF path
 * @param {string} options.config - Config file path
 */
async function generatePDF(inputFile, options = {}) {
  // Validate input file
  if (!await fs.pathExists(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  // Load markdown content
  console.log('📖 Reading markdown file...');
  const markdown = await fs.readFile(inputFile, 'utf8');

  // Load configuration
  console.log('⚙️  Loading configuration...');
  const config = await loadConfig(options.config);

  // Process markdown to HTML
  console.log('🔄 Processing markdown...');
  const content = processMarkdown(markdown, config);

  // Apply HTML template
  console.log('🎨 Applying template...');
  const html = applyTemplate(content, config);

  // Generate PDF with Puppeteer
  console.log('📄 Generating PDF...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    await page.pdf({
      path: options.output,
      format: config.layout.pageSize || 'A4',
      margin: config.layout.margins || {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: generateHeaderTemplate(config),
      footerTemplate: generateFooterTemplate(config)
    });

  } finally {
    await browser.close();
  }
}

/**
 * Generate header template for PDF
 */
function generateHeaderTemplate(config) {
  const logoHtml = config.branding.logo
    ? `<img src="file://${path.resolve(config.branding.logo)}" style="height: 30px; margin-left: 2cm;" />`
    : '';

  return `
    <div style="width: 100%; font-size: 9px; padding: 10px 0; color: #666; border-bottom: 1px solid #ddd;">
      ${logoHtml}
    </div>
  `;
}

/**
 * Generate footer template for PDF
 */
function generateFooterTemplate(config) {
  return `
    <div style="width: 100%; font-size: 9px; padding: 5px 0; color: #666; text-align: center; border-top: 1px solid #ddd;">
      <span style="margin-left: 2cm;">${config.branding.company || 'Security Audit'}</span>
      <span style="float: right; margin-right: 2cm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </span>
    </div>
  `;
}

module.exports = {
  generatePDF
};
