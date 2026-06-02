/**
 * distribute-mentor.ts — временный скрипт для рассылки менторских шагов
 * (описания без файлов) в личку ментору.
 *
 * Использование:
 *   bun run scripts/distribute-mentor.ts <номер_урока>
 *
 * Пример:
 *   bun run scripts/distribute-mentor.ts 3
 *
 * Перед каждым следующим шагом ждёт Enter — подтверди что предыдущий доставлен.
 * Менторские шаги есть только для уроков 01–04.
 */

import { ApiApp } from '@u7-scl/core/api';
import { CourseApiModule } from '../packages/course/src/api/module.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/user/src/infra/user-in-proc-facade.ts';
import { existsSync } from 'node:fs';

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';
const MODULE_ID = 'e4dea4fc-f8db-4b19-be2d-59fcf3ad96fa';

// Telegram — отправляем в личку ментору
const BOT_TOKEN = '8894575137:AAGUFIhq2HbO9CLzWsfs22iYJ8vhw082LKs';
const CHAT_ID = '773084180'; // ADMIN_TELEGRAM_IDS

// Маппинг номера урока → директория на диске
const LESSON_DIRS: Record<number, string> = {
  1: '01-introduction-to-programming',
  2: '02-variables',
  3: '03-math-operators',
  4: '04-data-types',
  5: '05-data-types-exceptions',
  6: '06-equality-comparison-operators',
  7: '07-logical-operators',
  8: '08-conditionals',
  9: '09-ternary-operator',
  10: '10-implicit-type-conversion',
  11: '11-explicit-type-casting',
  12: '12-logical-operators-secrets',
  13: '13-operator-precedence',
  14: '14-data-structures-array-set',
  15: '15-data-structures-object-map',
  16: '16-loops-concept-for',
  17: '17-loops-for-string-iteration',
  18: '18-loops-while-do-while',
  19: '19-operators-in-for-in-for-of',
  20: '20-function-syntax-params-return',
  21: '21-function-return-predicates',
  22: '22-function-black-box',
  23: '23-functions-type-properties-styles',
  24: '24-functions-arguments-value-reference',
  25: '25-functions-advanced',
  26: '26-anonymous-arrow-functions',
  27: '27-callback-functions',
  28: '28-recursion',
};

/** Экранирует спецсимволы HTML: & < > */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendToTelegram(token: string, chatId: string, text: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
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

/** Ждёт Enter в терминале */
function waitEnter(): Promise<string> {
  return new Promise((resolve) => {
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });
}

interface MentorFileEntry {
  order: number;
  kind: string;
  description: string;
  fileName: string;
  fileMimeType: string;
}

async function main() {
  const args = process.argv.slice(2);
  const lessonNumberStr = args[0];

  if (!lessonNumberStr || !/^\d+$/.test(lessonNumberStr)) {
    console.error('❌ Укажи номер урока: bun run scripts/distribute-mentor.ts <число>');
    process.exit(1);
  }

  const lessonNumber = parseInt(lessonNumberStr, 10);

  // ══ Инициализация ApiApp (нужен только для получения названия урока) ══
  const moduleRepo = new ModuleJsonRepo();
  const lessonRepo = new LessonJsonRepo();
  const stepRepo = new StepJsonRepo();
  const userRepo = new UserJsonRepo();
  const userModule = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userModule);
  const courseModule = new CourseApiModule({ courseRepo: moduleRepo, lessonRepo, stepRepo, userFacade });
  const app = new ApiApp([userModule, courseModule]);

  // Получаем название урока из snapshot
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

  // ══ Ищем mentor-files на диске ══
  const lessonDir = LESSON_DIRS[lessonNumber];
  if (!lessonDir) {
    console.log('  ⚠️ Неизвестная директория для этого урока.');
    process.exit(0);
  }

  const manifestPath = `data/lessons/nur/${lessonDir}/mentor-files/manifest.json`;

  if (!existsSync(manifestPath)) {
    console.log('  ⚠️ Менторских файлов для этого урока нет.');
    process.exit(0);
  }

  // JSON содержит сырые переносы строк внутри строк — чистим
  let raw = await Bun.file(manifestPath).text();
  // Убираем сырые \n внутри строк: заменяем на \\n
  // (простой подход: сворачиваем мультилайн-строки в одну строку)
  raw = raw.replace(/\n\s*/g, ' ');
  const manifest = JSON.parse(raw) as MentorFileEntry[];
  console.log(`  Найдено менторских шагов: ${manifest.length}\n`);

  // ══ Отправляем каждый шаг ══
  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    const order = entry.order;
    const entryLabel = entry.fileName || entry.description.split('\n')[0].slice(0, 60);

    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  [${order}/${manifest.length}] ${entryLabel}`);

    const msgLines = [
      `<b>📚 Урок ${String(lessonNumber).padStart(2, '0')}: ${escapeHtml(lesson.title)}</b>`,
      `<b>Менторский шаг ${order}:</b> ${escapeHtml(entryLabel)}`,
      '',
      escapeHtml(entry.description.replace(/\\n/g, '\n')),
    ];

    const message = msgLines.join('\n');
    const ok = await sendToTelegram(BOT_TOKEN, CHAT_ID, message);

    if (!ok) {
      // fallback без HTML
      const plainLines = [
        `Урок ${String(lessonNumber).padStart(2, '0')}: ${lesson.title}`,
        `Менторский шаг ${order}: ${fileName}`,
        '',
        entry.description.replace(/\\n/g, '\n'),
      ];
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: plainLines.join('\n') }),
      });
    }

    if (i < manifest.length - 1) {
      console.log('\n  ⏎ Нажми Enter, чтобы отправить следующий шаг (или q + Enter — выйти)...');
      const input = await waitEnter();
      if (input.toLowerCase() === 'q') {
        console.log('  ⏹ Отменено.');
        process.exit(0);
      }
    }
  }

  console.log(`\n  ${'═'.repeat(50)}`);
  console.log('  ✅ Все менторские шаги отправлены!');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Ошибка:', e);
  process.exit(1);
});
