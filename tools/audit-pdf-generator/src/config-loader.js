const fs = require('fs-extra');
const path = require('path');

/**
 * Load configuration from file or use defaults
 */
async function loadConfig(configPath) {
  const defaultConfig = {
    branding: {
      logo: null,
      company: 'Security Audit',
      colors: {
        primary: '#1a365d',
        secondary: '#2d3748',
        accent: '#3182ce',
        danger: '#e53e3e',
        warning: '#dd6b20',
        success: '#38a169'
      },
      fonts: {
        heading: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        code: 'JetBrains Mono, Consolas, Monaco, monospace'
      }
    },
    layout: {
      pageSize: 'A4',
      margins: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      }
    },
    cover: {
      enabled: false,
      title: 'Security Audit Report',
      subtitle: 'Application Security Assessment'
    }
  };

  // Try to load custom config
  if (configPath && await fs.pathExists(configPath)) {
    try {
      const customConfig = await fs.readJson(configPath);
      return mergeConfig(defaultConfig, customConfig);
    } catch (error) {
      console.warn(`⚠️  Failed to load config from ${configPath}, using defaults`);
      console.warn(`   Error: ${error.message}`);
    }
  }

  return defaultConfig;
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(defaults, custom) {
  const merged = { ...defaults };

  for (const key in custom) {
    if (custom[key] && typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
      merged[key] = mergeConfig(merged[key] || {}, custom[key]);
    } else {
      merged[key] = custom[key];
    }
  }

  return merged;
}

module.exports = {
  loadConfig
};
