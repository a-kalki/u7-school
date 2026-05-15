import type * as v from 'valibot';

/**
 * Форматирует массив ошибок валидации Valibot в читаемый многострочный текст.
 * Используется в слое auto-ui для вывода в консоль.
 *
 * Для каждого issue выводится:
 * - Путь к полю (через точку)
 * - Ожидаемый тип/формат
 * - Фактически полученное значение
 * - Допустимые значения для перечислений (picklist)
 */
export function formatValibotErrors(
  issues: ReadonlyArray<v.BaseIssue<unknown>>,
): string {
  if (issues.length === 0) {
    return 'Ошибка валидации (нет деталей)';
  }

  // Собираем все «листовые» ошибки (рекурсивно раскрываем вложенные issues)
  const flat = flattenIssues(issues);

  const lines: string[] = ['Ошибки валидации:'];

  for (const issue of flat) {
    const path = formatPath(issue.path);
    const fieldLabel = path ? `Поле "${path}"` : 'Неизвестное поле';

    const expected = issue.expected ?? '—';
    const received = issue.received || '—';

    let line = `- ${fieldLabel}: ожидался ${expected}, получен ${received}`;

    // Добавляем фактическое значение, если оно отличается от received
    if (issue.input !== undefined && String(issue.input) !== received) {
      line += ` (значение: ${formatInput(issue.input)})`;
    }

    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Рекурсивно извлекает все «листовые» issues из вложенной структуры.
 * Valibot для object-схем помещает ошибки полей в `issues` родительского issue.
 */
function flattenIssues(
  issues: ReadonlyArray<v.BaseIssue<unknown>>,
): v.BaseIssue<unknown>[] {
  const result: v.BaseIssue<unknown>[] = [];

  for (const issue of issues) {
    if (issue.issues && issue.issues.length > 0) {
      result.push(...flattenIssues(issue.issues));
    } else {
      result.push(issue);
    }
  }

  return result;
}

/**
 * Форматирует путь Valibot в читаемую строку (через точку).
 * Например, [{ type: "object", key: "profile" }, { type: "object", key: "email" }] → "profile.email"
 */
function formatPath(path: ReadonlyArray<v.IssuePathItem> | undefined): string {
  if (!path || path.length === 0) return '';

  const parts: string[] = [];
  for (const item of path) {
    if (item.type === 'object' && 'key' in item) {
      parts.push(String(item.key));
    } else if (item.type === 'array' && 'key' in item) {
      parts.push(String(item.key));
    }
  }

  return parts.join('.');
}

/**
 * Форматирует значение для вывода в консоль.
 */
function formatInput(input: unknown): string {
  if (typeof input === 'string') return `"${input}"`;
  if (input === null) return 'null';
  if (input === undefined) return 'undefined';
  return String(input);
}
