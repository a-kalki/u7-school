import { ApiModule } from '@u7/core/api';
import type {
  OnboardingApiModuleMeta,
  OnboardingApiModuleResolver,
} from '#domain/module';
import { AbandonQuestionnaireUc } from './questionnaire/abandon-questionnaire-uc';
import { HandleOnboardingActionUc } from './questionnaire/handle-onboarding-action-uc';
import { StartQuestionnaireUc } from './questionnaire/start-questionnaire-uc';

export class OnboardingApiModule extends ApiModule<
  OnboardingApiModuleMeta,
  OnboardingApiModuleResolver
> {
  readonly name = 'onboarding' as const;
  readonly useCases = [
    new StartQuestionnaireUc(),
    new HandleOnboardingActionUc(),
    new AbandonQuestionnaireUc(),
  ];
}
