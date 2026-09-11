import { assertMarkdownV2Safe } from '../../shared/markdown-validator';
import type { DialogResponse } from './types';

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
