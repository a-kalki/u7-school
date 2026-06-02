/**
 * distribute-lesson.ts — временный скрипт для рассылки шагов урока в Telegram-группу потока.
 *
 * Использование:
 *   bun run scripts/distribute-lesson.ts <номер_урока>
 *
 * Пример:
 *   bun run scripts/distribute-lesson.ts 3   # шаги урока 03
 *   bun run scripts/distribute-lesson.ts 1   # шаги урока 01
 *
 * Перед каждым следующим шагом ждёт Enter — подтверди что предыдущий доставлен.
 */

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

// Telegram
const BOT_TOKEN = '8894575137:AAGUFIhq2HbO9CLzWsfs22iYJ8vhw082LKs';
const CHAT_ID = '-1003960918937';

/** Экранирует спецсимволы HTML: & < > */
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

  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) {
      console.log(`  ❌ Telegram ошибка: ${data.description}`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`  ❌ Сетевая ошибка: ${e}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const lessonNumberStr = args[0];

  if (!lessonNumberStr || !/^\d+$/.test(lessonNumberStr)) {
    console.error('❌ Укажи номер урока: bun run scripts/distribute-lesson.ts <число>');
    process.exit(1);
  }

  const lessonNumber = parseInt(lessonNumberStr, 10);

  // ══ Инициализация ApiApp ══
  const moduleRepo = new ModuleJsonRepo();
  const lessonRepo = new LessonJsonRepo();
  const stepRepo = new StepJsonRepo();
  const userRepo = new UserJsonRepo();
  const userModule = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userModule);
  const courseModule = new CourseApiModule({ courseRepo: moduleRepo, lessonRepo, stepRepo, userFacade });
  const app = new ApiApp([userModule, courseModule]);

  // ══ Получаем модуль и собираем все lessonIds по порядку ══
  const snapshot = (await app.execute(
    'get-module-snapshot',
    { moduleId: MODULE_ID },
    NUR_UUID,
  )) as Array<{
    projectTitle: string;
    lessons: Array<{ lessonId: string; lessonTitle: string }>;
  }>;

  const allLessons: Array<{ lessonId: string; title: string }> = [];
  for (const project of snapshot) {
    for (const lesson of project.lessons) {
      allLessons.push({ lessonId: lesson.lessonId, title: lesson.lessonTitle });
    }
  }

  const lessonIndex = lessonNumber - 1;
  if (lessonIndex < 0 || lessonIndex >= allLessons.length) {
    console.error(`❌ Урок ${lessonNumber} не найден. Всего уроков: ${allLessons.length}`);
    process.exit(1);
  }

  const lesson = allLessons[lessonIndex];
  console.log(`📖 Урок ${String(lessonNumber).padStart(2, '0')}: ${lesson.title}`);

  // ══ Получаем шаги урока ══
  const lessonData = (await app.execute(
    'get-lesson',
    { uuid: lesson.lessonId },
    NUR_UUID,
  )) as { stepIds: string[] };

  if (!lessonData.stepIds || lessonData.stepIds.length === 0) {
    console.log('  ⚠️ В уроке нет шагов.');
    process.exit(0);
  }

  console.log(`  Всего шагов: ${lessonData.stepIds.length}\n`);

  // ══ Для каждого шага: получаем → форматируем → отправляем → ждём ══
  for (let i = 0; i < lessonData.stepIds.length; i++) {
    const stepId = lessonData.stepIds[i];
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

    const order = step.order ?? i + 1;
    const kind = step.kind === 'code' ? '📝' : '📄';
    const desc = step.description || '—';

    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  [${order}/${lessonData.stepIds.length}] ${kind} ${desc}`);

    // ══ Форматируем в HTML ══
    const htmlLines: string[] = [
      `<b>📚 Урок ${String(lessonNumber).padStart(2, '0')}: ${escapeHtml(lesson.title)}</b>`,
      '',
      `<b>Шаг ${order}:</b> ${escapeHtml(desc)}`,
      '',
    ];

    if (step.kind === 'code' && step.code) {
      htmlLines.push('<pre><code class="language-javascript">');
      htmlLines.push(escapeHtml(step.code));
      htmlLines.push('</code></pre>');
    } else if (step.kind === 'text' && step.content) {
      htmlLines.push(escapeHtml(step.content));
    }

    const message = htmlLines.join('\n');

    // ══ Отправляем (HTML — надёжный, fallback не нужен) ══
    const ok = await sendToTelegram(BOT_TOKEN, CHAT_ID, message);

    if (!ok) {
      console.log('  ⚠️ Пробую без HTML...');
      const plainLines = [
        `Урок ${String(lessonNumber).padStart(2, '0')}: ${lesson.title}`,
        `Шаг ${order}: ${desc}`,
        '',
      ];
      if (step.kind === 'code' && step.code) {
        plainLines.push(step.code);
      } else if (step.kind === 'text' && step.content) {
        plainLines.push(step.content);
      }
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: plainLines.join('\n') }),
      });
    }

    // ══ Ждём подтверждения перед следующим шагом ══
    if (i < lessonData.stepIds.length - 1) {
      console.log('\n  ⏎ Нажми Enter, чтобы отправить следующий шаг (или q + Enter — выйти)...');
      const input = await new Promise<string>((resolve) => {
        process.stdin.once('data', (data) => resolve(data.toString().trim()));
      });
      if (input.toLowerCase() === 'q') {
        console.log('  ⏹ Отменено.');
        process.exit(0);
      }
    }
  }

  console.log(`\n  ${'═'.repeat(50)}`);
  console.log('  ✅ Все шаги отправлены!');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Ошибка:', e);
  process.exit(1);
});
