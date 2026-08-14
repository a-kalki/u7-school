import type {
  ApiModuleMeta,
  AppResolver,
  ModuleResolver,
} from '@u7-scl/core/domain';
import type { BaseJsonDb } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import type { QuestionnaireBotFacade } from './bot-facade';
import type { AbandonCmdMeta } from './questionnaire/commands/abandon-cmd';
import type { DeclineInviteCmdMeta } from './questionnaire/commands/decline-invite-cmd';
import type { GetCurrentCmdMeta } from './questionnaire/commands/get-current-cmd';
import type { GetQuestionnaireCmdMeta } from './questionnaire/commands/get-questionnaire-cmd';
import type { GetQuestionnairesByUserCmdMeta } from './questionnaire/commands/get-questionnaires-by-user-cmd';
import type { HandleActionCmdMeta } from './questionnaire/commands/handle-action-cmd';
import type { SendMetricInviteCmdMeta } from './questionnaire/commands/send-metric-invite-cmd';
import type { StartByInviteCmdMeta } from './questionnaire/commands/start-by-invite-cmd';
import type { StartCmdMeta } from './questionnaire/commands/start-cmd';
import type { QuestionnaireRepo } from './questionnaire/repo';

export type QuestionnaireUcMetas =
  | SendMetricInviteCmdMeta
  | StartCmdMeta
  | StartByInviteCmdMeta
  | DeclineInviteCmdMeta
  | HandleActionCmdMeta
  | AbandonCmdMeta
  | GetCurrentCmdMeta
  | GetQuestionnaireCmdMeta
  | GetQuestionnairesByUserCmdMeta;

/** Метаданные API-модуля questionnaire */
export interface QuestionnaireApiModuleMeta extends ApiModuleMeta {
  name: 'questionnaire';
  url: '/questionnaire';
  ucMetas: QuestionnaireUcMetas;
}

/** Резолвер зависимостей API-модуля questionnaire */
export interface QuestionnaireApiModuleResolver extends ModuleResolver {
  questionnaireRepo: QuestionnaireRepo;
  botFacade: QuestionnaireBotFacade;
  userFacade: UserFacade;
  db: BaseJsonDb;
  appResolver: AppResolver;
}
