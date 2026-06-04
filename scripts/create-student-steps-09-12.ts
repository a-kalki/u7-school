/**
 * create-student-steps-09-12 — создаёт шаги для студентов из proposed-steps-09-12.json
 *
 * Использование:
 *   bun run scripts/create-student-steps-09-12.ts
 */

import { ApiApp } from '@u7-scl/core/api';
import { CourseApiModule } from '../packages/course/src/api/module.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/user/src/infra/user-in-proc-facade.ts';
import stepsPlan from '../proposed-steps-09-12.json' assert { type: 'json' };

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';

interface StepInput {
  order: number;
  kind: string;
  description: string;
  content?: string;
  code?: string;
  language?: string;
}

interface LessonInput {
  lessonId: string;
  title: string;
  steps: StepInput[];
}

interface StepsPlan {
  moduleId: string;
  lessons: Record<string, LessonInput>;
}

async function main() {
  const plan = stepsPlan as unknown as StepsPlan;
  const moduleId = plan.moduleId;

  const moduleRepo = new ModuleJsonRepo();
  const lessonRepo = new LessonJsonRepo();
  const stepRepo = new StepJsonRepo();
  const userRepo = new UserJsonRepo();
  const userModule = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userModule);
  const courseModule = new CourseApiModule({ courseRepo: moduleRepo, lessonRepo, stepRepo, userFacade });
  const app = new ApiApp([userModule, courseModule]);

  let totalCreated = 0;
  let totalErrors = 0;

  const lessonKeys = Object.keys(plan.lessons).sort();

  for (const lessonKey of lessonKeys) {
    const lesson = plan.lessons[lessonKey];
    const lessonId = lesson.lessonId;

    console.log(`\n📖 Урок ${lessonKey}: ${lesson.title} (${lessonId})`);

    for (const step of lesson.steps) {
      const params: Record<string, unknown> = {
        moduleId,
        lessonId,
        description: step.description,
        kind: step.kind,
      };

      if (step.kind === 'text') {
        params.content = step.content;
      } else if (step.kind === 'code') {
        params.code = step.code;
        params.language = step.language || 'javascript';
      }

      process.stdout.write(`  ➜ [${step.order}] ${step.description.slice(0, 50)}... `);

      try {
        await app.execute('create-step', params, NUR_UUID);
        console.log(`✅`);
        totalCreated++;
      } catch (e: unknown) {
        const err = e as { error?: { message?: string }; message?: string };
        console.log(`❌ ${err.error?.message || err.message || String(e)}`);
        totalErrors++;
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Создано шагов: ${totalCreated}`);
  if (totalErrors > 0) console.log(`❌ Ошибок: ${totalErrors}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((e) => {
  console.error('❌ Фатальная ошибка:', e);
  process.exit(1);
});
