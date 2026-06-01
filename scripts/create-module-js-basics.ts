/**
 * Скрипт: создание и обогащение модуля "Основы JS".
 * Запуск: bun run scripts/create-module-js-basics.ts
 */

import { CourseApiModule } from '../packages/course/src/api/module.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/user/src/infra/user-in-proc-facade.ts';

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';

async function main() {
  const moduleRepo = new ModuleJsonRepo();
  const lessonRepo = new LessonJsonRepo();
  const stepRepo = new StepJsonRepo();
  const userRepo = new UserJsonRepo();
  const userApi = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userApi);

  const courseApi = new CourseApiModule({
    courseRepo: moduleRepo,
    lessonRepo,
    stepRepo,
    userFacade,
  });

  type ApiHandle = (
    name: string,
    attrs: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;

  const h: ApiHandle = (name, attrs) =>
    courseApi.handle({ name, attrs, actorId: NUR_UUID }) as Promise<
      Record<string, unknown>
    >;

  // ─── Шаг 1: Создаём модуль ────────────────────────
  console.log('🔄 Создаём модуль "Основы JS"...');
  const module = (await h('create-module', {
    title: 'Основы JS',
    description:
      'Изучаем синтаксис языка JavaScript с нуля. Научишься писать первые программы, работать с данными и управлять логикой кода.',
  })) as unknown as { uuid: string };
  console.log(`  ✅ Модуль создан: ${module.uuid}`);

  // ─── Шаг 2: Обогащаем модуль ──────────────────────
  console.log('🔄 Обогащаем модуль...');
  await h('enrich-module', {
    moduleId: module.uuid,
    targetAudience:
      'Новички в программировании, а также те, кто уже знает другой язык и хочет изучить JavaScript дополнительно',
    goal: 'Освоить базовый синтаксис JavaScript и написать свою первую несложную программу',
    result:
      'Ты напишешь функцию, которая использует циклы и условные конструкции — первый шаг к настоящему коду',
    tags: ['js', 'javascript', 'основы', 'новичкам'],
  });
  console.log('  ✅ Модуль обогащён');

  console.log('\n📋 Итог:');
  console.log(`  UUID:     ${module.uuid}`);
  console.log(`  Статус:   черновик`);
  console.log(`  Проекты:  пока нет — переходим к следующему шагу`);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
