import type {
  ApiModuleMeta,
  AppResolver,
  ModuleResolver,
} from '@u7-scl/core/domain';
import type { BaseJsonDb } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import type {
  AbandonUcMeta,
  DeclineInviteUcMeta,
  GetCurrentUcMeta,
  GetQuestionnairesByUserUcMeta,
  GetQuestionnaireUcMeta,
  HandleActionUcMeta,
  SendInviteUcMeta,
  StartByInviteUcMeta,
  StartUcMeta,
} from '../api/questionnaire/uc-metas';
import type { QuestionnaireBotFacade } from './bot-facade';
import type { QuestionnaireRepo } from './questionnaire/repo';

export type QuestionnaireUcMetas =
  | SendInviteUcMeta
  | StartUcMeta
  | StartByInviteUcMeta
  | DeclineInviteUcMeta
  | HandleActionUcMeta
  | AbandonUcMeta
  | GetCurrentUcMeta
  | GetQuestionnaireUcMeta
  | GetQuestionnairesByUserUcMeta;

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
