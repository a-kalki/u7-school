import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import { ApiApp } from '@u7-scl/core/api';
import {
  BaseJsonDb,
  InProcEventBus,
  InProcJobScheduler,
} from '@u7-scl/core/infra';
import { ConsoleLogger } from '@u7-scl/core/shared';
import { CourseApiModule } from '@u7-scl/course/api';
import {
  CourseInProcFacade,
  CourseJsonRepo,
  LessonJsonRepo,
  ModuleJsonRepo,
  StepJsonRepo,
} from '@u7-scl/course/infra';
import {
  PeerReviewApiModule,
  ReviewCampaignJsonRepo,
  ReviewJsonRepo,
} from '@u7-scl/peer-review';
import { QuestionnaireApiModule } from '@u7-scl/questionnaire/api';
import type { QuestionnaireApiModuleResolver } from '@u7-scl/questionnaire/domain';
import {
  QuestionnaireJsonRepo as QJsonRepo,
  QuestionnaireInProcFacade,
} from '@u7-scl/questionnaire/infra';
import {
  StreamApiModule,
  StreamInProcFacade,
  StreamJsonRepo,
  StudentJsonRepo,
} from '@u7-scl/stream';
import { UserApiModule } from '@u7-scl/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import { WishApiModule } from '@u7-scl/wish/api';
import type { WishApiModuleResolver } from '@u7-scl/wish/domain';
import { WishJsonRepo } from '@u7-scl/wish/infra';
import type { FixturePaths } from './fixture-loader';
import { cleanupFixtures, loadFixtures } from './fixture-loader';

export interface TestApp {
  /** Полноценный ApiApp со всеми модулями */
  apiApp: U7BotApp;
  /** API модуля stream (для создания StreamsController) */
  streamModule: StreamApiModule;
  /** API модуля курсов (для создания CoursesController) */
  courseModule: CourseApiModule;
  /** Общая шина событий (та же, что внутри apiApp) — для TestBotTransport */
  eventBus: InProcEventBus;
  /** Репозиторий желаний — для проверки статусов в тестах */
  wishRepo: WishJsonRepo;
  /** Репозиторий кампаний peer-review — проверка создания кампаний ER */
  reviewCampaignRepo: ReviewCampaignJsonRepo;
  /** Репозиторий отзывов peer-review — проверка сохранённых отзывов UC */
  reviewRepo: ReviewJsonRepo;
  /** Фасад пользователей (для получения тестовых акторов) */
  userFacade: UserInProcFacade;
  /** Фасад курсов */
  courseFacade: CourseInProcFacade;
  /** Пути к временным фикстурам */
  fixtures: FixturePaths;
  /** Удаляет временную директорию с фикстурами */
  cleanup: () => Promise<void>;
}

/**
 * Создаёт полноценный ApiApp с реальными модулями и временными JSON-репозиториями.
 * Зеркалирует структуру createApiApp() из apps/u7-bot/src/api-app.ts,
 * но использует временные файлы фикстур вместо постоянных.
 *
 * @param tag — метка для временной директории (обычно имя describe-блока)
 */
export async function createTestApp(tag?: string): Promise<TestApp> {
  const fixtures = await loadFixtures(tag);
  const db = new BaseJsonDb();
  const logger = new ConsoleLogger();
  const appResolver = {
    logger,
    mode: 'development' as const,
    eventBus: new InProcEventBus(),
  };

  // ══ Репозитории с временными файлами ══
  // UserJsonRepo: передаём seedPath = '' — seed уже загружен в сам файл users.json
  const userRepo = new UserJsonRepo(fixtures.users, '', db);

  const streamRepo = new StreamJsonRepo(fixtures.streams);
  const studentRepo = new StudentJsonRepo(fixtures.students);

  const moduleRepo = new ModuleJsonRepo(fixtures.courses.modules);
  const lessonRepo = new LessonJsonRepo(fixtures.courses.lessons);
  const stepRepo = new StepJsonRepo(fixtures.courses.steps);

  // ══ Модули ══
  const userModule = new UserApiModule({
    userRepo,
    appResolver,
    eventBus: appResolver.eventBus,
  });
  const userFacade = new UserInProcFacade(userModule);

  const courseRepo = new CourseJsonRepo(fixtures.courses.courses);

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

  const streamModule = new StreamApiModule({
    streamRepo,
    streamStudentRepo: studentRepo,
    userFacade,
    courseFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  });

  const streamFacade = new StreamInProcFacade(streamModule);

  // ══ Questionnaire: модуль и фасад (зеркально create-api-app.ts) ══
  const qRepo = new QJsonRepo(
    `${fixtures.dbDir}/questionnaires/questionnaires.json`,
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
  const wishRepo = new WishJsonRepo(`${fixtures.dbDir}/wish/wishes.json`);

  const wishResolver: WishApiModuleResolver = {
    wishRepo,
    courseFacade,
    streamFacade,
    questionnaireFacade,
    userFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  };

  const wishModule = new WishApiModule(wishResolver);

  // ══ Peer-review: репозитории и модуль (зеркально create-api-app.ts) ══
  // Общий eventBus — ER создания кампании подписан на события судьбы студента
  // в module.init() ниже (apiApp.init).
  const reviewCampaignRepo = new ReviewCampaignJsonRepo(
    fixtures.peerReview.campaigns,
  );
  const reviewRepo = new ReviewJsonRepo(fixtures.peerReview.reviews);

  const peerReviewModule = new PeerReviewApiModule({
    reviewCampaignRepo,
    reviewRepo,
    streamFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  });

  // ══ ApiApp: все модули (состав как в боевом create-api-app.ts) ══
  const apiApp: U7BotApp = new ApiApp([
    userModule,
    wishModule,
    streamModule,
    courseModule,
    questionnaireModule,
    peerReviewModule,
  ]);

  apiApp.init(new InProcJobScheduler({ logger }));

  return {
    apiApp,
    streamModule,
    courseModule,
    eventBus: appResolver.eventBus,
    wishRepo,
    reviewCampaignRepo,
    reviewRepo,
    userFacade,
    courseFacade,
    fixtures,
    cleanup: () => cleanupFixtures(fixtures),
  };
}
