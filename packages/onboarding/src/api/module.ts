import { ApiModule } from '@u7/core/api';
import type {
  OnboardingApiModuleMeta,
  OnboardingApiModuleResolver,
} from '#domain/module';
import { AbandonQuestionnaireUc } from './questionnaire/abandon-questionnaire-uc';
import { GetOnboardingStateUc } from './questionnaire/get-onboarding-state-uc';
import { GetQuestionnaireUc } from './questionnaire/get-questionnaire-uc';
import { HandleOnboardingActionUc } from './questionnaire/handle-onboarding-action-uc';
import { ListQuestionnairesByTelegramIdUc } from './questionnaire/list-questionnaires-by-telegram-id-uc';
import { StartQuestionnaireUc } from './questionnaire/start-questionnaire-uc';

export class OnboardingApiModule extends ApiModule<
  OnboardingApiModuleMeta,
  OnboardingApiModuleResolver
> {
  readonly name = 'onboarding' as const;
  readonly useCases = [
    new StartQuestionnaireUc(),
    new HandleOnboardingActionUc(),
    new GetQuestionnaireUc(),
    new AbandonQuestionnaireUc(),
    new ListQuestionnairesByTelegramIdUc(),
    new GetOnboardingStateUc(),
  ];
}
