import { ApiModule } from '@u7-scl/core/api';
import type {
  QuestionnaireApiModuleMeta,
  QuestionnaireApiModuleResolver,
} from '../domain/module';
import { AbandonUc } from './questionnaire/abandon-uc';
import { GetQuestionnaireUc } from './questionnaire/get-questionnaire-uc';
import { GetQuestionnairesByUserUc } from './questionnaire/get-questionnaires-by-user-uc';
import { HandleActionUc } from './questionnaire/handle-action-uc';
import { StartUc } from './questionnaire/start-uc';

export class QuestionnaireApiModule extends ApiModule<
  QuestionnaireApiModuleMeta,
  QuestionnaireApiModuleResolver
> {
  readonly name = 'questionnaire' as const;
  readonly useCases = [
    new StartUc(),
    new HandleActionUc(),
    new AbandonUc(),
    new GetQuestionnaireUc(),
    new GetQuestionnairesByUserUc(),
  ];

  constructor(resolve: QuestionnaireApiModuleResolver) {
    super(resolve);
    this.init();
  }
}
