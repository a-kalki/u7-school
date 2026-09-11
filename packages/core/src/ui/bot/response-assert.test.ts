import { describe, expect, test } from 'bun:test';
import { md, mdRaw } from '../../shared/markdown';
import { assertDialogResponseMarkdownSafe } from './response-assert';
import type { DialogResponse } from './types';

// ── assertDialogResponseMarkdownSafe — fail-fast для контракта «Диалог и Экран» (трек bot-ui-dialog-core) ──

describe('assertDialogResponseMarkdownSafe', () => {
  test('экранированный md-текст во всех слотах проходит', () => {
    const response: DialogResponse = {
      screen: { text: md`*Экран* с данными: ${'5.5!'}` },
      finalize: { text: md`Фиксация: ${'а_б'}` },
      notify: { text: md`ⓘ Подсказка: ${'(1)'}` },
    };

    expect(() => assertDialogResponseMarkdownSafe(response)).not.toThrow();
  });

  test('битый литерал в screen ловится (непарный жирный)', () => {
    const response: DialogResponse = {
      screen: { text: mdRaw('Жирный * текст без пары') },
    };

    expect(() => assertDialogResponseMarkdownSafe(response)).toThrow();
  });

  test('битый литерал в finalize ловится (неэкранированная точка)', () => {
    const response: DialogResponse = {
      finalize: { text: mdRaw('Выбран вариант 1.') },
    };

    expect(() => assertDialogResponseMarkdownSafe(response)).toThrow();
  });

  test('битый литерал в notify ловится', () => {
    const response: DialogResponse = {
      notify: { text: mdRaw('Тихая_реплика_с_разметкой') },
    };

    expect(() => assertDialogResponseMarkdownSafe(response)).toThrow();
  });

  test('пустой ответ проходит без исключений', () => {
    expect(() => assertDialogResponseMarkdownSafe({})).not.toThrow();
  });
});
