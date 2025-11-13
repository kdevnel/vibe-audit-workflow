#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { generatePDF } = require('../src/generator');
const path = require('path');

const argv = yargs(hideBin(process.argv))
  .usage('Usage: audit-pdf <input.md> [options]')
  .command('$0 <input>', 'Generate PDF from markdown audit report', (yargs) => {
    yargs.positional('input', {
      describe: 'Input markdown file path',
      type: 'string'
    });
  })
  .option('output', {
    alias: 'o',
    description: 'Output PDF file path',
    type: 'string',
    default: 'audit-report.pdf'
  })
  .option('config', {
    alias: 'c',
    description: 'Branding configuration file',
    type: 'string',
    default: './audit-pdf-config.json'
  })
  .example('$0 audit-reports/final-report.md', 'Generate PDF with default settings')
  .example('$0 report.md -o client-audit.pdf', 'Specify output filename')
  .example('$0 report.md -c custom-config.json', 'Use custom branding')
  .help()
  .argv;

async function main() {
  try {
    const inputPath = path.resolve(argv.input);
    const outputPath = path.resolve(argv.output);
    const configPath = path.resolve(argv.config);

    console.log('🔍 Audit PDF Generator');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Input:  ${inputPath}`);
    console.log(`📋 Config: ${configPath}`);
    console.log(`📑 Output: ${outputPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔄 Generating PDF...');

    await generatePDF(inputPath, {
      output: outputPath,
      config: configPath
    });

    console.log('\n✅ PDF generated successfully!');
    console.log(`📑 Output: ${outputPath}\n`);

  } catch (error) {
    console.error('\n❌ Error generating PDF:', error.message);
    process.exit(1);
  }
}

main();
