import { describe, expect, test } from 'bun:test';
import { md, mdRaw } from '../../shared/markdown';
import {
  assertDialogResponseMarkdownSafe,
  assertResponseMarkdownSafe,
} from './response-assert';
import type { BotResponse, DialogResponse } from './types';

describe('assertResponseMarkdownSafe', () => {
  test('не ругается на неэкранированный текст в кнопках', () => {
    const response: BotResponse = {
      sendMessage: {
        text: 'Обычный *текст* с форматированием',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [{ text: 'не_экранированный_текст.кнопки!', code: 'btn1' }],
            [{ text: 'Кнопка (с) скобками!', code: 'btn2' }],
          ],
          isMultiple: false,
        },
      },
    };

    // Не должно бросать ошибку — текст кнопок не проверяется
    expect(() => assertResponseMarkdownSafe(response)).not.toThrow();
  });

  test('ругается на неэкранированные символы в MarkdownV2-тексте сообщения', () => {
    const response: BotResponse = {
      sendMessage: {
        // Символ '.' не экранирован в MarkdownV2 (если он после цифры — это список)
        text: 'Текст с точкой. Без экранирования',
        parseMode: 'MarkdownV2',
      },
    };

    expect(() => assertResponseMarkdownSafe(response)).toThrow();
  });

  test('корректно экранированный MarkdownV2 проходит валидацию', () => {
    const response: BotResponse = {
      sendMessage: {
        text: 'Текст с точкой\\. С экранированием',
        parseMode: 'MarkdownV2',
      },
    };

    expect(() => assertResponseMarkdownSafe(response)).not.toThrow();
  });

  test('проверяет текст в sendMessages', () => {
    const response: BotResponse = {
      sendMessages: [
        {
          text: 'Обычное сообщение',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [[{ text: 'Кнопка_с_подчёркиванием', code: 'btn' }]],
            isMultiple: false,
          },
        },
      ],
    };

    // Кнопки не проверяются, текст обычный — ошибки быть не должно
    expect(() => assertResponseMarkdownSafe(response)).not.toThrow();
  });

  test('проверяет текст в editMessage', () => {
    const response: BotResponse = {
      editMessage: {
        messageId: 1,
        text: 'Неэкранированная.точка',
        parseMode: 'MarkdownV2',
      },
    };

    expect(() => assertResponseMarkdownSafe(response)).toThrow();
  });
});

// ── assertDialogResponseMarkdownSafe — fail-fast для контракта «Диалог и Экран» (трек bot-ui-dialog-core) ──

describe('assertDialogResponseMarkdownSafe', () => {
  test('экранированный md-текст во всех слотах проходит', () => {
    const response: DialogResponse = {
      screen: { text: md`*Экран* с данными: ${'5.5!'}` },
      finalize: { text: md`Фиксация: ${'а_б'}` },
      info: { text: md`ⓘ Подсказка: ${'(1)'}` },
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

  test('битый литерал в info ловится', () => {
    const response: DialogResponse = {
      info: { text: mdRaw('Тихая_реплика_с_разметкой') },
    };

    expect(() => assertDialogResponseMarkdownSafe(response)).toThrow();
  });

  test('пустой ответ проходит без исключений', () => {
    expect(() => assertDialogResponseMarkdownSafe({})).not.toThrow();
  });
});
