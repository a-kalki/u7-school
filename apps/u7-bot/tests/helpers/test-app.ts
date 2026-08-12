import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import { ApiApp } from '@u7-scl/core/api';
import { BaseJsonDb, InProcEventBus } from '@u7-scl/core/infra';
import { ConsoleLogger } from '@u7-scl/core/shared';
import type { BotController } from '@u7-scl/core/ui';
import { UiApp } from '@u7-scl/core/ui';
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
  /** API модуля stream (для создания StreamsController) */
  streamModule: StreamApiModule;
  /** API модуля курсов (для создания CoursesController) */
  courseModule: CourseApiModule;
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

  const tgFacade = new MockTgFacade();

  const streamModule = new StreamApiModule({
    streamRepo,
    streamStudentRepo: studentRepo,
    userFacade,
    courseFacade,
    tgFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  });

  // ══ ApiApp: все модули ══
  const apiApp: U7BotApp = new ApiApp([userModule, courseModule, streamModule]);

  // Каскадная инициализация: ApiApp → модули
  apiApp.init();

  return {
    apiApp,
    streamModule,
    courseModule,
    userFacade,
    courseFacade,
    tgFacade,
    fixtures,
    cleanup: () => cleanupFixtures(fixtures),
  };
}

/**
 * Обёртка над UiApp для тестов — эмулирует BotTransport.prefixResponse.
 *
 * В продакшене BotTransport добавляет префикс контроллера к кнопкам.
 * Тесты используют UiApp напрямую, поэтому префикс добавляется здесь.
 */
export class TestBotUiApp {
  constructor(private readonly uiApp: UiApp) {}

  get size(): number {
    return this.uiApp.size;
  }

  getController(name: string) {
    return this.uiApp.getController(name);
  }

  async collectMainMenu(actor: any) {
    return this.uiApp.collectMainMenu(actor);
  }

  async collectHelp(actor: any) {
    return this.uiApp.collectHelp(actor);
  }

  async collectAllMenuItems(actor: any) {
    return this.uiApp.collectAllMenuItems(actor);
  }

  async collectAllHelpDescriptions(actor: any) {
    return this.uiApp.collectAllHelpDescriptions(actor);
  }

  async handleWelcome(tgId: number) {
    const res = await this.uiApp.handleWelcome(tgId);
    return this.#prefix('app', res);
  }

  async handleHelp(tgId: number) {
    const res = await this.uiApp.handleHelp(tgId);
    return this.#prefix('app', res);
  }

  async handleCallback(data: string, tgId: number, session: any) {
    const ctrlName = data.split(':')[0] ?? '';
    const res = await this.uiApp.handleCallback(data, tgId, session);
    return this.#prefix(ctrlName, res);
  }

  async handleMessage(update: any, tgId: number, session: any) {
    const activeHandler = session?.activeHandler;
    const ctrlName = activeHandler
      ? (activeHandler.path.split('/')[0] ?? '')
      : '';
    const res = await this.uiApp.handleMessage(update, tgId, session);
    if (res === null) return null;
    return this.#prefix(ctrlName, res);
  }

  async handleCancel(tgId: number, session: any) {
    const activeHandler = session?.activeHandler;
    const ctrlName = activeHandler
      ? (activeHandler.path.split('/')[0] ?? '')
      : '';
    const res = await this.uiApp.handleCancel(tgId, session);
    if (res === null) return null;
    return this.#prefix(ctrlName, res);
  }

  async handleTimeout(tgId: number, session: any) {
    const activeHandler = session?.activeHandler;
    const ctrlName = activeHandler
      ? (activeHandler.path.split('/')[0] ?? '')
      : '';
    const res = await this.uiApp.handleTimeout(tgId, session);
    if (res === null) return null;
    return this.#prefix(ctrlName, res);
  }

  #prefix(controllerName: string, response: any): any {
    if (!controllerName) return response;
    const prefixCode = (code: string): string => {
      if (code.startsWith(`${controllerName}:`)) return code;
      for (const knownPrefix of [
        'app:',
        'stream:',
        'course:',
        'onboarding:',
        'learning:',
        'mentor:',
        'questionnaire:',
      ]) {
        if (code.startsWith(knownPrefix)) return code;
      }
      return `${controllerName}:${code}`;
    };

    const prefixKeyboard = (kb: any): any => {
      if (!kb) return kb;
      return {
        ...kb,
        rows: kb.rows.map((row: any) =>
          row.map((btn: any) => ({
            ...btn,
            code: prefixCode(btn.code),
          })),
        ),
      };
    };

    const result: any = { ...response };
    if (result.sendMessage?.keyboard) {
      result.sendMessage = {
        ...result.sendMessage,
        keyboard: prefixKeyboard(result.sendMessage.keyboard),
      };
    }
    if (result.sendMessages) {
      result.sendMessages = result.sendMessages.map((sm: any) => ({
        ...sm,
        keyboard: prefixKeyboard(sm.keyboard),
      }));
    }
    if (result.editMessage?.keyboard) {
      result.editMessage = {
        ...result.editMessage,
        keyboard: prefixKeyboard(result.editMessage.keyboard),
      };
    }
    return result;
  }
}

/**
 * Создаёт инициализированный UiApp для тестов.
 *
 * Инкапсулирует рутину, которую раньше каждый тест делал вручную:
 *   new UiApp([controllers]) + uiApp.init(apiApp).
 *
 * @param app — результат createTestApp()
 * @param controllers — один или несколько контроллеров
 * @returns обёртка TestBotUiApp (совместима с UiApp по интерфейсу)
 */
export function createTestUiApp(
  app: TestApp,
  controllers: BotController[],
): TestBotUiApp {
  const uiApp = new UiApp(controllers);
  uiApp.init(app.apiApp, (tgId: number) =>
    app.userFacade.getUserByTelegramId(tgId),
  );
  return new TestBotUiApp(uiApp);
}
