import { assertMarkdownV2Safe } from '../../shared/markdown-validator';
import type {
  BotResponse,
  DialogResponse,
  SendMessageDescription,
} from './types';

/** Telegram-лимит на длину callback_data в байтах (ASCII) */
const CALLBACK_DATA_MAX_BYTES = 64;

/**
 * Единственная точка проверки MarkdownV2-сообщений в BotResponse.
 *
 * Проверяет sendMessage / sendMessages / editMessage на отсутствие
 * неэкранированных символов и непарного форматирования.
 * При невалидном тексте бросает `MarkdownV2ValidationError`.
 *
 * Используется:
 * - в unit-тестах стори и контроллеров (без контроллера, callback_data могут
 *   быть несжатыми — проверка длины не делается);
 * - в проде: `BotTransport.execute` вызывает её fail-fast перед отправкой —
 *   битый текст не уходит в Telegram.
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
 * Единственная точка проверки MdText-литералов в DialogResponse
 * (контракт «Диалог и Экран»).
 *
 * `md()` экранирует интерполированные данные, но литеральные части
 * шаблона остаются на совести автора — битый литерал (непарная разметка,
 * голый спецсимвол) ловится здесь fail-fast, до отправки в Telegram.
 *
 * Используется в проде: `BotTransport` вызывает перед рендером ответа.
 */
export function assertDialogResponseMarkdownSafe(
  response: DialogResponse,
): void {
  if (response.screen?.text) {
    assertMarkdownV2Safe(response.screen.text);
  }
  if (response.finalize?.text) {
    assertMarkdownV2Safe(response.finalize.text);
  }
  if (response.notify?.text) {
    assertMarkdownV2Safe(response.notify.text);
  }

  // awaitInput / release / delegate — текстов не несут
}

/**
 * Полная проверка BotResponse перед отправкой в Telegram:
 * 1. MarkdownV2 — нет неэкранированных символов и непарного форматирования
 * 2. callback_data — все кнопки в клавиатурах ≤ 64 байта
 *
 * Используется в integration/e2e тестах, где BotResponse формируется
 * с участием контроллера (сжатие id уже выполнено).
 */
export function assertBotResponseValid(response: BotResponse | null): void {
  if (!response) {
    throw new Error(`BotResponse is ${typeof response}`);
  }
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
