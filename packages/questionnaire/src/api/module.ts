import type { ErMeta, EventReaction } from '@u7-scl/core/api';
import { ApiModule } from '@u7-scl/core/api';
import type {
  QuestionnaireApiModuleMeta,
  QuestionnaireApiModuleResolver,
} from '../domain/module';
import { AbandonUc } from './questionnaire/abandon-uc';
import { DeclineInviteUc } from './questionnaire/decline-invite-uc';
import { GetCurrentUc } from './questionnaire/get-current-uc';
import { GetQuestionnaireUc } from './questionnaire/get-questionnaire-uc';
import { GetQuestionnairesByUserUc } from './questionnaire/get-questionnaires-by-user-uc';
import { HandleActionUc } from './questionnaire/handle-action-uc';
import { SendLikertInviteUc } from './questionnaire/send-likert-invite-uc';
import { StartByInviteUc } from './questionnaire/start-by-invite-uc';
import { StartUc } from './questionnaire/start-uc';

export class QuestionnaireApiModule extends ApiModule<
  QuestionnaireApiModuleMeta,
  QuestionnaireApiModuleResolver
> {
  readonly name = 'questionnaire' as const;
  readonly useCases = [
    new SendLikertInviteUc(),
    new StartUc(),
    new StartByInviteUc(),
    new DeclineInviteUc(),
    new HandleActionUc(),
    new AbandonUc(),
    new GetCurrentUc(),
    new GetQuestionnaireUc(),
    new GetQuestionnairesByUserUc(),
  ];
  readonly reactions: EventReaction<ErMeta>[] = [];

  constructor(resolve: QuestionnaireApiModuleResolver) {
    super(resolve);
    this.init();
  }
}
