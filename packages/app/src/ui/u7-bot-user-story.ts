import type { ApiModuleMeta } from '@u7-scl/core/domain';
import { fromError } from '@u7-scl/core/domain';
import { serializeError } from '@u7-scl/core/shared';
import { BotUserStory } from '@u7-scl/core/ui';
import type { U7BotAppMeta, User } from '../domain';
import type { BotResponse } from '@u7-scl/core/ui';

/**
 * Специализированный пользовательский сценарий для U7 Telegram-бота.
 *
 * Закрывает дженерики `U7BotAppMeta` и `User`, оставляя
 * открытым только `TMeta` — метаданные модуля, к которому
 * принадлежит сценарий.
 *
 * @typeParam TMeta — метаданные API-модуля
 */
export abstract class U7BotUserStory<
  TMeta extends ApiModuleMeta,
> extends BotUserStory<U7BotAppMeta, TMeta, User> {
  /**
   * Универсальный обработчик ошибок.
   * Различает типы ошибок через `fromError()` и возвращает
   * подходящее пользовательское сообщение.
   *
   * - `validation` — перечисляет поля из `payload.issues`
   * - `not-found`, `conflict`, `access-denied`, `bad-request` — текст ошибки
   * - `internal`, `unauthorized` — логирует через `serializeError()` и возвращает общее сообщение
   */
  protected handleError(err: unknown): BotResponse {
    const appError = fromError(err);

    switch (appError.kind) {
      case 'validation': {
        const payload = appError.payload as
          | { issues?: Array<{ field: string; message: string }> }
          | undefined;
        const issues = payload?.issues;

        if (issues && issues.length > 0) {
          const lines = issues.map((i) => `• *${i.field}*: ${i.message}`);
          return {
            releaseInput: true,
            sendMessage: {
              text: `⚠️ *Ошибка валидации*\n\n${lines.join('\n')}\n\nПожалуйста, попробуйте снова начав с команды /start с исправленными значениями.`,
              parseMode: 'MarkdownV2',
            },
          };
        }

        return {
          releaseInput: true,
          sendMessage: {
            text: `⚠️ *Ошибка валидации*

${appError.message}

Пожалуйста, исправьте и попробуйте снова.`,
            parseMode: 'MarkdownV2',
          },
        };
      }

      case 'not-found':
      case 'conflict':
      case 'access-denied':
      case 'bad-request':
        return {
          releaseInput: true,
          sendMessage: {
            text: `⚠️ ${appError.message}`,
            parseMode: 'MarkdownV2',
          },
        };

      case 'internal':
      case 'unauthorized':
      default:
        console.error(
          `[${appError.name}] Внутренняя ошибка:`,
          serializeError(err),
        );
        return {
          releaseInput: true,
          sendMessage: {
            text: `⚠️ *Произошла внутренняя ошибка*\n\nПожалуйста, попробуйте позже или обратитесь к администратору\\.`,
            parseMode: 'MarkdownV2',
          },
        };
    }
  }
}
