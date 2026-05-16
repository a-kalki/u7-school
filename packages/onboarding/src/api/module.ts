import { ApiModule } from '@u7/core/api';
import type {
  OnboardingApiModuleMeta,
  OnboardingApiModuleResolver,
} from '#domain/module';
import { AbandonQuestionnaireUc } from './questionnaire/abandon-questionnaire-uc';
import { GetQuestionnaireUc } from './questionnaire/get-questionnaire-uc';
import { ListQuestionnairesByTelegramIdUc } from './questionnaire/list-questionnaires-by-telegram-id-uc';
import { StartQuestionnaireUc } from './questionnaire/start-questionnaire-uc';
import { SubmitAnswerUc } from './questionnaire/submit-answer-uc';
import { ToggleDraftAnswerUc } from './questionnaire/toggle-draft-answer-uc';
import { GetOnboardingStateUc } from './questionnaire/get-onboarding-state-uc';

export class OnboardingApiModule extends ApiModule<
  OnboardingApiModuleMeta,
  OnboardingApiModuleResolver
> {
  readonly name = 'onboarding' as const;
  readonly useCases = [
    new StartQuestionnaireUc(),
    new SubmitAnswerUc(),
    new GetQuestionnaireUc(),
    new AbandonQuestionnaireUc(),
    new ListQuestionnairesByTelegramIdUc(),
    new ToggleDraftAnswerUc(),
    new GetOnboardingStateUc(),
  ];

  override init(resolver: OnboardingApiModuleResolver): void {
    super.init(resolver);
    // проверяем что коды вопросов текущей анкеты есть в общем пуле вопросов
    resolver.questionPoolService.assertAllCodesExist(
      resolver.includedQuestionCodes,
    );
  }
}
