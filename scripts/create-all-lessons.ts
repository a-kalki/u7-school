/**
 * create-all-lessons — создаёт все уроки из proposed-lessons.json в одном запуске.
 *
 * Использование:
 *   bun run scripts/create-all-lessons.ts
 */

import { ApiApp } from '@u7-scl/core/api';
import { CourseApiModule } from '../packages/course/src/api/module.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/user/src/infra/user-in-proc-facade.ts';
import lessonsPlan from '../proposed-lessons.json';
assert;
{
  type: 'json';
}

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';

interface LessonInput {
  num: string;
  title: string;
  additional?: string;
  estimatedMinutes: number;
}

interface ProjectData {
  uuid: string;
  title: string;
  lessons: LessonInput[];
}

interface ProjectsDict {
  [key: string]: ProjectData;
}

interface LessonsPlan {
  moduleId: string;
  projects: ProjectsDict;
}

async function main() {
  const plan = lessonsPlan as unknown as LessonsPlan;
  const moduleId = plan.moduleId;

  // ─── Инициализация ────────────────────────────────
  const moduleRepo = new ModuleJsonRepo();
  const lessonRepo = new LessonJsonRepo();
  const stepRepo = new StepJsonRepo();
  const userRepo = new UserJsonRepo();
  const userModule = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userModule);

  const courseModule = new CourseApiModule({
    courseRepo: moduleRepo,
    lessonRepo,
    stepRepo,
    userFacade,
  });

  const app = new ApiApp([userModule, courseModule]);

  const projectKeys = Object.keys(plan.projects).sort();
  let totalCreated = 0;
  let totalErrors = 0;

  for (const projectKey of projectKeys) {
    const project = plan.projects[projectKey];
    const projectId = project.uuid;

    console.log(`\n📦 Проект: ${project.title} (${projectId})`);

    for (const lesson of project.lessons) {
      const params: Record<string, unknown> = {
        moduleId,
        projectId,
        title: lesson.title,
        additional: lesson.additional,
        estimatedMinutes: lesson.estimatedMinutes,
      };

      process.stdout.write(`  ➜ [${lesson.num}] ${lesson.title}... `);

      try {
        const result = await app.execute('create-lesson', params, NUR_UUID);
        const uuid = (result as { uuid?: string }).uuid || 'unknown';
        console.log(`✅ ${uuid}`);
        totalCreated++;
      } catch (e: unknown) {
        const err = e as { error?: { message?: string }; message?: string };
        console.log(`❌ ${err.error?.message || err.message || String(e)}`);
        totalErrors++;
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Создано уроков: ${totalCreated}`);
  if (totalErrors > 0) {
    console.log(`❌ Ошибок: ${totalErrors}`);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((e) => {
  console.error('❌ Фатальная ошибка:', e);
  process.exit(1);
});
