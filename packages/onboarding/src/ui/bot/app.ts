import type { ApiApp } from '@u7/core/api';
import type { AppMeta } from '@u7/core/domain';
import type { UserApiModuleMeta } from '@u7/user/domain';
import type { OnboardingApiModuleMeta } from '#domain/module';

export interface OnboardingBotAppMeta extends AppMeta {
  name: 'onboarding-bot';
  moduleMetas: OnboardingApiModuleMeta | UserApiModuleMeta;
}

export type OnboardingBotApp = ApiApp<OnboardingBotAppMeta>;
