/**
 * call-uc — утилита для вызова UseCase из команднойчей строки.
 *
 * Собирает полный стек ApiApp со всеми модулями приложения
 * (user, course, stream, questionnaire, wish) — в том же порядке
 * и с теми же зависимостями, что и живое приложение бота
 * (apps/u7-bot/src/create-api-app.ts), но без Telegram-интерфейса.
 *
 * Использование:
 *   bun run scripts/call-uc.ts <usecase> '<json-params>' [actorId]
 *
 * Примеры:
 *   bun run scripts/call-uc.ts list-modules '{}'
 *   bun run scripts/call-uc.ts get-module '{"moduleId":"<uuid>"}'
 *   bun run scripts/call-uc.ts create-module '{"title":"Основы JS","description":"Описание"}'
 *   bun run scripts/call-uc.ts enrich-module '{"moduleId":"<uuid>","goal":"Цель","tags":["js"]}'
 *   bun run scripts/call-uc.ts get-questionnaires-by-user '{"userId":"<uuid>"}'
 *   bun run scripts/call-uc.ts get-current '{"userId":"<uuid>"}'
 *   bun run scripts/call-uc.ts create-course-wish '{"courseId":"<uuid>"}'
 *
 * ⚠️ Команды (не query) пишут в боевые JSON-файлы: перед изменяющими
 * вызовами убедись, что бот остановлен (pm2 stop u7-school-bot).
 *
 * По умолчанию авторизация: Nur (ADMIN + MENTOR).
 * actorId можно переопределить третьим аргументом.
 */

import { ApiApp } from '@u7-scl/core/api';
import {
  BaseJsonDb,
  InProcEventBus,
  InProcJobScheduler,
} from '@u7-scl/core/infra';
import type { Logger } from '@u7-scl/core/shared';
import { CourseApiModule } from '@u7-scl/course/api';
import type { CourseApiModuleResolver } from '@u7-scl/course/domain';
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
  QuestionnaireInProcFacade,
  QuestionnaireJsonRepo,
} from '@u7-scl/questionnaire/infra';
import type { StreamApiModuleResolver } from '@u7-scl/stream';
import {
  StreamApiModule,
  StreamJsonRepo,
  StudentJsonRepo,
} from '@u7-scl/stream';
import { UserApiModule } from '@u7-scl/user/api';
import type { UserApiModuleResolver } from '@u7-scl/user/domain';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import { WishApiModule } from '@u7-scl/wish/api';
import type { WishApiModuleResolver } from '@u7-scl/wish/domain';
import { WishJsonRepo } from '@u7-scl/wish/infra';

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';

function printHelp() {
  console.log(`
Использование:
  bun run scripts/call-uc.ts <usecase> '<json-params>' [actorId]

Параметры:
  usecase      — название use case (обязательно)
  json-params  — параметры в JSON (обязательно, можно '{}')
  actorId      — UUID пользователя (опционально, по умолчанию Nur)

Доступные модули: user, course, stream, questionnaire, wish.

Примеры:
  bun run scripts/call-uc.ts list-modules '{}'
  bun run scripts/call-uc.ts get-module '{"moduleId":"<uuid>"}'
  bun run scripts/call-uc.ts create-module '{"title":"Мой модуль","description":"Описание"}'
  bun run scripts/call-uc.ts enrich-module '{"moduleId":"<uuid>","goal":"Цель","tags":["js"]}'
  bun run scripts/call-uc.ts add-project   '{"moduleId":"<uuid>","title":"Проект 1"}'
  bun run scripts/call-uc.ts create-lesson '{"moduleId":"<uuid>","projectId":"<uuid>","title":"Урок 1","estimatedMinutes":30}'
  bun run scripts/call-uc.ts create-step   '{"moduleId":"<uuid>","lessonId":"<uuid>","description":"...","kind":"code","content":"..."}'
  bun run scripts/call-uc.ts publish-module '{"moduleId":"<uuid>"}'
  bun run scripts/call-uc.ts get-questionnaires-by-user '{"userId":"<uuid>"}'
  bun run scripts/call-uc.ts get-current '{"userId":"<uuid>"}'
  bun run scripts/call-uc.ts create-course-wish '{"courseId":"<uuid>"}'
  bun run scripts/call-uc.ts --help
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  const [ucName, paramsJson, actorIdOverride] = args;

  if (!ucName) {
    console.error('❌ Ошибка: не указан use case');
    printHelp();
    process.exit(1);
  }

  let params: Record<string, unknown>;
  try {
    params = paramsJson ? JSON.parse(paramsJson) : {};
  } catch {
    console.error('❌ Ошибка: параметры должны быть в формате JSON');
    console.error('   Получено:', paramsJson);
    process.exit(1);
  }

  const actorId = actorIdOverride || NUR_UUID;

  // ─── Инициализация (порядок как в create-api-app.ts) ────────
  const db = new BaseJsonDb();
  const appResolver = {
    logger: console as unknown as Logger,
    mode: 'development' as const,
    eventBus: new InProcEventBus(),
  };

  const userRepo = new UserJsonRepo('data/users/users.json', undefined, db);
  const streamRepo = new StreamJsonRepo('data/streams/streams.json');
  const studentRepo = new StudentJsonRepo('data/streams/students.json');

  const userModule = new UserApiModule({
    userRepo,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as UserApiModuleResolver);
  const userFacade = new UserInProcFacade(userModule);

  const moduleRepo = new ModuleJsonRepo('data/courses/modules.json');
  const lessonRepo = new LessonJsonRepo('data/courses/lessons.json');
  const stepRepo = new StepJsonRepo('data/courses/steps.json');
  const courseRepo = new CourseJsonRepo('data/courses/courses.json');

  const courseModule = new CourseApiModule({
    db,
    moduleRepo,
    courseRepo,
    lessonRepo,
    stepRepo,
    userFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as CourseApiModuleResolver);
  const courseFacade = new CourseInProcFacade(courseModule);

  const qRepo = new QuestionnaireJsonRepo(
    'data/questionnaires/questionnaires.json',
    db,
  );
  const questionnaireModule = new QuestionnaireApiModule({
    questionnaireRepo: qRepo,
    userFacade,
    db,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as QuestionnaireApiModuleResolver);
  const questionnaireFacade = new QuestionnaireInProcFacade(
    questionnaireModule,
  );

  const wishModule = new WishApiModule({
    wishRepo: new WishJsonRepo('data/wish/wishes.json'),
    courseFacade,
    questionnaireFacade,
    userFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as WishApiModuleResolver);

  const streamModule = new StreamApiModule({
    streamRepo,
    streamStudentRepo: studentRepo,
    userFacade,
    courseFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as StreamApiModuleResolver);

  const app = new ApiApp([
    userModule,
    wishModule,
    streamModule,
    courseModule,
    questionnaireModule,
  ]);

  // init() заполняет карты UC и подписки ER; start() НЕ вызываем —
  // таймеры job'ов в одноразовом скрипте не нужны (паттерн _app-factory)
  app.init(new InProcJobScheduler({ logger: console as unknown as Logger }));

  // ─── Вызов UseCase ────────────────────────────────
  try {
    const result = await app.execute(ucName, params, actorId);
    console.log(JSON.stringify(result, null, 2));
  } catch (e: unknown) {
    const err = e as {
      name?: string;
      message?: string;
      error?: { message?: string };
    };
    console.error('❌ Ошибка:', err.error?.message || err.message || String(e));
    process.exit(1);
  }
}

main();
