import { describe, expect, test } from 'bun:test';
import { validateMarkdownV2 } from '@u7-scl/core/shared';
import { formatStepMessage } from './shared';

describe('formatStepMessage — режимы student / readOnly / study (TDD)', () => {
  const dummyStep = {
    uuid: 'step-1-uuid',
    description: 'Описание тестового шага',
    kind: 'text',
    content: '## Заголовок задания\nТекст с *акцентом* и `кодом`.',
  };

  const resolved = {
    projectIndex: 1,
    lessonIndex: 2,
    stepIndex: 3,
    totalSteps: 5,
    projectTitle: 'Введение в web',
    lessonTitle: 'Как устроен web',
  };

  test('[Red] режим student: выводит хлебные крошки, статус и тело шага', () => {
    const text = formatStepMessage(
      'Поток 7',
      resolved,
      dummyStep,
      undefined,
      undefined,
      {
        mode: 'student',
        status: 'in_progress',
        statusLabel: 'В процессе',
        breadcrumbs: [
          '📖 Программа модуля',
          'Введение в web',
          'Как устроен web',
          'Шаг 3',
        ],
      },
    );

    // Должен содержать хлебные крошки
    expect(text).toContain(
      '📖 *Программа модуля* › Введение в web › Как устроен web › Шаг 3',
    );
    // Должен содержать статус студента
    expect(text).toContain('▶️ В процессе');
    // Не должен содержать S05a шапку потока/прогресс-бара
    expect(text).not.toContain('📖 *Поток:*');
    expect(text).not.toContain('🔢 p1\\-l2');
    // Должен быть валидным MarkdownV2
    const result = validateMarkdownV2(text);
    expect(result.issues).toEqual([]);
  });

  test('[Red] режим readOnly: выводит хлебные крошки и тело, БЕЗ статуса', () => {
    const text = formatStepMessage(
      'Поток 7',
      resolved,
      dummyStep,
      undefined,
      undefined,
      {
        mode: 'readOnly',
        breadcrumbs: [
          '📖 Программа модуля',
          'Введение в web',
          'Как устроен web',
          'Шаг 3',
        ],
      },
    );

    // Должен содержать менторские хлебные крошки
    expect(text).toContain(
      '📖 *Программа модуля* › Введение в web › Как устроен web › Шаг 3',
    );
    // НЕ должен содержать статусов прохождения
    expect(text).not.toContain('▶️');
    expect(text).not.toContain('✅');
    expect(text).not.toContain('В процессе');
    // Должен быть валидным MarkdownV2
    const result = validateMarkdownV2(text);
    expect(result.issues).toEqual([]);
  });

  test('[Red] режим code шага: pre-entity экранирование блока кода', () => {
    const codeStep = {
      uuid: 'code-step',
      description: 'Кодовый шаг',
      kind: 'code',
      code: 'function hello(name: string): string {\n  return "Hello, " + name;\n}',
    };

    const text = formatStepMessage(
      'Поток 7',
      resolved,
      codeStep,
      undefined,
      undefined,
      {
        mode: 'readOnly',
        breadcrumbs: ['📖 Программа модуля', 'Web', 'Урок', 'Шаг 1'],
      },
    );

    expect(text).toContain('```');
    expect(text).toContain('function hello');
    const result = validateMarkdownV2(text);
    expect(result.issues).toEqual([]);
  });

  test('дефолтный режим study (обратная совместимость): S05a с прогресс-баром', () => {
    const text = formatStepMessage('Поток 7', resolved, dummyStep);

    expect(text).toContain('📖 *Поток:* Поток 7');
    expect(text).toContain('📁 *Проект:* Введение в web');
    expect(text).toContain('🔢 p1\\-l2');
    expect(text).toContain('📊');
    const result = validateMarkdownV2(text);
    expect(result.issues).toEqual([]);
  });
});
