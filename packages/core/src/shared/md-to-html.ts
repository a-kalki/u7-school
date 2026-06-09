import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false,
  breaks: true,
});

// Telegram HTML понимает <b>/<i>, а не <strong>/<em>
md.renderer.rules.em_open = () => '<i>';
md.renderer.rules.em_close = () => '</i>';
md.renderer.rules.strong_open = () => '<b>';
md.renderer.rules.strong_close = () => '</b>';

/**
 * Конвертирует Markdown-разметку в HTML для отправки в Telegram.
 *
 * @example
 * mdToHtml('**bold** и `code`') // '<p><b>bold</b> и <code>code</code></p>\n'
 */
export function mdToHtml(text: string): string {
  return md.render(text);
}
