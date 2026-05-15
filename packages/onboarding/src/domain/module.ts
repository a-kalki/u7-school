import type { ApiModuleMeta } from '@u7/core/domain';
import type { BaseJsonDb } from '@u7/core/infra';
import type { UserFacade } from '@u7/user/domain';
import type { AbandonQuestionnaireCmdMeta } from './questionnaire/commands/abandon-questionnaire-cmd';
import type { GetQuestionnaireCmdMeta } from './questionnaire/commands/get-questionnaire-cmd';
import type { ListQuestionnairesByUserCmdMeta } from './questionnaire/commands/list-questionnaires-by-user-cmd';
import type { StartQuestionnaireCmdMeta } from './questionnaire/commands/start-questionnaire-cmd';
import type { SubmitAnswerCmdMeta } from './questionnaire/commands/submit-answer-cmd';
import type { QuestionPoolService } from './questionnaire/question-pool-service';
import type { QuestionnaireRepo } from './questionnaire/repo';

export type OnboardingUcMetas =
  | AbandonQuestionnaireCmdMeta
  | GetQuestionnaireCmdMeta
  | ListQuestionnairesByUserCmdMeta
  | StartQuestionnaireCmdMeta
  | SubmitAnswerCmdMeta;

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
  /** Коды вопросов, включённых в текущую анкету (подмножество пула) */
  includedQuestionCodes: string[];
  userFacade: UserFacade;
  db: BaseJsonDb;
}
