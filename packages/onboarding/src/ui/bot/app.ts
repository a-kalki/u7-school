import { ApiApp } from "@u7/core/api";
import type { AppMeta } from "@u7/core/domain";
import type { UserApiModuleMeta } from "@u7/user/domain";
import type { OnboardingApiModuleMeta } from "#domain/module";

export interface OnboardingBotAppMeta
	extends AppMeta<OnboardingApiModuleMeta | UserApiModuleMeta> {
	name: "onboarding-bot";
}

export type OnboardingBotApp = ApiApp<OnboardingBotAppMeta>;
