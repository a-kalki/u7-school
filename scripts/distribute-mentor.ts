/**
 * distribute-mentor.ts — рассылка менторских шагов в личку ментору.
 *
 * Использование:
 *   bun run scripts/distribute-mentor.ts p<проект>-l<урок> [номер_файла]
 *
 * Примеры:
 *   bun run scripts/distribute-mentor.ts p2-l3        # все файлы урока
 *   bun run scripts/distribute-mentor.ts p2-l3 2      # только файл #2
 *   bun run scripts/distribute-mentor.ts p1-l12       # все файлы
 *
 * Без file_number — шлёт все файлы с подтверждением после каждого.
 * С file_number — шлёт только один файл и завершается.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
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
const CHAT_ID = '773084180';

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
  const fileNumberArg = args[1] ? parseInt(args[1], 10) : undefined;

  if (!lessonIdArg || !parseLessonId(lessonIdArg)) {
    console.error('❌ Укажи урок: bun run scripts/distribute-mentor.ts p<проект>-l<урок> [номер_файла]');
    process.exit(1);
  }

  const { project: N, lesson: M } = parseLessonId(lessonIdArg)!;

  // ══ Находим папку на диске ══
  const allDirs = readdirSync('data/lessons/nur');
  const dir = allDirs.find(d => d.startsWith(`p${N}-l${M}-`));
  if (!dir) {
    console.error(`❌ Папка ${lessonIdArg} не найдена`);
    process.exit(1);
  }

  const manifestPath = `data/lessons/nur/${dir}/mentor-files/manifest.json`;
  if (!existsSync(manifestPath)) {
    console.error(`❌ Нет manifest.json для ${lessonIdArg}`);
    process.exit(1);
  }

  let manifest: { lessonUuid?: string; files: Array<{ order: number; kind: string; description: string; fileName: string; fileMimeType: string }> };
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    manifest = Array.isArray(raw) ? { files: raw } : raw;
  } catch {
    console.error(`❌ Ошибка парсинга manifest.json`);
    process.exit(1);
  }

  const files = manifest.files;
  console.log(`📖 ${lessonIdArg} (${dir})`);
  console.log(`  Найдено файлов: ${files.length}\n`);

  // ══ Фильтруем если указан номер файла ══
  const entries = fileNumberArg !== undefined
    ? files.filter(e => e.order === fileNumberArg)
    : files;

  if (entries.length === 0) {
    console.log(`  ⚠️ Файл #${fileNumberArg} не найден`);
    process.exit(0);
  }

  // ══ Отправляем ══
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const label = entry.fileName;

    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  [${entry.order}/${files.length}] ${label}`);

    const msgLines = [
      `<b>📚 ${lessonIdArg}: ${dir}</b>`,
      `<b>Менторский файл ${entry.order}:</b> ${escapeHtml(label)}`,
      '',
      escapeHtml(entry.description),
    ];

    const ok = await sendToTelegram(BOT_TOKEN, CHAT_ID, msgLines.join('\n'));

    if (!ok) {
      const plain = [`${lessonIdArg}: ${dir}`, `Менторский файл ${entry.order}: ${label}`, '', entry.description];
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: plain.join('\n') }),
      });
    }

    // Если передан file_number — выходим без ожидания
    if (fileNumberArg !== undefined) {
      console.log('  ✅ Отправлено');
      process.exit(0);
    }

    if (i < entries.length - 1) {
      console.log('\n  ⏎ Enter — следующий (q — выход)...');
      const input = await waitEnter();
      if (input.toLowerCase() === 'q') {
        console.log('  ⏹ Отменено');
        process.exit(0);
      }
    }
  }

  console.log(`\n  ${'═'.repeat(50)}`);
  console.log('  ✅ Все файлы отправлены');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Ошибка:', e);
  process.exit(1);
});
