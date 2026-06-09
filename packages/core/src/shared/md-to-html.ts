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
 * Telegram не поддерживает <p>, </p>, <ul>, <li>, <h1> и т.д.
 * Из блочных тегов — только <pre>.
 *
 * @example
 * mdToHtml('**bold** и `code`') // '<b>bold</b> и <code>code</code>\n'
 */
export function mdToHtml(text: string): string {
  let html = md.render(text);
  // Telegram не понимает <p> — оставляем только содержимое
  html = html.replace(/<\/?p>/g, '');
  // Списки <ul>/<ol>/<li> — разворачиваем в строки с разделителем
  html = html.replace(/<\/?[ou]l>/g, '');
  html = html.replace(/<li>/g, '• ');
  html = html.replace(/<\/li>/g, '\n');
  // Заголовки <h1>..<h6> — убираем теги, оставляем текст жирным
  html = html.replace(/<h[1-6]>/g, '<b>');
  html = html.replace(/<\/h[1-6]>/g, '</b>\n');
  return html.trim();
}
