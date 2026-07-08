import type { U7BotApp } from '@u7-scl/app/domain';
import { ApiApp } from '@u7-scl/core/api';
import { BaseJsonDb } from '@u7-scl/core/infra';
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
  StreamApiModule,
  StreamJsonRepo,
  StudentJsonRepo,
} from '@u7-scl/stream';
import { UserApiModule } from '@u7-scl/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import type { FixturePaths } from './fixture-loader';
import { cleanupFixtures, loadFixtures } from './fixture-loader';

export interface TestApp {
  /** Полноценный ApiApp со всеми модулями */
  apiApp: U7BotApp;
  /** API модуля stream (для создания StreamController) */
  streamModule: StreamApiModule;
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
  const appResolver = { logger, mode: 'development' as const };

  // ══ Репозитории с временными файлами ══
  // UserJsonRepo: передаём seedPath = '' — seed уже загружен в сам файл users.json
  const userRepo = new UserJsonRepo(fixtures.users, '', db);

  const streamRepo = new StreamJsonRepo(fixtures.streams);
  const studentRepo = new StudentJsonRepo(fixtures.students);

  const moduleRepo = new ModuleJsonRepo(fixtures.courses.modules);
  const lessonRepo = new LessonJsonRepo(fixtures.courses.lessons);
  const stepRepo = new StepJsonRepo(fixtures.courses.steps);

  // ══ Модули ══
  const userModule = new UserApiModule({ userRepo, appResolver });
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
  });
  const courseFacade = new CourseInProcFacade(courseModule);

  const streamModule = new StreamApiModule({
    streamRepo,
    streamStudentRepo: studentRepo,
    userFacade,
    courseFacade,
    appResolver,
  });

  // ══ ApiApp: все модули ══
  const apiApp: U7BotApp = new ApiApp([userModule, courseModule, streamModule]);

  return {
    apiApp,
    streamModule,
    userFacade,
    courseFacade,
    fixtures,
    cleanup: () => cleanupFixtures(fixtures),
  };
}
