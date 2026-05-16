import { ApiApp } from '@u7/core/api';
import { BaseJsonDb } from '@u7/core/infra';
import type { OnboardingBotApp } from '@u7/onboarding';
import { OnboardingApiModule, OnboardingController } from '@u7/onboarding';
import { QuestionPoolService } from '@u7/onboarding/domain';
import { QuestionnaireJsonRepo } from '@u7/onboarding/infra';
import { UserApiModule } from '@u7/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7/user/infra';
import type { BotConfig } from './config';

/**
 * Фабрика создания ApiApp и зависимостей для бота.
 */
export function createApiApp(config: BotConfig) {
  const db = new BaseJsonDb();

  const userRepo = new UserJsonRepo(
    `${config.dbDir}/users/users.json`,
    `${config.dbDir}/users/seed.json`,
    db,
  );
  const questionnaireRepo = new QuestionnaireJsonRepo(
    `${config.dbDir}/questionnaires.json`,
    db,
  );

  const poolService = new QuestionPoolService();

  const userModule = new UserApiModule();
  userModule.init({ userRepo });

  const userFacade = new UserInProcFacade(userModule);

  const onboardingModule = new OnboardingApiModule();
  const allQuestionCodes = poolService.getAll().map((q) => q.questionCode);
  const activePoolService = new QuestionPoolService(undefined, allQuestionCodes);

  onboardingModule.init({
    questionnaireRepo,
    questionPoolService: activePoolService,
    userFacade,
    db,
  });

  const apiApp = new ApiApp() as unknown as OnboardingBotApp;
  apiApp.register(userModule);
  apiApp.register(onboardingModule);

  return { apiApp, userRepo, questionnaireRepo, poolService: activePoolService, userModule };
}
