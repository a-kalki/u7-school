/**
 * distribute-lesson.ts — рассылка шагов урока в Telegram-группу потока.
 *
 * Использование:
 *   bun run scripts/distribute-lesson.ts p<проект>-l<урок> [номер_шага] [chat_id]
 *
 * Примеры:
 *   bun run scripts/distribute-lesson.ts p2-l3
 *   bun run scripts/distribute-lesson.ts p2-l3 2 --me
 */

import { ApiApp } from '@u7-scl/core/api';
import { mdToHtml } from '@u7-scl/core/shared';
import { CourseApiModule } from '../packages/course/src/api/module.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/user/src/infra/user-in-proc-facade.ts';

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';
const MODULE_ID = 'e4dea4fc-f8db-4b19-be2d-59fcf3ad96fa';

const BOT_TOKEN = '8894575137:AAGUFIhq2HbO9CLzWsfs22iYJ8vhw082LKs';
const DEFAULT_CHAT_ID = '-1003960918937';
const MENTOR_CHAT_ID = '773084180';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendToTelegram(
  token: string,
  chatId: string,
  text: string,
): Promise<boolean> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = { chat_id: chatId, text, parse_mode: 'HTML' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      console.log(`  ❌ Telegram: ${data.description ?? 'unknown'}`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`  ❌ Сеть: ${String(e)}`);
    return false;
  }
}

function waitEnter(): Promise<string> {
  return new Promise((resolve) => {
    process.stdin.once('data', (data) => resolve(String(data).trim()));
  });
}

function parseLessonId(
  arg: string,
): { project: number; lesson: number } | null {
  const m = arg.match(/^p(\d+)-l(\d+)$/);
  if (!m?.[1] || !m?.[2]) return null;
  return { project: parseInt(m[1], 10), lesson: parseInt(m[2], 10) };
}

async function main() {
  const args = process.argv.slice(2);
  const lessonIdArg = args[0];
  const a1 = args[1];
  const a2 = args[2];

  if (!lessonIdArg || !parseLessonId(lessonIdArg)) {
    console.error(
      '❌ Укажи урок: bun run scripts/distribute-lesson.ts p<проект>-l<урок> [номер_шага]',
    );
    process.exit(1);
  }

  const stepNumberArg = a1 && /^\d+$/.test(a1) ? parseInt(a1, 10) : undefined;
  const rawChatId = a1 && !/^\d+$/.test(a1) ? a1 : (a2 ?? DEFAULT_CHAT_ID);
  const chatId = rawChatId === '--me' ? MENTOR_CHAT_ID : rawChatId;

  const parsedId = parseLessonId(lessonIdArg);
  if (!parsedId) {
    console.error('❌ Некорректный идентификатор урока');
    process.exit(1);
  }
  const { project: N, lesson: M } = parsedId;
  const projectIndex = N - 1;
  const lessonIndex = M - 1;

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
  // biome-ignore lint/suspicious/noExplicitAny: скрипт использует динамические команды
  const app: ApiApp<any> = new ApiApp([userModule, courseModule]);

  const snapshot = (await app.execute(
    'get-module-snapshot',
    { moduleId: MODULE_ID },
    NUR_UUID,
  )) as Array<{
    projectTitle: string;
    lessons: Array<{ lessonId: string; lessonTitle: string }>;
  }>;

  if (projectIndex < 0 || projectIndex >= snapshot.length) {
    console.error(
      `❌ Проект ${N} не найден. Всего проектов: ${snapshot.length}`,
    );
    process.exit(1);
  }

  const project = snapshot[projectIndex];
  if (!project) {
    console.error(`❌ Проект ${N} не найден`);
    process.exit(1);
  }
  if (lessonIndex < 0 || lessonIndex >= project.lessons.length) {
    console.error(
      `❌ Урок ${lessonIdArg} не найден. В проекте ${N} уроков: ${project.lessons.length}`,
    );
    process.exit(1);
  }

  const lesson = project.lessons[lessonIndex];
  if (!lesson) {
    console.error(`❌ Урок ${lessonIdArg} не найден`);
    process.exit(1);
  }
  console.log(`📖 ${lessonIdArg}: ${lesson.lessonTitle}`);

  const lessonData = (await app.execute(
    'get-lesson',
    { uuid: lesson.lessonId },
    NUR_UUID,
  )) as {
    stepIds: string[];
  };

  if (!lessonData.stepIds || lessonData.stepIds.length === 0) {
    console.log('  ⚠️ В уроке нет шагов.');
    process.exit(0);
  }

  console.log(`  Всего шагов: ${lessonData.stepIds.length}`);

  const stepIds =
    stepNumberArg !== undefined
      ? lessonData.stepIds.filter((_, i) => i + 1 === stepNumberArg)
      : lessonData.stepIds;

  if (stepIds.length === 0) {
    console.log(`  ⚠️ Шаг #${stepNumberArg ?? '?'} не найден`);
    process.exit(0);
  }

  for (let i = 0; i < stepIds.length; i++) {
    const stepId = stepIds[i];
    if (!stepId) continue;

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

    const order = step.order ?? lessonData.stepIds.indexOf(stepId) + 1;
    const total = lessonData.stepIds.length;
    const kind = step.kind === 'code' ? '📝' : '📄';

    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  [${order}/${total}] ${kind} ${step.description ?? '—'}`);

    const htmlLines: string[] = [
      `<b>📚 ${lessonIdArg}: ${escapeHtml(lesson.lessonTitle)}</b>`,
      '',
      `<b>Шаг ${order}:</b> ${escapeHtml(step.description ?? '')}`,
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
        `Шаг ${order}: ${step.description ?? ''}`,
        '',
      ];
      if (step.kind === 'code' && step.code) {
        plain.push(step.code);
      } else if (step.kind === 'text' && step.content) {
        plain.push(step.content);
      }
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: plain.join('\n') }),
      });
    }

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
