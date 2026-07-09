import * as v from 'valibot';

/** Valibot-схема для ContentPath.
 *
 * Value Object адресации контента курса.
 * Формат: moduleIndex:projectIndex:lessonIndex:stepIndex (1-based).
 * Partial-формы: A, A:B, A:B:C, A:B:C:D, A:B:C:all.
 * Явная форма: mA:pB:lC:sD (алиасы короткой формы).
 */
export const ContentPathSchema = v.object({
  moduleIndex: v.pipe(
    v.number(),
    v.integer('moduleIndex должен быть целым числом'),
    v.minValue(1, 'moduleIndex должен быть положительным (1-based)'),
  ),
  projectIndex: v.optional(
    v.pipe(
      v.number(),
      v.integer('projectIndex должен быть целым числом'),
      v.minValue(1, 'projectIndex должен быть положительным (1-based)'),
    ),
  ),
  lessonIndex: v.optional(
    v.pipe(
      v.number(),
      v.integer('lessonIndex должен быть целым числом'),
      v.minValue(1, 'lessonIndex должен быть положительным (1-based)'),
    ),
  ),
  stepIndex: v.optional(
    v.union([
      v.pipe(
        v.number(),
        v.integer('stepIndex должен быть целым числом'),
        v.minValue(1, 'stepIndex должен быть положительным (1-based)'),
      ),
      v.literal('all'),
    ]),
  ),
});

/** Тип ContentPath, выведенный из ContentPathSchema — единый источник истины. */
export type ContentPath = v.InferOutput<typeof ContentPathSchema>;

/** Регулярные выражения для парсинга явной формы (mA:pB:lC:sD) */
const EXPLICIT_RE = /^m(-?\d+)(?::p(-?\d+))?(?::l(-?\d+))?(?::s(-?\d+|all))?$/;

/** Регулярное выражение для парсинга короткой формы (A:B:C:D) */
const SHORT_RE =
  /^(-?\d{1,6})(?::(-?\d{1,6}))?(?::(-?\d{1,6}))?(?::(-?\d{1,6}|all))?$/;

/**
 * Парсит строку в ContentPath.
 * Поддерживает короткую форму (A:B:C:D) и явную (mA:pB:lC:sD).
 *
 * @param str — входная строка
 * @returns ContentPath
 * @throws {Error} если формат некорректен или индексы невалидны
 */
export function parse(str: string): ContentPath {
  const trimmed = str.trim();
  if (!trimmed) {
    throw new Error('Некорректный формат ContentPath: пустая строка');
  }

  // Попробовать явную форму (mA:pB:lC:sD)
  const explicitMatch = trimmed.match(EXPLICIT_RE);
  if (explicitMatch) {
    return extractParts(
      explicitMatch[1],
      explicitMatch[2],
      explicitMatch[3],
      explicitMatch[4],
    );
  }

  // Попробовать короткую форму (A:B:C:D)
  const shortMatch = trimmed.match(SHORT_RE);
  if (shortMatch) {
    return extractParts(
      shortMatch[1],
      shortMatch[2],
      shortMatch[3],
      shortMatch[4],
    );
  }

  throw new Error(
    `Некорректный формат ContentPath: "${trimmed}". Ожидается A:B:C:D или mA:pB:lC:sD`,
  );
}

/** Извлекает части из захваченных групп регулярного выражения */
function extractParts(
  moduleStr: string | undefined,
  projectStr: string | undefined,
  lessonStr: string | undefined,
  stepStr: string | undefined,
): ContentPath {
  if (!moduleStr) {
    throw new Error('Некорректный формат ContentPath: moduleIndex обязателен');
  }

  const moduleIndex = Number.parseInt(moduleStr, 10);
  if (moduleIndex <= 0) {
    throw new Error('Индексы должны быть положительными (1-based)');
  }

  const projectIndex = projectStr ? Number.parseInt(projectStr, 10) : undefined;
  if (projectIndex !== undefined && projectIndex <= 0) {
    throw new Error('Индексы должны быть положительными (1-based)');
  }

  const lessonIndex = lessonStr ? Number.parseInt(lessonStr, 10) : undefined;
  if (lessonIndex !== undefined && lessonIndex <= 0) {
    throw new Error('Индексы должны быть положительными (1-based)');
  }

  let stepIndex: number | 'all' | undefined;
  if (stepStr) {
    if (stepStr === 'all') {
      stepIndex = 'all';
    } else {
      stepIndex = Number.parseInt(stepStr, 10);
      if (stepIndex <= 0) {
        throw new Error('Индексы должны быть положительными (1-based)');
      }
    }
  }

  return {
    moduleIndex,
    ...(projectIndex !== undefined && { projectIndex }),
    ...(lessonIndex !== undefined && { lessonIndex }),
    ...(stepIndex !== undefined && { stepIndex }),
  };
}

/**
 * Сериализует ContentPath в строку короткой формы (A:B:C:D).
 *
 * @param cp — ContentPath
 * @returns строка, например "2:1:3:4"
 */
export function serialize(cp: ContentPath): string {
  const parts: string[] = [String(cp.moduleIndex)];

  if (cp.projectIndex !== undefined) {
    parts.push(String(cp.projectIndex));
  }
  if (cp.lessonIndex !== undefined) {
    parts.push(String(cp.lessonIndex));
  }
  if (cp.stepIndex !== undefined) {
    parts.push(String(cp.stepIndex));
  }

  return parts.join(':');
}
