import type { ApiModuleMeta, AppMeta } from '@u7-scl/core/domain';
import type { AppResolver } from '@u7-scl/core/domain';
import type { Logger } from '@u7-scl/core/shared';

/**
 * Метаданные приложения U7 Bot.
 * Единый тип AppMeta для всего u7-бота.
 *
 * `moduleMetas` принимает любые `ApiModuleMeta` — конкретные
 * модули сужают union через дженерик на уровне сборки приложения.
 */
export interface U7BotAppMeta extends AppMeta {
  name: 'u7-bot-app';
  moduleMetas: ApiModuleMeta;
}

/**
 * Резолвер уровня приложения U7.
 * Расширяет базовый `AppResolver` из core,
 * может содержать дополнительные специфичные для U7 зависимости.
 */
export interface U7AppResolver extends AppResolver {
  logger: Logger;
}
