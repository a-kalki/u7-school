/**
 * distribute-lesson.ts — рассылка шагов урока в Telegram-группу потока.
 *
 * Использование:
 *   bun run scripts/distribute-lesson.ts p<проект>-l<урок> [номер_шага]
 *
 * Примеры:
 *   bun run scripts/distribute-lesson.ts p2-l3        # все шаги урока
 *   bun run scripts/distribute-lesson.ts p2-l3 2      # только шаг 2
 *   bun run scripts/distribute-lesson.ts p1-l12       # все шаги
 *
 * Без номера шага — шлёт все шаги с подтверждением после каждого.
 * С номером шага — шлёт только один шаг и завершается.
 */

import { mdToHtml } from '@u7-scl/core/shared';
import { ApiApp } from '@u7-scl/core/api';
import { CourseApiModule } from '../packages/course/src/api/module.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/user/src/infra/user-in-proc-facade.ts';

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';
const MODULE_ID = 'e4dea4fc-f8db-4b19-be2d-59fcf3ad96fa';

const BOT_TOKEN = '8894575137:AAGUFIhq2HbO9CLzWsfs22iYJ8vhw082LKs';
const DEFAULT_CHAT_ID = '-1003960918937'; // группа потока
const MENTOR_CHAT_ID = '773084180';        // личка ментора

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendToTelegram(token: string, chatId: string, text: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = { chat_id: chatId, text, parse_mode: 'HTML' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) {
      console.log(`  ❌ Telegram: ${data.description}`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`  ❌ Сеть: ${e}`);
    return false;
  }
}

function waitEnter(): Promise<string> {
  return new Promise((resolve) => {
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });
}

function parseLessonId(arg: string): { project: number; lesson: number } | null {
  const m = arg.match(/^p(\d+)-l(\d+)$/);
  if (!m) return null;
  return { project: parseInt(m[1]), lesson: parseInt(m[2]) };
}

async function main() {
  const args = process.argv.slice(2);
  const lessonIdArg = args[0];
  const stepNumberArg = args[1] && /^\d+$/.test(args[1]) ? parseInt(args[1], 10) : undefined;
  // chat_id: если второй аргумент не число, то это chat_id; иначе третий аргумент
  let chatId = args[1] && !/^\d+$/.test(args[1]) ? args[1] : (args[2] || DEFAULT_CHAT_ID);
  if (chatId === '--me') chatId = MENTOR_CHAT_ID;

  if (!lessonIdArg || !parseLessonId(lessonIdArg)) {
    console.error('❌ Укажи урок: bun run scripts/distribute-lesson.ts p<проект>-l<урок> [номер_шага]');
    process.exit(1);
  }

  const { project: N, lesson: M } = parseLessonId(lessonIdArg)!;
  const projectIndex = N - 1;
  const lessonIndex = M - 1;

  // ══ ApiApp ══
  const moduleRepo = new ModuleJsonRepo();
  const lessonRepo = new LessonJsonRepo();
  const stepRepo = new StepJsonRepo();
  const userRepo = new UserJsonRepo();
  const userModule = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userModule);
  const courseModule = new CourseApiModule({ courseRepo: moduleRepo, lessonRepo, stepRepo, userFacade });
  const app = new ApiApp([userModule, courseModule]);

  // ══ Snapshot → проект → урок ══
  const snapshot = (await app.execute(
    'get-module-snapshot',
    { moduleId: MODULE_ID },
    NUR_UUID,
  )) as Array<{
    projectTitle: string;
    lessons: Array<{ lessonId: string; lessonTitle: string }>;
  }>;

  if (projectIndex < 0 || projectIndex >= snapshot.length) {
    console.error(`❌ Проект ${N} не найден. Всего проектов: ${snapshot.length}`);
    process.exit(1);
  }

  const project = snapshot[projectIndex];
  if (lessonIndex < 0 || lessonIndex >= project.lessons.length) {
    console.error(`❌ Урок ${lessonIdArg} не найден. В проекте ${N} уроков: ${project.lessons.length}`);
    process.exit(1);
  }

  const lesson = project.lessons[lessonIndex];
  console.log(`📖 ${lessonIdArg}: ${lesson.lessonTitle}`);

  // ══ Шаги урока ══
  const lessonData = (await app.execute(
    'get-lesson',
    { uuid: lesson.lessonId },
    NUR_UUID,
  )) as { stepIds: string[] };

  if (!lessonData.stepIds || lessonData.stepIds.length === 0) {
    console.log('  ⚠️ В уроке нет шагов.');
    process.exit(0);
  }

  console.log(`  Всего шагов: ${lessonData.stepIds.length}`);

  // ══ Фильтр по номеру шага ══
  const stepIds = stepNumberArg !== undefined
    ? lessonData.stepIds.filter((_, i) => (i + 1) === stepNumberArg || (i + 1) === stepNumberArg)
    : lessonData.stepIds;

  if (stepIds.length === 0) {
    console.log(`  ⚠️ Шаг #${stepNumberArg} не найден`);
    process.exit(0);
  }

  // ══ Отправка ══
  for (let i = 0; i < stepIds.length; i++) {
    const stepId = stepIds[i];
    const step = (await app.execute(
      'get-step',
      { uuid: stepId },
      NUR_UUID,
    )) as {
      description: string;
      kind: string;
      content?: string;
      code?: string;
      order?: number;
    };

    const order = step.order ?? (lessonData.stepIds.indexOf(stepId) + 1);
    const total = lessonData.stepIds.length;
    const kind = step.kind === 'code' ? '📝' : '📄';

    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  [${order}/${total}] ${kind} ${step.description || '—'}`);

    const htmlLines: string[] = [
      `<b>📚 ${lessonIdArg}: ${escapeHtml(lesson.lessonTitle)}</b>`,
      '',
      `<b>Шаг ${order}:</b> ${escapeHtml(step.description || '')}`,
      '',
    ];

    if (step.kind === 'code' && step.code) {
      htmlLines.push('<pre><code class="language-javascript">');
      htmlLines.push(escapeHtml(step.code));
      htmlLines.push('</code></pre>');
    } else if (step.kind === 'text' && step.content) {
      htmlLines.push(mdToHtml(step.content));
    }

    const ok = await sendToTelegram(BOT_TOKEN, chatId, htmlLines.join('\n'));

    if (!ok) {
      const plain = [
        `${lessonIdArg}: ${lesson.lessonTitle}`,
        `Шаг ${order}: ${step.description || ''}`,
        '',
      ];
      if (step.kind === 'code' && step.code) plain.push(step.code);
      else if (step.kind === 'text' && step.content) plain.push(step.content);
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: plain.join('\n') }),
      });
    }

    // Если указан номер шага — выходим без ожидания
    if (stepNumberArg !== undefined) {
      console.log('  ✅ Отправлено');
      process.exit(0);
    }

    if (i < stepIds.length - 1) {
      console.log('\n  ⏎ Enter — следующий (q — выход)...');
      const input = await waitEnter();
      if (input.toLowerCase() === 'q') {
        console.log('  ⏹ Отменено');
        process.exit(0);
      }
    }
  }

  console.log(`\n  ${'═'.repeat(50)}`);
  console.log('  ✅ Все шаги отправлены');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Ошибка:', e);
  process.exit(1);
});
