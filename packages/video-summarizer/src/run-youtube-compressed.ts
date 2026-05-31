/**
 * Суммаризация СЖАТЫХ YouTube-видео (только те, что не обработаны).
 * Запуск: bun run packages/video-summarizer/src/run-youtube-compressed.ts
 */
import { uploadVideo, generateContent } from "./gemini";
import { SUMMARIZE_YOUTUBE_PROMPT } from "./prompt-youtube";
import path from "node:path";
import fs from "node:fs";

const COMPRESSED_DIR =
  "/home/nur/Videos/Основы js/dist/Основы js/Модуль 1/youtube/compressed";
const OUTPUT_DIR = path.resolve(import.meta.dirname, "..", "output", "youtube");

const apiKey = Bun.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ Переменная GEMINI_API_KEY не установлена");
  process.exit(1);
}

// Берём все mp4 из compressed, исключая уже обработанные
const alreadyDone = new Set(
  fs.existsSync(OUTPUT_DIR)
    ? fs.readdirSync(OUTPUT_DIR).map((f) => f.replace(/\.md$/, ".mp4"))
    : [],
);

const allVideos = fs
  .readdirSync(COMPRESSED_DIR)
  .filter((f) => f.endsWith(".mp4") && !alreadyDone.has(f))
  .sort();

if (allVideos.length === 0) {
  console.log("✅ Все видео уже обработаны");
  process.exit(0);
}

console.log(
  `📹 ${allVideos.length} сжатых видео для обработки (уже готово: ${alreadyDone.size})\n`,
);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (let i = 0; i < allVideos.length; i++) {
  const video = allVideos[i]!;
  const videoPath = path.join(COMPRESSED_DIR, video);
  const sizeMB = (fs.statSync(videoPath).size / 1024 / 1024).toFixed(0);

  console.log(`[${i + 1}/${allVideos.length}] ${video} (${sizeMB} МБ)`);

  try {
    console.log("  Загружаю в Gemini...");
    const file = await uploadVideo(videoPath, apiKey);

    console.log("  Суммаризирую + разбиваю на части...");
    const summary = await generateContent(
      file,
      SUMMARIZE_YOUTUBE_PROMPT,
      apiKey,
    );

    const outName = video.replace(/\.mp4$/, ".md");
    const outPath = path.join(OUTPUT_DIR, outName);
    fs.writeFileSync(outPath, summary, "utf-8");
    console.log(`  ✅ Сохранено: ${outPath}\n`);
  } catch (err: any) {
    console.error(`  ❌ Ошибка: ${err.message}\n`);
  }
}

console.log("🏁 Готово!");
