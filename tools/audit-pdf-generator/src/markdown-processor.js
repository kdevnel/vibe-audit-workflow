const { marked } = require('marked');
const hljs = require('highlight.js');

/**
 * Process markdown to HTML with enhanced formatting
 */
function processMarkdown(markdown, config) {
  // Configure marked renderer
  const renderer = new marked.Renderer();

  // Enhanced code blocks with syntax highlighting
  renderer.code = (code, language) => {
    if (language && hljs.getLanguage(language)) {
      try {
        const highlighted = hljs.highlight(code, { language }).value;
        return `<pre class="code-block"><code class="hljs language-${language}">${highlighted}</code></pre>`;
      } catch (err) {
        console.warn(`Highlighting failed for language: ${language}`);
      }
    }
    const escaped = code.replace(/[&<>"']/g, (char) => {
      const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return entities[char];
    });
    return `<pre class="code-block"><code>${escaped}</code></pre>`;
  };

  // Priority-based styling for headings
  renderer.heading = (text, level) => {
    // Detect priority levels in headings
    const priorityMatch = text.match(/\((CRITICAL|HIGH|MEDIUM|LOW)\)/i);
    const priority = priorityMatch ? priorityMatch[1].toLowerCase() : '';
    const cleanText = text.replace(/\s*\([^)]+\)$/, '');

    // Add priority class if detected
    const priorityClass = priority ? `vulnerability-${priority}` : '';
    const id = cleanText.toLowerCase().replace(/[^\w]+/g, '-');

    return `<h${level} id="${id}" class="heading-${level} ${priorityClass}">${cleanText}</h${level}>`;
  };

  // Enhanced tables
  renderer.table = (header, body) => {
    return `<div class="table-container">
      <table class="audit-table">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
  };

  // Priority emoji indicators
  renderer.text = (text) => {
    return text
      .replace(/🚨/g, '<span class="priority-icon critical">🚨</span>')
      .replace(/⚠️/g, '<span class="priority-icon high">⚠️</span>')
      .replace(/📝/g, '<span class="priority-icon medium">📝</span>')
      .replace(/💡/g, '<span class="priority-icon low">💡</span>');
  };

  // Page break hints
  renderer.hr = () => {
    return '<div class="page-break"></div>';
  };

  // Configure marked options
  marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: true
  });

  // Process markdown to HTML
  return marked(markdown);
}

module.exports = {
  processMarkdown
};
