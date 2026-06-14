import type { ApiModuleMeta } from '@u7-scl/core/domain';
import { BotController } from '@u7-scl/core/ui';
import type { U7BotAppMeta, User } from '../domain';

/**
 * Специализированный контроллер для U7 Telegram-бота.
 */
export abstract class U7BotController<
  TMeta extends ApiModuleMeta,
> extends BotController<U7BotAppMeta, User> {
  // Конструктор будет расширен в Фазе 2 (добавление moduleApi)
  // Пока наследует поведение BotController без изменений
}
