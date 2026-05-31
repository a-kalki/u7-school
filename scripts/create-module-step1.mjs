/**
 * Скрипт: создание и обогащение модуля "Основы JS" (шаги 1-2).
 * Использует CourseApiModule через handle().
 * Запуск: bun run scripts/create-module-step1.mjs
 */

import { CourseApiModule } from '../packages/course/src/api/module.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/course/src/infra/course-in-proc-facade.ts';

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

  const h = (name, attrs) =>
    courseApi.handle({ name, attrs, actorId: NUR_UUID });

  // ─── Шаг 1: Создаём модуль ──────────────────────
  console.log('🔄 Создаём модуль "Основы JS"...');
  const module = await h('create-module', {
    title: 'Основы JS',
    description:
      'Изучаем синтаксис языка JavaScript с нуля. Научишься писать первые программы, работать с данными и управлять логикой кода.',
  });
  console.log(`  ✅ Модуль создан: ${module.uuid}`);

  // ─── Шаг 2: Обогащаем модуль ────────────────────
  console.log('🔄 Обогащаем модуль...');
  console.log('  Задаю вопросы для обогащения...');

  // Пока обогащаем без доп. полей — спрошу пользователя
  console.log('\n📋 Текущее состояние модуля:');
  console.log(`  Название: ${module.title}`);
  console.log(`  Описание: ${module.description}`);
  console.log(`  UUID: ${module.uuid}`);
  console.log(`  Статус: ${module.status}`);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
