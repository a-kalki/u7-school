import { describe, expect, test } from 'bun:test';
import { convertToMarkdown } from './markdown-converter';

describe('MarkdownConverter', () => {
  test('should convert simple HTML to Markdown', () => {
    const html = '<h1>Title</h1><p>Hello World</p>';
    const md = convertToMarkdown(html);
    expect(md).toContain('# Title');
    expect(md).toContain('Hello World');
  });

  test('should handle w3-example blocks', () => {
    const html = `
      <div class="w3-example">
        <pre class="w3-code">const x = 10;</pre>
      </div>
    `;
    const md = convertToMarkdown(html);
    expect(md).toContain('```javascript');
    expect(md).toContain('const x = 10;');
  });

  test('should remove unwanted elements', () => {
    const html = `
      <div id="main">
        <h1>Lesson</h1>
        <div class="nextprev">Previous Next</div>
        <p>Keep this</p>
        <script>alert(1)</script>
      </div>
    `;
    const md = convertToMarkdown(html);
    expect(md).not.toContain('Previous Next');
    expect(md).not.toContain('alert(1)');
    expect(md).toContain('Keep this');
  });
});
