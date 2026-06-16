import type { ApiApp } from '@u7-scl/core/api';
import type { AppMeta, AppResolver } from '@u7-scl/core/domain';
import type { CourseApiModuleMeta } from '@u7-scl/course/domain';
import type { OnboardingApiModuleMeta } from '@u7-scl/onboarding/domain';
import type { StreamApiModuleMeta } from '@u7-scl/stream';
import type { UserApiModuleMeta } from '@u7-scl/user/domain';

/**
 * Метаданные приложения U7 Bot.
 */
export interface U7BotAppMeta extends AppMeta {
  name: 'u7-bot-app';
  moduleMetas:
    | UserApiModuleMeta
    | OnboardingApiModuleMeta
    | StreamApiModuleMeta
    | CourseApiModuleMeta;
}

/** Тип API-приложения U7 бота */
export type U7BotApp = ApiApp<U7BotAppMeta>;

/**
 * Резолвер уровня приложения U7.
 */
export interface U7AppResolver extends AppResolver {}
