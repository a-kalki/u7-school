import { ApiModule } from '@u7/core/api';
import type {
  OnboardingApiModuleMeta,
  OnboardingApiModuleResolver,
} from '#domain/module';
import { AbandonUc } from './questionnaire/abandon-uc';
import { HandleActionUc } from './questionnaire/handle-action-uc';
import { StartUc } from './questionnaire/start-uc';

export class OnboardingApiModule extends ApiModule<
  OnboardingApiModuleMeta,
  OnboardingApiModuleResolver
> {
  readonly name = 'onboarding' as const;
  readonly useCases = [new StartUc(), new HandleActionUc(), new AbandonUc()];
}
