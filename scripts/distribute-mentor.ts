/**
 * distribute-mentor.ts — рассылка менторских шагов в личку ментору.
 *
 * Использование:
 *   bun run scripts/distribute-mentor.ts mA-pB-lC [номер_файла] [chat_id]
 *   bun run scripts/distribute-mentor.ts A-B-C [номер_файла] [chat_id]
 *   bun run scripts/distribute-mentor.ts A:B:C [номер_файла] [chat_id]
 *
 * Примеры:
 *   bun run scripts/distribute-mentor.ts m1-p2-l3
 *   bun run scripts/distribute-mentor.ts 1:2:3
 *   bun run scripts/distribute-mentor.ts 1-2-3 2 --me
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';

const DATA_DIR = 'data/fullstack-js';
const BOT_TOKEN = '8781337572:AAGWv3f924aZisUW3z47n8BPDusyfKAjIWg';
const DEFAULT_CHAT_ID = '773084180';

// Автоопределение имён папок модулей: m1-syntax, m2-algorithm, ...
const moduleDirs = readdirSync(DATA_DIR).sort();

// ─── Справка ───

function showHelp() {
  console.log(`
distribute-mentor — рассылка менторских файлов в личку ментору.

Использование:
  bun run scripts/distribute-mentor.ts M:P:L [опции]
  bun run scripts/distribute-mentor.ts M:P:L:S [опции]    # конкретный файл

Примеры:
  bun run scripts/distribute-mentor.ts 1:2:1              # все ментор-файлы урока
  bun run scripts/distribute-mentor.ts 1:2:1:2            # файл №2
  bun run scripts/distribute-mentor.ts 1:2:1 --to=12345   # отправить другому

Формат: M:P:L[:S] — модуль, проект, урок, номер файла (вложенность)

Флаги:
  --to=<id>     Отправка в чат с указанным Telegram ID

По умолчанию отправляет в личку ментору.
Временно читает manifest.json напрямую с диска (в обход API).
Будет заменён на get-step (kind: 'file') через mentorStepIds.
`);
}

// ─── Типы ───

interface LessonId {
  module: number; // 1-based
  project: number; // 1-based
  lesson: number; // 1-based
  fileNum?: number; // 1-based (опционально — конкретный ментор-файл)
}

function parseLessonId(arg: string): LessonId | null {
  // M:P:L:S
  const m1 = arg.match(/^(\d+):(\d+):(\d+):(\d+)$/);
  if (m1) {
    const mod = m1[1] as string;
    const proj = m1[2] as string;
    const les = m1[3] as string;
    const fileNum = m1[4] as string;
    return { module: +mod, project: +proj, lesson: +les, fileNum: +fileNum };
  }

  // M:P:L
  const m2 = arg.match(/^(\d+):(\d+):(\d+)$/);
  if (m2) {
    const mod = m2[1] as string;
    const proj = m2[2] as string;
    const les = m2[3] as string;
    return { module: +mod, project: +proj, lesson: +les };
  }

  return null;
}

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

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  // --to=<id>
  const toArg = args.find((a) => a.startsWith('--to='));
  const toId = toArg ? (toArg.split('=')[1] ?? '') : undefined;

  // Позиционные (всё что не флаг)
  const positional = args.filter((a) => !a.startsWith('--'));
  const lessonIdArg = positional[0];

  if (!lessonIdArg) {
    console.error(
      '❌ Укажи урок: bun run scripts/distribute-mentor.ts M:P:L [опции]',
    );
    console.error('   Формат: M:P:L[:S] — например: 1:2:1, 1:2:1:2');
    console.error('   Флаги: --to=<id>');
    process.exit(1);
  }

  const parsed = parseLessonId(lessonIdArg);
  if (!parsed) {
    console.error(
      '❌ Неверный формат: bun run scripts/distribute-mentor.ts M:P:L [опции]',
    );
    console.error('   Формат: M:P:L[:S] — например: 1:2:1, 1:2:1:2');
    process.exit(1);
  }

  const fileNumberArg = parsed.fileNum;
  const chatId = toId ?? DEFAULT_CHAT_ID;
  const { module: Nm, project: Np, lesson: Nl } = parsed;

  // Найти папку модуля
  const moduleDir = moduleDirs[Nm - 1];
  if (!moduleDir) {
    console.error(
      `❌ Модуль ${Nm} не найден (доступно: ${moduleDirs.join(', ')})`,
    );
    process.exit(1);
  }

  // Найти папку урока
  const prefix = `p${Np}-l${Nl}-`;
  const projectDirs = readdirSync(`${DATA_DIR}/${moduleDir}`);
  const dir = projectDirs.find((d) => d.startsWith(prefix));

  if (!dir) {
    console.error(
      `❌ Папка m${Nm}-p${Np}-l${Nl} не найдена в ${DATA_DIR}/${moduleDir}/`,
    );
    process.exit(1);
  }

  const lessonLabel = `m${Nm}-p${Np}-l${Nl}`;

  // Проверить manifest.json
  const manifestPath = `${DATA_DIR}/${moduleDir}/${dir}/mentor-files/manifest.json`;
  if (!existsSync(manifestPath)) {
    console.error(`❌ Нет manifest.json для ${lessonLabel}`);
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

  console.log(`📖 ${lessonLabel} (${moduleDir}/${dir})`);
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
      `<b>📚 ${lessonLabel}: ${dir}</b>`,
      `<b>Менторский файл ${entry.order}:</b> ${escapeHtml(entry.fileName)}`,
      '',
      escapeHtml(entry.description),
    ];

    const ok = await sendToTelegram(BOT_TOKEN, chatId, msgLines.join('\n'));

    if (!ok) {
      // Fallback: без HTML-разметки
      const plain = [
        `${lessonLabel}: ${dir}`,
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
