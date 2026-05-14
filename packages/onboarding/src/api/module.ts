import { ApiModule } from "@u7/core/api";
import type {
	OnboardingApiModuleResolver,
	OnboardingModuleMeta,
} from "#domain/module";
import { AbandonQuestionnaireUc } from "./questionnaire/abandon-questionnaire-uc";
import { GetQuestionnaireUc } from "./questionnaire/get-questionnaire-uc";
import { ListQuestionnairesByUserUc } from "./questionnaire/list-questionnaires-by-user-uc";
import { StartQuestionnaireUc } from "./questionnaire/start-questionnaire-uc";
import { SubmitAnswerUc } from "./questionnaire/submit-answer-uc";

export class OnboardingApiModule extends ApiModule<
	OnboardingModuleMeta,
	OnboardingApiModuleResolver
> {
	readonly name = "onboarding" as const;
	readonly useCases = [
		new StartQuestionnaireUc(),
		new SubmitAnswerUc(),
		new GetQuestionnaireUc(),
		new AbandonQuestionnaireUc(),
		new ListQuestionnairesByUserUc(),
	];
}
