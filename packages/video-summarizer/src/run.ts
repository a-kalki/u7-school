/**
 * Точка входа: суммаризация первых двух видео из Модуль 1.
 * Запуск: bun run packages/video-summarizer/src/run.ts
 */
import { uploadVideo, generateContent } from "./gemini";
import { SUMMARIZE_PROMPT } from "./prompt";
import path from "node:path";
import fs from "node:fs";

const VIDEO_DIR =
  "/home/nur/Videos/Основы js/dist/Основы js/Модуль 1";
const OUTPUT_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "output",
);

const apiKey = Bun.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ Переменная GEMINI_API_KEY не установлена");
  process.exit(1);
}

// Берём первые два видео (числовая сортировка по номеру урока)
const allVideos = fs
  .readdirSync(VIDEO_DIR)
  .filter((f) => f.endsWith(".mp4"))
  .sort((a, b) => {
    const na = parseInt(a.match(/^(\d+)/)?.[1] ?? "0", 10);
    const nb = parseInt(b.match(/^(\d+)/)?.[1] ?? "0", 10);
    return na - nb;
  })
  .slice(2);

if (allVideos.length === 0) {
  console.error("❌ Видео не найдены");
  process.exit(1);
}

console.log(
  `📹 Найдено ${allVideos.length} видео для обработки (gemini-2.5-flash)\n`,
);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (let i = 0; i < allVideos.length; i++) {
  const video = allVideos[i]!;
  const videoPath = path.join(VIDEO_DIR, video);
  const sizeMB = (fs.statSync(videoPath).size / 1024 / 1024).toFixed(0);

  console.log(`[${i + 1}/${allVideos.length}] ${video} (${sizeMB} МБ)`);

  try {
    console.log("  Загружаю в Gemini...");
    const file = await uploadVideo(videoPath, apiKey);

    console.log("  Суммаризирую...");
    const summary = await generateContent(file, SUMMARIZE_PROMPT, apiKey);

    const outName = video.replace(/\.mp4$/, ".md");
    const outPath = path.join(OUTPUT_DIR, outName);
    fs.writeFileSync(outPath, summary, "utf-8");
    console.log(`  ✅ Сохранено: ${outPath}\n`);
  } catch (err: any) {
    console.error(`  ❌ Ошибка: ${err.message}\n`);
  }
}

console.log("🏁 Готово!");
