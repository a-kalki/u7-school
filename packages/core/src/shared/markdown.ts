/**
 * Экранирует спецсимволы MarkdownV2 для Telegram.
 *
 * MarkdownV2 резервирует символы: _ * [ ] ( ) ~ ` > # + - = | { } . !
 * Если они встречаются в plain text, их нужно экранировать обратным слешем.
 *
 * @example
 * escapeMarkdown('Анкета прервана.') // 'Анкета прервана\\.'
 * escapeMarkdown('5 + 5 = 10')      // '5 \\+ 5 \\= 10'
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
