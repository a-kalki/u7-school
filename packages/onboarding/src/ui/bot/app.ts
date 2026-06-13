import type { ApiApp } from '@u7-scl/core/api';
import type { AppMeta } from '@u7-scl/core/domain';
import type { UserApiModuleMeta } from '@u7-scl/user/domain';
import type { OnboardingApiModuleMeta } from '../../domain/module';

export interface U7BotAppMeta extends AppMeta {
  name: 'onboarding-bot';
  moduleMetas: OnboardingApiModuleMeta | UserApiModuleMeta;
}

/** API-приложение для u7 бота */
export type U7BotApp = ApiApp<U7BotAppMeta>;
