import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { validateMarkdownV2 } from '@u7-scl/core/shared';
import { formatStepMessage } from '../../src/controllers/learning/shared';

/**
 * Регресс-защита контента: каждый шаг курса должен рендериться в валидный
 * MarkdownV2-экран.
 *
 * Проверяется тот же путь, что в проде: formatStepMessage (внутри —
 * safeConvert для text-контента и mdCodeBlock для кода) → текст экрана
 * попадает под assertDialogResponseMarkdownSafe в #render транспорта.
 * Если валидатор находит issues — рендер падает fail-fast и студент
 * застревает: экран не уходит, /start рендерит тот же битый экран.
 *
 * Контекст (v0.1.3): hard break (два пробела в конце строки) в контенте
 * 7 из 500 шагов конвертировался в голый `\` перед переносом — баг дошёл
 * до прода и застрелил студента на p1-l2.
 *
 * Тест читает боевой контент data/courses/steps.json: он в git и
 * доставляется в прод коммитами, поэтому прогон на `bun run check`
 * (гейт release.sh) ловит битые шаги до выката.
 */
describe('Контент шагов — валидный MarkdownV2 экран', () => {
  const stepsPath = join(
    import.meta.dir,
    '../../../../data/courses/steps.json',
  );
  const stepsRaw: unknown = JSON.parse(readFileSync(stepsPath, 'utf8'));
  const steps = (
    Array.isArray(stepsRaw)
      ? stepsRaw
      : (stepsRaw as { steps: unknown[] }).steps
  ) as Array<{
    uuid: string;
    description?: string;
    kind?: string;
    code?: string;
    content?: string;
  }>;

  test('каждый шаг рендерится без issues валидатора', () => {
    const invalid: Array<{
      step: string;
      issues: Array<{ char: string; reason: string }>;
    }> = [];

    for (const step of steps) {
      if (typeof step.content !== 'string' && typeof step.code !== 'string') {
        continue;
      }

      const screen = formatStepMessage(
        'Поток',
        {
          projectIndex: 1,
          lessonIndex: 1,
          stepIndex: 1,
          totalSteps: 1,
          projectTitle: 'Проект',
          lessonTitle: 'Урок',
        },
        {
          uuid: step.uuid,
          description: step.description ?? '',
          kind: step.kind ?? 'text',
          code: typeof step.code === 'string' ? step.code : undefined,
          content: typeof step.content === 'string' ? step.content : undefined,
        },
      );
      const result = validateMarkdownV2(screen);
      if (!result.valid) {
        invalid.push({
          step: step.description ?? step.uuid,
          issues: result.issues,
        });
      }
    }

    expect(invalid).toEqual([]);
  });
});
