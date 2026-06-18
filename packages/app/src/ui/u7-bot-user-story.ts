import type { ApiModuleMeta } from '@u7-scl/core/domain';
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
   * Универсальный обработчик ошибок — делегирует базовому классу.
   * Переопределён для сохранения обратной совместимости сигнатуры.
   */
  protected override handleError(err: unknown): BotResponse {
    return super.handleError(err);
  }
}
