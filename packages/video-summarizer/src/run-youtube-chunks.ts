/**
 * Суммаризация CHUNKS (нарезанных частей) YouTube-видео.
 * Запуск: bun run packages/video-summarizer/src/run-youtube-chunks.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { generateContent, uploadVideo } from './gemini';
import { CHUNK_PROMPT } from './prompt-chunk';

const CHUNKS_DIR =
  '/home/nur/Videos/Основы js/dist/Основы js/Модуль 1/youtube/compressed/chunks';
const OUTPUT_DIR = path.resolve(
  import.meta.dirname,
  '..',
  'output',
  'youtube',
  'chunks',
);

const apiKey = Bun.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ Переменная GEMINI_API_KEY не установлена');
  process.exit(1);
}

const alreadyDone = new Set(
  fs.existsSync(OUTPUT_DIR)
    ? fs.readdirSync(OUTPUT_DIR).map((f) => f.replace(/\.md$/, '.mp4'))
    : [],
);

const allChunks = fs
  .readdirSync(CHUNKS_DIR)
  .filter((f) => f.endsWith('.mp4') && !alreadyDone.has(f))
  .sort();

if (allChunks.length === 0) {
  console.log('✅ Все чанки уже обработаны');
  process.exit(0);
}

console.log(
  `📹 ${allChunks.length} чанков для обработки (уже готово: ${alreadyDone.size})\n`,
);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (let i = 0; i < allChunks.length; i++) {
  const chunk = allChunks[i]!;
  const chunkPath = path.join(CHUNKS_DIR, chunk);
  const sizeMB = (fs.statSync(chunkPath).size / 1024 / 1024).toFixed(0);

  console.log(`[${i + 1}/${allChunks.length}] ${chunk} (${sizeMB} МБ)`);

  try {
    console.log('  Загружаю в Gemini...');
    const file = await uploadVideo(chunkPath, apiKey);

    console.log('  Суммаризирую...');
    const summary = await generateContent(file, CHUNK_PROMPT, apiKey);

    const outPath = path.join(OUTPUT_DIR, chunk.replace(/\.mp4$/, '.md'));
    fs.writeFileSync(outPath, summary, 'utf-8');
    console.log(`  ✅ Сохранено: ${outPath}\n`);
  } catch (err: any) {
    console.error(`  ❌ Ошибка: ${err.message}\n`);
  }
}

console.log('🏁 Готово!');
