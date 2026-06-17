import { describe, expect, test } from 'bun:test';
import type { BotResponse } from './types';
import { assertResponseMarkdownSafe } from './response-assert';

describe('assertResponseMarkdownSafe', () => {
  test('не ругается на неэкранированный текст в кнопках', () => {
    const response: BotResponse = {
      sendMessage: {
        text: 'Обычный *текст* с форматированием',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              { text: 'не_экранированный_текст.кнопки!', code: 'btn1' },
            ],
            [
              { text: 'Кнопка (с) скобками!', code: 'btn2' },
            ],
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
