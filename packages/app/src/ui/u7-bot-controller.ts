import type { ApiModule } from '@u7-scl/core/api';
import type { ApiModuleMeta, ModuleResolver } from '@u7-scl/core/domain';
import { BotController } from '@u7-scl/core/ui';
import type { U7BotAppMeta, User } from '../domain';

/**
 * Специализированный контроллер для U7 Telegram-бота.
 *
 * Закрывает дженерики `U7BotAppMeta` и `User`, оставляя
 * открытым только `TMeta` — метаданные конкретного модуля.
 *
 * @typeParam TMeta — метаданные API-модуля, к которому привязан контроллер
 */
export abstract class U7BotController<
  TMeta extends ApiModuleMeta,
> extends BotController<U7BotAppMeta, TMeta, User> {
  constructor(moduleApi: ApiModule<TMeta, ModuleResolver>) {
    super(moduleApi);
  }
}
