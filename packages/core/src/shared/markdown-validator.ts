/**
 * Валидатор MarkdownV2 для Telegram.
 *
 * Проверяет, что текст не содержит неэкранированных зарезервированных символов
 * и все форматирующие символы парные.
 *
 * MarkdownV2 резервирует:
 *   Форматирующие (должны быть парными): * _ ~ `
 *   Парные последовательности:         __ (underline)  || (spoiler)
 *   Никогда не форматирующие:          . ! + - = |
 *
 * Символы [ ] ( ) > # { } экранируются escapeMarkdown,
 * но в боте не используются как форматирование — их валидация не требуется.
 */

/** Символы, которые НИКОГДА не форматируют текст и ВСЕГДА должны быть экранированы */
const NEVER_FORMATTING_RE = /(?<!\\)[.!+\-=|>#{}()\[\]]/g;

export interface MarkdownIssue {
  /** Проблемный символ */
  char: string;
  /** Причина: неэкранированный или непарный */
  reason: 'unescaped' | 'unpaired';
}

export interface MarkdownValidationResult {
  valid: boolean;
  issues: MarkdownIssue[];
}

/**
 * Проверяет MarkdownV2-текст на ошибки экранирования и парности.
 *
 * Проверки:
 * 1. Символы . ! + - = | — должны быть экранированы (никогда не форматируют)
 * 2. Символ * — количество должно быть чётным (парные жирные)
 * 3. Символ _ — после вычета __ (underline) количество должно быть чётным
 * 4. Символ ~ — количество должно быть чётным (парные зачёркивания)
 * 5. Символ ` — количество должно быть чётным (парные код-блоки)
 * 6. Символ | — после вычета || (spoiler) остаток должен быть 0
 */
export function validateMarkdownV2(text: string): MarkdownValidationResult {
  const issues: MarkdownIssue[] = [];

  // ── 1. Никогда не форматирующие: . ! + - = | ──
  for (const match of text.matchAll(NEVER_FORMATTING_RE)) {
    issues.push({
      char: match[0],
      reason: 'unescaped',
    });
  }

  // ── 2. Проверка парности форматирующих ──
  // Заменяем легитимные конструкции на пробелы, чтобы не мешали подсчёту
  let stripped = text;
  stripped = stripped.replace(/\\[_*~`|.!+\-=]/g, '  '); // экранированные
  stripped = stripped.replace(/__/g, '  '); // underline
  stripped = stripped.replace(/\|\|/g, '  '); // spoiler

  const stars = (stripped.match(/\*/g) ?? []).length;
  const underscores = (stripped.match(/_/g) ?? []).length;
  const tildes = (stripped.match(/~/g) ?? []).length;
  const backticks = (stripped.match(/`/g) ?? []).length;

  if (stars % 2 !== 0) {
    issues.push({ char: '*', reason: 'unpaired' });
  }
  if (underscores % 2 !== 0) {
    issues.push({ char: '_', reason: 'unpaired' });
  }
  if (tildes % 2 !== 0) {
    issues.push({ char: '~', reason: 'unpaired' });
  }
  if (backticks % 2 !== 0) {
    issues.push({ char: '`', reason: 'unpaired' });
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Бросает ошибку, если MarkdownV2-текст содержит неэкранированные символы
 * или непарное форматирование. Используется в тестах.
 */
export function assertMarkdownV2Safe(text: string): void {
  const result = validateMarkdownV2(text);
  if (!result.valid) {
    const details = result.issues
      .map(
        (i) =>
          `${i.reason === 'unescaped' ? 'неэкранированный' : 'непарный'} '${i.char}'`,
      )
      .join(', ');
    throw new Error(
      `MarkdownV2 validation failed (${result.issues.length} issue(s)): ${details}\nText: ${text}`,
    );
  }
}
