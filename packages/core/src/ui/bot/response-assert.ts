import { assertMarkdownV2Safe } from '../../shared/markdown-validator';
import type { BotResponse, SendMessageDescription } from './types';

/** Telegram-лимит на длину callback_data в байтах (ASCII) */
const CALLBACK_DATA_MAX_BYTES = 64;

/**
 * Проверяет MarkdownV2-сообщения в BotResponse на отсутствие
 * неэкранированных символов и непарного форматирования.
 *
 * Используется в unit-тестах стори и контроллеров (без контроллера,
 * callback_data могут быть несжатыми — проверка длины не делается).
 */
export function assertResponseMarkdownSafe(response: BotResponse): void {
  // sendMessage — одиночное
  if (response.sendMessage) {
    assertMarkdownV2(response.sendMessage);
  }

  // sendMessages — массив
  for (const msg of response.sendMessages ?? []) {
    assertMarkdownV2(msg);
  }

  // editMessage
  if (response.editMessage) {
    assertMarkdownV2(response.editMessage);
  }

  // delegate — не BotResponse, просто { path }, проверять нечего
}

/**
 * Полная проверка BotResponse перед отправкой в Telegram:
 * 1. MarkdownV2 — нет неэкранированных символов и непарного форматирования
 * 2. callback_data — все кнопки в клавиатурах ≤ 64 байта
 *
 * Используется в integration/e2e тестах, где BotResponse формируется
 * с участием контроллера (сжатие id уже выполнено).
 */
export function assertBotResponseValid(response: BotResponse): void {
  assertResponseMarkdownSafe(response);
  assertCallbackDataLength(response);
}

// ── Приватные ──

function assertMarkdownV2(msg: SendMessageDescription): void {
  if (msg.parseMode === 'MarkdownV2' && msg.text) {
    assertMarkdownV2Safe(msg.text);
  }
}

function assertCallbackDataLength(response: BotResponse): void {
  const msgs: SendMessageDescription[] = [];
  if (response.sendMessage) msgs.push(response.sendMessage);
  if (response.sendMessages) msgs.push(...response.sendMessages);
  if (response.editMessage) msgs.push(response.editMessage);

  for (const msg of msgs) {
    if (!msg.keyboard) continue;
    for (const row of msg.keyboard.rows) {
      for (const btn of row) {
        const len = new TextEncoder().encode(btn.code).length;
        if (len > CALLBACK_DATA_MAX_BYTES) {
          throw new Error(
            `callback_data превышает ${CALLBACK_DATA_MAX_BYTES} байт (${len}): ${btn.code}`,
          );
        }
      }
    }
  }
}
