import type { ApiApp } from '@u7/core/api';
import type { AppMeta } from '@u7/core/domain';
import type { OnboardingApiModuleMeta } from '../../domain/module';
import type { UserApiModuleMeta } from '@u7/user/domain';

export interface OnboardingBotAppMeta extends AppMeta {
    name: 'onboarding-bot';
    moduleMetas: OnboardingApiModuleMeta | UserApiModuleMeta;
}

/** API-приложение для onboarding бота */
export type OnboardingBotApp = ApiApp<OnboardingBotAppMeta>;
