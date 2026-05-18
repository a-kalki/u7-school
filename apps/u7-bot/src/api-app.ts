import { ApiApp } from '@u7/core/api';
import type { Logger } from '@u7/core/shared';
import { BaseJsonDb } from '@u7/core/infra';
import type { OnboardingBotApp } from '@u7/onboarding';
import { OnboardingApiModule } from '@u7/onboarding';
import { QuestionPoolService } from '@u7/onboarding/domain';
import { QuestionnaireJsonRepo } from '@u7/onboarding/infra';
import { UserApiModule } from '@u7/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7/user/infra';
import type { BotConfig } from './config';

/**
 * Фабрика создания ApiApp и зависимостей для бота.
 * Возвращает apiApp (для контроллера) и userFacade (для бота).
 */
export function createApiApp(config: BotConfig, logger?: Logger) {
  const db = new BaseJsonDb();

  const userRepo = new UserJsonRepo(
    `${config.dbDir}/users/users.json`,
    `${config.dbDir}/users/seed.json`,
    db,
  );

  const questionnaireRepo = new QuestionnaireJsonRepo(
    `${config.dbDir}/questionnaires/questionnaires.json`,
    db,
  );

  // ══ QuestionPoolService: явная загрузка пула ══
  const rawPool = QuestionPoolService.loadDefaultPool();
  const poolService = new QuestionPoolService(rawPool, []);
  const allQuestionCodes = poolService.getAll().map((q) => q.questionCode);
  const activePoolService = new QuestionPoolService(rawPool, allQuestionCodes);

  // ══ Модули: резолвер в конструкторе ══
  const userModule = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userModule);

  const onboardingModule = new OnboardingApiModule({
    questionnaireRepo,
    questionPoolService: activePoolService,
    userFacade,
    db,
  });

  // ══ ApiApp: модули + опциональный логгер в конструкторе ══
  const apiApp = new ApiApp(
    [userModule, onboardingModule],
    logger,
  ) as OnboardingBotApp;

  return {
    apiApp,
    userFacade,
    userRepo,
    questionnaireRepo,
    poolService: activePoolService,
  };
}
