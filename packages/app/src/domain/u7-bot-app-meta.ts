import type { AppMeta } from '@u7-scl/core/domain';
import type { AppResolver } from '@u7-scl/core/domain';
import type { Logger } from '@u7-scl/core/shared';
import type { OnboardingApiModuleMeta } from '@u7-scl/onboarding/domain';
import type { StreamApiModuleMeta } from '@u7-scl/stream';
import type { UserApiModuleMeta } from '@u7-scl/user/domain';

/**
 * Метаданные приложения U7 Bot.
 * Единый тип AppMeta, объединяющий все модули u7-бота.
 *
 * Содержит явный union всех зарегистрированных ApiModuleMeta,
 * что даёт строгую типизацию вызовов `apiApp.execute(...)`.
 */
export interface U7BotAppMeta extends AppMeta {
  name: 'u7-bot-app';
  moduleMetas:
    | UserApiModuleMeta
    | OnboardingApiModuleMeta
    | StreamApiModuleMeta;
}

/**
 * Резолвер уровня приложения U7.
 * Расширяет базовый `AppResolver` из core,
 * может содержать дополнительные специфичные для U7 зависимости.
 */
export interface U7AppResolver extends AppResolver {
  logger: Logger;
}
