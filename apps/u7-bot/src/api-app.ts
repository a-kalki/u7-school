import { ApiApp } from '@u7-scl/core/api';
import { BaseJsonDb } from '@u7-scl/core/infra';
import { ConsoleLogger } from '@u7-scl/core/shared';
import type { Logger } from '@u7-scl/core/shared';
import type { OnboardingBotApp } from '@u7-scl/onboarding';
import { OnboardingApiModule, QuestionPoolService } from '@u7-scl/onboarding';
import { QuestionnaireJsonRepo } from '@u7-scl/onboarding/infra';
import {
  StreamApiModule,
  StreamJsonRepo,
  StudentJsonRepo,
} from '@u7-scl/stream';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import { UserApiModule } from '@u7-scl/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import type { BotConfig } from './config';

/**
 * Фабрика создания ApiApp и зависимостей для бота.
 * Возвращает apiApp (для контроллера) и userFacade (для бота).
 */
export function createApiApp(config: BotConfig, logger?: Logger) {
  const db = new BaseJsonDb();

  const appLogger = logger ?? new ConsoleLogger();
  const appResolver = { logger: appLogger, mode: 'development' as const };

  const userRepo = new UserJsonRepo(
    `${config.dbDir}/users/users.json`,
    `${config.dbDir}/users/seed.json`,
    db,
  );

  const questionnaireRepo = new QuestionnaireJsonRepo(
    `${config.dbDir}/questionnaires/questionnaires.json`,
    db,
  );

  const streamRepo = new StreamJsonRepo(`${config.dbDir}/streams/streams.json`);
  const streamStudentRepo = new StudentJsonRepo(
    `${config.dbDir}/streams/students.json`,
  );

  // ══ QuestionPoolService: явная загрузка пула ══
  const rawPool = QuestionPoolService.loadDefaultPool();
  const poolService = new QuestionPoolService(rawPool, []);
  const allQuestionCodes = poolService.getAll().map((q) => q.questionCode);
  const activePoolService = new QuestionPoolService(rawPool, allQuestionCodes);

  // ══ Модули: резолвер в конструкторе ══
  const userModule = new UserApiModule({ userRepo, appResolver });
  const userFacade = new UserInProcFacade(userModule);

  const onboardingModule = new OnboardingApiModule({
    questionnaireRepo,
    questionPoolService: activePoolService,
    userFacade,
    db,
    appResolver,
  });

  const streamModule = new StreamApiModule({
    streamRepo,
    streamStudentRepo,
    userFacade,
    courseFacade: { getModuleSnapshot: async () => [] },
    appResolver,
  });

  const streamController = new StreamController(streamModule);

  // ══ ApiApp: модули ══
  const apiApp: OnboardingBotApp = new ApiApp(
    [userModule, onboardingModule, streamModule],
  );

  return {
    apiApp,
    userFacade,
    userRepo,
    questionnaireRepo,
    poolService: activePoolService,
    streamModule,
    streamController,
  };
}
