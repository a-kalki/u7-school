import { AppController } from '@u7-scl/bot/app/app-controller';
import { ApiApp } from '@u7-scl/core/api';
import { BaseJsonDb } from '@u7-scl/core/infra';
import type { Logger } from '@u7-scl/core/shared';
import { ConsoleLogger } from '@u7-scl/core/shared';
import { CourseApiModule } from '@u7-scl/course/api';
import {
  CourseInProcFacade,
  CourseJsonRepo,
  LessonJsonRepo,
  ModuleJsonRepo,
  StepJsonRepo,
} from '@u7-scl/course/infra';
import { CourseController } from '@u7-scl/course/ui';
import {
  OnboardingApiModule,
  OnboardingController,
  QuestionPoolService,
} from '@u7-scl/onboarding';
import { QuestionnaireJsonRepo } from '@u7-scl/onboarding/infra';
import {
  StreamApiModule,
  StreamJsonRepo,
  StudentJsonRepo,
} from '@u7-scl/stream';
import type { TgFacade } from '@u7-scl/stream/domain';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import { UserApiModule } from '@u7-scl/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import type { BotConfig } from './config';
import type { U7BotAppMeta } from './u7-bot-app-meta';
import { U7BotUiApp } from './ui-app';

/**
 * Результат фабрики ApiApp — только доменный слой.
 */
export interface ApiAppBundle {
  apiApp: ApiApp<U7BotAppMeta>;
  userFacade: UserInProcFacade;
  userRepo: UserJsonRepo;
  questionnaireRepo: QuestionnaireJsonRepo;
  poolService: QuestionPoolService;
  streamModule: StreamApiModule;
  courseModule: CourseApiModule;
  onboardingModule: OnboardingApiModule;
}

/**
 * Создаёт ApiApp и все доменные зависимости (модули, репозитории, фасады).
 *
 * НЕ создаёт контроллеры — это ответственность
 * createUiApp() / U7BotUiApp.
 */
export function createApiApp(
  config: BotConfig,
  logger: Logger,
  tgFacade: TgFacade,
): ApiAppBundle {
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

  // ══ Course: репозитории, модуль и фасад ══
  const moduleRepo = new ModuleJsonRepo(`${config.dbDir}/courses/modules.json`);
  const lessonRepo = new LessonJsonRepo(`${config.dbDir}/courses/lessons.json`);
  const stepRepo = new StepJsonRepo(`${config.dbDir}/courses/steps.json`);

  const courseRepo = new CourseJsonRepo(`${config.dbDir}/courses/courses.json`);

  const courseModule = new CourseApiModule({
    db,
    moduleRepo,
    courseRepo,
    lessonRepo,
    stepRepo,
    userFacade,
    appResolver,
  });

  const courseFacade = new CourseInProcFacade(courseModule);

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
    courseFacade,
    tgFacade,
    appResolver,
  });

  // ══ ApiApp: модули ══
  const apiApp = new ApiApp<U7BotAppMeta>([
    userModule,
    onboardingModule,
    streamModule,
    courseModule,
  ]);

  // Каскадная инициализация: ApiApp → модули
  apiApp.init();

  return {
    apiApp,
    userFacade,
    userRepo,
    questionnaireRepo,
    poolService: activePoolService,
    streamModule,
    courseModule,
    onboardingModule,
  };
}

/**
 * Результат фабрики UiApp — UI-слой бота.
 */
export interface UiAppBundle {
  uiApp: U7BotUiApp;
  appController: AppController;
  onboardingController: OnboardingController;
  streamController: StreamController;
  courseController: CourseController;
}

/**
 * Создаёт U7BotUiApp и все контроллеры.
 *
 * Получает модули из ApiAppBundle, создаёт контроллеры,
 * собирает их в U7BotUiApp и выполняет каскадную инициализацию.
 */
export function createUiApp(
  apiApp: ApiApp<U7BotAppMeta>,
  _bundle: ApiAppBundle,
  config: BotConfig,
): UiAppBundle {
  const onboardingController = new OnboardingController();
  const streamController = new StreamController();
  const courseController = new CourseController();
  const appController = new AppController(config.schoolGroupUrl);

  const uiApp = new U7BotUiApp([
    appController,
    onboardingController,
    streamController,
    courseController,
  ]);

  // Каскадная инициализация: ApiApp → контроллеры → стори → UiRegistry → ui
  uiApp.init(apiApp);

  // Передаём MenuAggregator в AppController (сам UiApp реализует MenuAggregator)
  appController.initMenuAggregator(uiApp);

  return {
    uiApp,
    appController,
    onboardingController,
    streamController,
    courseController,
  };
}
