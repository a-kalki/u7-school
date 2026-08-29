import { ApiApp } from '@u7-scl/core/api';
import type { EventBus } from '@u7-scl/core/domain';
import {
  BaseJsonDb,
  InProcEventBus,
  InProcJobScheduler,
  JobRunJsonRepo,
} from '@u7-scl/core/infra';
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
import { QuestionnaireApiModule } from '@u7-scl/questionnaire/api';
import type { QuestionnaireApiModuleResolver } from '@u7-scl/questionnaire/domain';
import {
  QuestionnaireJsonRepo as QJsonRepo,
  QuestionnaireInProcFacade,
} from '@u7-scl/questionnaire/infra';
import {
  StreamApiModule,
  StreamJsonRepo,
  StudentJsonRepo,
} from '@u7-scl/stream';
import { UserApiModule } from '@u7-scl/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import { WishApiModule } from '@u7-scl/wish/api';
import type { WishApiModuleResolver } from '@u7-scl/wish/domain';
import { WishJsonRepo } from '@u7-scl/wish/infra';
import type { BotConfig } from './config';
import type { U7BotAppMeta } from './core/u7-bot-app-meta';

/**
 * Результат фабрики ApiApp — только доменный слой.
 */
export interface ApiAppBundle {
  apiApp: ApiApp<U7BotAppMeta>;
  eventBus: EventBus;
  userFacade: UserInProcFacade;
  userRepo: UserJsonRepo;
  questionnaireFacade: QuestionnaireInProcFacade;
  questionnaireModule: QuestionnaireApiModule;
  streamModule: StreamApiModule;
  courseModule: CourseApiModule;
  wishModule: WishApiModule;
}

/**
 * Создаёт ApiApp и все доменные зависимости (модули, репозитории, фасады).
 *
 * НЕ создаёт контроллеры — это ответственность createUiApp().
 */
export function createApiApp(config: BotConfig, logger: Logger): ApiAppBundle {
  const db = new BaseJsonDb();

  const appLogger = logger ?? new ConsoleLogger();
  const appResolver = {
    logger: appLogger,
    mode: 'development' as const,
    eventBus: new InProcEventBus(),
  };

  const userRepo = new UserJsonRepo(
    `${config.dbDir}/users/users.json`,
    `${config.dbDir}/users/seed.json`,
    db,
  );

  const streamRepo = new StreamJsonRepo(`${config.dbDir}/streams/streams.json`);
  const streamStudentRepo = new StudentJsonRepo(
    `${config.dbDir}/streams/students.json`,
  );

  // ══ Модули: резолвер в конструкторе ══
  const userModule = new UserApiModule({
    userRepo,
    appResolver,
    eventBus: appResolver.eventBus,
  });
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
    eventBus: appResolver.eventBus,
  });

  const courseFacade = new CourseInProcFacade(courseModule);

  // ══ Questionnaire: модуль и фасад ══
  const qRepo = new QJsonRepo(
    `${config.dbDir}/questionnaires/q-questionnaires.json`,
    db,
  );

  const questionnaireResolver: QuestionnaireApiModuleResolver = {
    questionnaireRepo: qRepo,
    userFacade,
    db,
    appResolver,
    eventBus: appResolver.eventBus,
  };

  const questionnaireModule = new QuestionnaireApiModule(questionnaireResolver);

  const questionnaireFacade = new QuestionnaireInProcFacade(
    questionnaireModule,
  );

  // ══ Wish: репозиторий и модуль ══
  const wishRepo = new WishJsonRepo(`${config.dbDir}/wish/wishes.json`);

  const wishResolver: WishApiModuleResolver = {
    wishRepo,
    courseFacade,
    questionnaireFacade,
    userFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  };

  const wishModule = new WishApiModule(wishResolver);

  const streamModule = new StreamApiModule({
    streamRepo,
    streamStudentRepo,
    userFacade,
    courseFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  });

  // ══ ApiApp: модули ══
  const apiApp = new ApiApp<U7BotAppMeta>([
    userModule,
    wishModule,
    streamModule,
    courseModule,
    questionnaireModule,
  ]);

  // Планировщик — техническая зависимость: передаётся через init(),
  // lastRunAt персистится — задания переживают перезагрузку (misfire-политика).
  apiApp.init(
    new InProcJobScheduler({
      logger: appLogger,
      store: new JobRunJsonRepo(`${config.dbDir}/jobs/last-runs.json`),
    }),
  );

  return {
    apiApp,
    eventBus: appResolver.eventBus,
    userFacade,
    userRepo,
    questionnaireFacade,
    questionnaireModule,
    streamModule,
    courseModule,
    wishModule,
  };
}
