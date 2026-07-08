/**
 * _app-factory.ts — общая фабрика для скриптов распространения.
 *
 * ## Назначение
 * Создаёт полный стек ApiApp так же, как это делает реальное приложение бота.
 * Каждый скрипт получает готовый `app` и работает только через
 * `app.execute(useCase, ...)` — это гарантирует, что скрипт одновременно
 * является интеграционным тестом всего стека:
 *   - ModuleJsonRepo, LessonJsonRepo, StepJsonRepo
 *   - UserJsonRepo → UserApiModule → UserInProcFacade
 *   - CourseApiModule со всеми use-case'ами
 *   - Visibility-политики (ModuleAr.getVisibleFor, LessonAr.getVisibleFor)
 *   - safeConvert (форматирование Markdown → Telegram MarkdownV2)
 *
 * ## Требования к данным
 * Для работы скриптов через API необходимы:
 *   - `data/users/users.json` — минимум один пользователь с ролью ADMIN
 *     (NUR_UUID). Создаётся вручную, если отсутствует.
 *   - `data/courses/modules.json` — все модули и проекты должны иметь
 *     валидный статус: `draft`, `published` или `archived`.
 *     `CourseDs.buildSnapshot` включает только published-проекты.
 *   - `data/courses/lessons.json` — уроки с валидными status и stepIds.
 *   - `data/courses/steps.json` — шаги с kind: text/code/file.
 *
 * ## Использование
 * ```ts
 * import { createApp } from './_app-factory';
 * const app = createApp();
 * const modules = await app.execute('list-modules', {});
 * ```
 *
 * ## Примечание
 * NUR_UUID — автор-ментор, от имени которого выполняются запросы.
 * Для скриптов это всегда администратор с полным доступом.
 */
import { ApiApp } from '@u7-scl/core/api';
import type { AppMeta } from '@u7-scl/core/domain';
import { type Logger, LogLevel } from '@u7-scl/core/shared';
import { CourseApiModule } from '../packages/course/src/api/module.ts';
import type { CourseApiModuleMeta } from '../packages/course/src/domain/module.ts';
import { CourseJsonRepo } from '../packages/course/src/infra/db/course-json-repo.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import type { UserApiModuleMeta } from '../packages/user/src/domain/module.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/user/src/infra/user-in-proc-facade.ts';

/** UUID автора-ментора (Нур) */
export const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';

/** No-op логгер для подавления служебных логов API-модулей */
const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  setLogLevel: () => {},
  getLogLevel: () => LogLevel.INFO,
  setSourceLevel: () => {},
};

/** Метаданные приложения для скриптов (course + user) */
interface ScriptAppMeta extends AppMeta {
  name: 'script-app';
  moduleMetas: CourseApiModuleMeta | UserApiModuleMeta;
}

/**
 * Создаёт полный экземпляр ApiApp, идентичный тому,
 * что используется в реальном приложении бота.
 *
 * @param silent — если true, служебные логи API-модулей подавляются
 *
 * Порядок сборки повторяет DI реального приложения:
 * 1. Infra-репозитории (JSON-файлы)
 * 2. UserApiModule + UserInProcFacade
 * 3. CourseApiModule (зависит от repos + userFacade)
 * 4. ApiApp регистрирует оба модуля и вызывает init()
 */
export function createApp(silent = false): ApiApp<ScriptAppMeta> {
  // appResolver для скрипта (без DI-контейнера)
  const appResolver = {
    logger: silent ? silentLogger : (console as unknown as Logger),
    mode: 'development' as const,
  };

  // Infra: репозитории
  const moduleRepo = new ModuleJsonRepo();
  const courseRepo = new CourseJsonRepo();
  const lessonRepo = new LessonJsonRepo();
  const stepRepo = new StepJsonRepo();
  const userRepo = new UserJsonRepo();

  // User-модуль
  const userModule = new UserApiModule({
    userRepo,
    appResolver,
  });
  const userFacade = new UserInProcFacade(userModule);

  // Course-модуль
  const courseModule = new CourseApiModule({
    moduleRepo,
    courseRepo,
    lessonRepo,
    stepRepo,
    userFacade,
    appResolver,
  });

  // ApiApp: регистрируем оба модуля
  const app = new ApiApp([userModule, courseModule]);
  app.init();

  return app;
}
