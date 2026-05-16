import type { ApiModuleMeta } from '@u7/core/domain';
import type { BaseJsonDb } from '@u7/core/infra';
import type { UserFacade } from '@u7/user/domain';
import type { AbandonQuestionnaireCmdMeta } from './questionnaire/commands/abandon-questionnaire-cmd';
import type { GetOnboardingStateCmdMeta } from './questionnaire/commands/get-onboarding-state-cmd';
import type { GetQuestionnaireCmdMeta } from './questionnaire/commands/get-questionnaire-cmd';
import type { HandleOnboardingActionCmdMeta } from './questionnaire/commands/handle-onboarding-action-cmd';
import type { ListQuestionnairesByTelegramIdCmdMeta } from './questionnaire/commands/list-questionnaires-by-telegram-id-cmd';
import type { StartQuestionnaireCmdMeta } from './questionnaire/commands/start-questionnaire-cmd';
import type { QuestionPoolService } from './questionnaire/question-pool-service';
import type { QuestionnaireRepo } from './questionnaire/repo';

export type OnboardingUcMetas =
  | AbandonQuestionnaireCmdMeta
  | GetQuestionnaireCmdMeta
  | ListQuestionnairesByTelegramIdCmdMeta
  | StartQuestionnaireCmdMeta
  | GetOnboardingStateCmdMeta
  | HandleOnboardingActionCmdMeta;

/** Метаданные API-модуля onboarding */
export interface OnboardingApiModuleMeta extends ApiModuleMeta {
  name: 'onboarding';
  url: '/onboarding';
  ucMetas: OnboardingUcMetas;
}

/**
 * Резолвер зависимостей API-модуля onboarding.
 *
 * `includedQuestionCodes` — коды вопросов, включённых в текущую версию анкеты.
 * Это подмножество общего пула (`questionPoolService`).
 * Например, пул может содержать 50 вопросов, а в анкету включено только 10.
 */
export interface OnboardingApiModuleResolver {
  questionnaireRepo: QuestionnaireRepo;
  questionPoolService: QuestionPoolService;
  userFacade: UserFacade;
  db: BaseJsonDb;
}
