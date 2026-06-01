/**
 * Запрашивает у Gemini временные метки для разделения видео на основе конспектов.
 * Запуск: bun run packages/video-summarizer/src/get-timestamps.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const YOUTUBE_OUT =
  '/home/nur/dev/kalki/u7-school/packages/video-summarizer/output/youtube';
const apiKey = Bun.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) throw new Error('GEMINI_API_KEY не установлен');

// Видео без точных меток и их длительности
const NEED_METADATA: { file: string; durationMin: number; parts: number }[] = [
  {
    file: 'Глобальная, локальная и время жизни переменной.md',
    durationMin: 78,
    parts: 4,
  },
  {
    file: 'Знакомимся с html, css, js. Как грузится html и выполняется js.md',
    durationMin: 91,
    parts: 5,
  },
  { file: 'Отладка кода js в браузере.md', durationMin: 55, parts: 3 },
  {
    file: 'Пишем первый код и подкрепляем теорию практикой.md',
    durationMin: 79,
    parts: 4,
  },
];

const TIMESTAMP_PROMPT = `Ты смотрел видео-урок по JavaScript длительностью {DURATION} минут. Вот полный конспект этого урока:

---
{SUMMARY}
---

**Задача:** видео нужно разделить на {PARTS} равные логические части для поэтапного изучения.

Для каждой части укажи ТОЧНЫЕ временные метки начала в формате MM:SS. Метки должны быть реалистичными — равномерно распределены по длительности видео, но с поправкой на логические границы тем (начало новой темы).

Учитывай, что видео длится ровно {DURATION} минут. Временные метки должны укладываться в этот диапазон.

**Формат ответа — ТОЛЬКО JSON:**
\`\`\`json
{
  "parts": [
    { "part": 1, "start": "00:00", "title": "..." },
    { "part": 2, "start": "MM:SS", "title": "..." }
  ]
}
\`\`\`

Названия (title) возьми из конспекта — те, что уже предложены в разделе "Разделение на части", но скорректируй если нужно.`;

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!resp.ok) throw new Error(`[${resp.status}] ${await resp.text()}`);
  const data = await resp.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

for (const { file, durationMin, parts } of NEED_METADATA) {
  const filePath = path.join(YOUTUBE_OUT, file);
  const summary = fs.readFileSync(filePath, 'utf-8');
  const prompt = TIMESTAMP_PROMPT.replace('{DURATION}', String(durationMin))
    .replace('{PARTS}', String(parts))
    .replace('{SUMMARY}', summary.slice(0, 15000)); // обрезаем чтобы не превысить лимит

  console.log(`⏱ ${file} (${durationMin} мин → ${parts} частей)`);
  try {
    const result = await callGemini(prompt);
    // Извлекаем JSON из ответа
    const jsonMatch = result.match(/\{[\s\S]*"parts"[\s\S]*\}/);
    if (jsonMatch) {
      const json = JSON.parse(jsonMatch[0]);
      for (const p of json.parts) {
        console.log(`  Часть ${p.part}: ${p.start} — ${p.title}`);
      }
      // Сохраняем в файл
      const metaPath = filePath.replace('.md', '.meta.json');
      fs.writeFileSync(metaPath, JSON.stringify(json, null, 2), 'utf-8');
      console.log(`  ✅ Сохранено: ${metaPath}\n`);
    } else {
      console.log(`  ❌ JSON не найден в ответе\n`);
    }
  } catch (err: any) {
    console.error(`  ❌ ${err.message}\n`);
  }
}

console.log('🏁 Готово!');
