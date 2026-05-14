import type { BaseJsonDb } from "@u7/core/infra";
import type { UserFacade } from "@u7/user/domain";
import type { QuestionPoolService } from "./questionnaire/question-pool-service";
import type { QuestionnaireRepo } from "./questionnaire/repo";

/** Метаданные API-модуля onboarding */
export interface OnboardingModuleMeta {
	name: "onboarding";
	url: "/onboarding";
}

/** Резолвер зависимостей API-модуля onboarding */
export interface OnboardingApiModuleResolver {
	questionnaireRepo: QuestionnaireRepo;
	questionPoolService: QuestionPoolService;
	userFacade: UserFacade;
	db: BaseJsonDb;
}
