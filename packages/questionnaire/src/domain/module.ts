import type {
  ApiModuleMeta,
  AppResolver,
  ModuleResolver,
} from '@u7-scl/core/domain';
import type { BaseJsonDb } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import type {
  AbandonUcMeta,
  GetQuestionnairesByUserUcMeta,
  GetQuestionnaireUcMeta,
  HandleActionUcMeta,
  StartUcMeta,
} from '../api/questionnaire/uc-metas';
import type { QuestionPoolService } from './questionnaire/question-pool-service';
import type { QuestionnaireRepo } from './questionnaire/repo';

export type QuestionnaireUcMetas =
  | StartUcMeta
  | HandleActionUcMeta
  | AbandonUcMeta
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
  questionPoolService: QuestionPoolService;
  userFacade: UserFacade;
  db: BaseJsonDb;
  appResolver: AppResolver;
}
