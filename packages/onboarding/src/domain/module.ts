import type { BaseJsonDb } from "@u7/core/infra";
import type { UserRepo } from "@u7/user/domain";
import type { ApplicationRepo } from "./application/repo";

/** Метаданные API-модуля onboarding */
export interface OnboardingModuleMeta {
  name: "onboarding";
  url: "/onboarding";
}

/** Резолвер зависимостей API-модуля onboarding */
export interface OnboardingApiModuleResolver {
  applicationRepo: ApplicationRepo;
  userRepo: UserRepo;
  db: BaseJsonDb;
}
