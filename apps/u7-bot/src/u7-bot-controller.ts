import type { User } from '@u7-scl/app/domain';
import { BotController } from '@u7-scl/core/ui';
import type { U7BotAppMeta } from './u7-bot-app-meta';

/**
 * Специализированный контроллер для U7 Telegram-бота.
 *
 * Закрывает дженерики `U7BotAppMeta`, `User`.
 * Контроллеры больше не привязаны к конкретному доменному модулю —
 * все вызовы к модулям идут через `this.appApi.execute(...)`.
 */
export abstract class U7BotController extends BotController<
  U7BotAppMeta,
  User
> {}
