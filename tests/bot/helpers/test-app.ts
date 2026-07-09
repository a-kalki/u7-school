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
import type { TgFacade } from '@u7-scl/stream/domain';
import { UserApiModule } from '@u7-scl/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import type { FixturePaths } from './fixture-loader';
import { cleanupFixtures, loadFixtures } from './fixture-loader';

/** Подставной TgFacade для тестов — записывает вызовы sendMessage */
export class MockTgFacade implements TgFacade {
  calls: { telegramId: number; text: string }[] = [];

  async sendMessage(telegramId: number, text: string): Promise<void> {
    this.calls.push({ telegramId, text });
  }

  async sendBatch(telegramIds: number[], text: string): Promise<void> {
    for (const id of telegramIds) {
      this.calls.push({ telegramId: id, text });
    }
  }

  reset(): void {
    this.calls = [];
  }
}

export interface TestApp {
  /** Полноценный ApiApp со всеми модулями */
  apiApp: U7BotApp;
  /** API модуля stream (для создания StreamController) */
  streamModule: StreamApiModule;
  /** Фасад пользователей (для получения тестовых акторов) */
  userFacade: UserInProcFacade;
  /** Фасад курсов */
  courseFacade: CourseInProcFacade;
  /** Подставной tgFacade с записью вызовов */
  tgFacade: MockTgFacade;
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

  const tgFacade = new MockTgFacade();

  const streamModule = new StreamApiModule({
    streamRepo,
    streamStudentRepo: studentRepo,
    userFacade,
    courseFacade,
    tgFacade,
    appResolver,
  });

  // ══ ApiApp: все модули ══
  const apiApp: U7BotApp = new ApiApp([userModule, courseModule, streamModule]);

  return {
    apiApp,
    streamModule,
    userFacade,
    courseFacade,
    tgFacade,
    fixtures,
    cleanup: () => cleanupFixtures(fixtures),
  };
}
