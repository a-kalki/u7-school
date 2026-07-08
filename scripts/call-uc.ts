/**
 * call-uc — утилита для вызова UseCase из командной строки.
 *
 * Использование:
 *   bun run scripts/call-uc.ts <usecase> '<json-params>' [actorId]
 *
 * Примеры:
 *   bun run scripts/call-uc.ts list-modules '{}'
 *   bun run scripts/call-uc.ts create-module '{"title":"Основы JS","description":"Описание"}'
 *   bun run scripts/call-uc.ts enrich-module '{"moduleId":"<uuid>","goal":"Цель","tags":["js"]}'
 *   bun run scripts/call-uc.ts add-project   '{"moduleId":"<uuid>","title":"Проект 1"}'
 *   bun run scripts/call-uc.ts create-lesson '{"moduleId":"<uuid>","projectId":"<uuid>","title":"Урок 1","estimatedMinutes":30}'
 *   bun run scripts/call-uc.ts create-step   '{"moduleId":"<uuid>","lessonId":"<uuid>","description":"...","kind":"code","content":"..."}'
 *   bun run scripts/call-uc.ts publish-module '{"moduleId":"<uuid>"}'
 *   bun run scripts/call-uc.ts get-module '{"moduleId":"<uuid>"}'
 *
 * По умолчанию авторизация: Nur (ADMIN + MENTOR).
 * actorId можно переопределить третьим аргументом.
 */

import { ApiApp } from '@u7-scl/core/api';
import type { Logger } from '@u7-scl/core/shared';
import { CourseApiModule } from '../packages/course/src/api/module.ts';
import type { CourseApiModuleResolver } from '../packages/course/src/domain/module.ts';
import { CourseInProcFacade } from '../packages/course/src/infra/course-in-proc-facade.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { StreamApiModule } from '../packages/stream/src/api/module.ts';
import type { StreamApiModuleResolver } from '../packages/stream/src/domain/module.ts';
import { StreamJsonRepo } from '../packages/stream/src/infra/db/stream-json-repo.ts';
import { StudentJsonRepo } from '../packages/stream/src/infra/db/student-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import type { UserApiModuleResolver } from '../packages/user/src/domain/module.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/user/src/infra/user-in-proc-facade.ts';

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';

function printHelp() {
  console.log(`
Использование:
  bun run scripts/call-uc.ts <usecase> '<json-params>' [actorId]

Параметры:
  usecase      — название use case (обязательно)
  json-params  — параметры в JSON (обязательно, можно '{}')
  actorId      — UUID пользователя (опционально, по умолчанию Nur)

Примеры:
  bun run scripts/call-uc.ts list-modules '{}'
  bun run scripts/call-uc.ts create-module '{"title":"Мой модуль","description":"Описание"}'
  bun run scripts/call-uc.ts enrich-module '{"moduleId":"<uuid>","goal":"Цель","tags":["js"]}'
  bun run scripts/call-uc.ts get-module '{"moduleId":"<uuid>"}'
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

  // ─── Инициализация ────────────────────────────────
  const moduleRepo = new ModuleJsonRepo();
  const lessonRepo = new LessonJsonRepo();
  const stepRepo = new StepJsonRepo();
  const userRepo = new UserJsonRepo();
  const streamRepo = new StreamJsonRepo('data/streams/streams.json');
  const studentRepo = new StudentJsonRepo('data/streams/students.json');

  // Фейковый appResolver для скрипта (без DI-контейнера)
  const fakeAppResolver = {
    logger: console as unknown as Logger,
    mode: 'development' as const,
  };

  const userModule = new UserApiModule({
    userRepo,
    appResolver: fakeAppResolver,
  } as unknown as UserApiModuleResolver);
  const userFacade = new UserInProcFacade(userModule);

  const courseResolve = {
    moduleRepo,
    courseRepo: {
      save: async () => {},
      getByUuid: async () => undefined,
      getAll: async () => [],
    },
    lessonRepo,
    stepRepo,
    userFacade,
    appResolver: fakeAppResolver,
  };

  const courseModule = new CourseApiModule(
    courseResolve as unknown as CourseApiModuleResolver,
  );
  const courseFacade = new CourseInProcFacade(courseModule);

  const streamModule = new StreamApiModule({
    streamRepo,
    streamStudentRepo: studentRepo,
    userFacade,
    courseFacade,
    appResolver: fakeAppResolver,
  } as unknown as StreamApiModuleResolver);

  const app = new ApiApp([userModule, courseModule, streamModule]);

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
