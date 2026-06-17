import type { BotResponse, SendMessageDescription } from './types';
import { assertMarkdownV2Safe } from '../../shared/markdown-validator';

/**
 * Рекурсивно проверяет все MarkdownV2-сообщения в BotResponse
 * на отсутствие неэкранированных символов и непарного форматирования.
 *
 * Используется в тестах стори и контроллеров,
 * а также в dev-assert внутри executeResponses.
 */
export function assertResponseMarkdownSafe(response: BotResponse): void {
  // sendMessage — одиночное
  if (response.sendMessage) {
    assertMessageSafe(response.sendMessage);
  }

  // sendMessages — массив
  for (const msg of response.sendMessages ?? []) {
    assertMessageSafe(msg);
  }

  // editMessage
  if (response.editMessage) {
    assertMessageSafe(response.editMessage);
  }

  // delegate — не BotResponse, просто { path }, проверять нечего
}

function assertMessageSafe(msg: SendMessageDescription): void {
  if (msg.parseMode === 'MarkdownV2' && msg.text) {
    assertMarkdownV2Safe(msg.text);
  }
}
