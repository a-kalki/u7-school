/**
 * distribute-mentor.ts — рассылка менторских шагов в личку ментору.
 *
 * Использование:
 *   bun run scripts/distribute-mentor.ts p<проект>-l<урок> [номер_файла] [chat_id]
 *
 * Примеры:
 *   bun run scripts/distribute-mentor.ts p2-l3
 *   bun run scripts/distribute-mentor.ts p2-l3 2 --me
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';

const BOT_TOKEN = '8894575137:AAGUFIhq2HbO9CLzWsfs22iYJ8vhw082LKs';
const DEFAULT_CHAT_ID = '773084180';

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
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
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
      '❌ Укажи урок: bun run scripts/distribute-mentor.ts p<проект>-l<урок> [номер_файла]',
    );
    process.exit(1);
  }

  const fileNumberArg = a1 && /^\d+$/.test(a1) ? parseInt(a1, 10) : undefined;
  const rawChatId = a1 && !/^\d+$/.test(a1) ? a1 : (a2 ?? DEFAULT_CHAT_ID);
  const chatId = rawChatId === '--me' ? DEFAULT_CHAT_ID : rawChatId;

  const parsed = parseLessonId(lessonIdArg);
  if (!parsed) {
    console.error('❌ Некорректный идентификатор урока');
    process.exit(1);
  }
  const { project: N, lesson: M } = parsed;

  const allDirs = readdirSync('data/lessons/nur');
  const dir = allDirs.find((d) => d.startsWith(`p${N}-l${M}-`));
  if (!dir) {
    console.error(`❌ Папка ${lessonIdArg} не найдена`);
    process.exit(1);
  }

  const manifestPath = `data/lessons/nur/${dir}/mentor-files/manifest.json`;
  if (!existsSync(manifestPath)) {
    console.error(`❌ Нет manifest.json для ${lessonIdArg}`);
    process.exit(1);
  }

  let files: Array<{
    order: number;
    kind: string;
    description: string;
    fileName: string;
    fileMimeType: string;
  }>;
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    files = Array.isArray(raw) ? raw : raw.files;
  } catch {
    console.error('❌ Ошибка парсинга manifest.json');
    process.exit(1);
  }

  console.log(`📖 ${lessonIdArg} (${dir})`);
  console.log(`  Найдено файлов: ${files.length}\n`);

  const entries =
    fileNumberArg !== undefined
      ? files.filter((e) => e.order === fileNumberArg)
      : files;

  if (entries.length === 0) {
    console.log(`  ⚠️ Файл #${fileNumberArg ?? '?'} не найден`);
    process.exit(0);
  }

  const totalFiles = files.length;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;

    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  [${entry.order}/${totalFiles}] ${entry.fileName}`);

    const msgLines = [
      `<b>📚 ${lessonIdArg}: ${dir}</b>`,
      `<b>Менторский файл ${entry.order}:</b> ${escapeHtml(entry.fileName)}`,
      '',
      escapeHtml(entry.description),
    ];

    const ok = await sendToTelegram(BOT_TOKEN, chatId, msgLines.join('\n'));

    if (!ok) {
      const plain = [
        `${lessonIdArg}: ${dir}`,
        `Менторский файл ${entry.order}: ${entry.fileName}`,
        '',
        entry.description,
      ];
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: plain.join('\n') }),
      });
    }

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
