/**
 * Склейка чанков в полные конспекты + разделение на концептуальные части.
 * Запуск: bun run packages/video-summarizer/src/merge-chunks.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const CHUNKS_OUT =
  '/home/nur/dev/kalki/u7-school/packages/video-summarizer/output/youtube/chunks';
const MERGED_OUT =
  '/home/nur/dev/kalki/u7-school/packages/video-summarizer/output/youtube';

const apiKey = Bun.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ Переменная GEMINI_API_KEY не установлена');
  process.exit(1);
}

// Группируем чанки по имени видео
const chunkFiles = fs
  .readdirSync(CHUNKS_OUT)
  .filter((f) => f.endsWith('.md'))
  .sort();

const groups = new Map<string, string[]>();
for (const f of chunkFiles) {
  // Из "Имя видео_part1.md" → "Имя видео"
  const base = f.replace(/_part\d+\.md$/, '');
  if (!groups.has(base)) groups.set(base, []);
  groups.get(base)?.push(f);
}

const DIVIDE_PROMPT = `Ты — архитектор учебных программ. У тебя есть полный конспект видео-урока по JavaScript (собран из нескольких частей). На основе этого конспекта предложи оптимальное разделение видео на концептуальные части для поэтапного изучения.

Конспект урока:
---
{SUMMARY}
---

**Задача:** предложи разделение видео на **2-4 логические части**. Так как у тебя нет точных временных меток, укажи **смысловые границы** — после какого раздела/темы конспекта заканчивается одна часть и начинается следующая.

Для каждой части укажи:

1. **Номер части** — Часть 1, Часть 2, ...
2. **Название части** — короткое и ёмкое (3-7 слов)
3. **Смысловая граница** — опиши, какой раздел конспекта является последним в этой части, а какой — первым в следующей (например: «Часть заканчивается на разделе "Цикл for", следующая начинается с "Цикл while"»)
4. **Описание** — 1 предложение, о чём эта часть

Затем дай:
5. **Обоснование разделения** — 2-3 предложения, почему такое разделение оптимально
6. **Рекомендация по вступительным титрам** — нужны ли короткие (2-3 сек) титры в начале каждой части? Если да — предложи текст для каждой.

**Формат:** Markdown.`;

console.log(
  `📦 Группировка: ${groups.size} видео из ${chunkFiles.length} чанков\n`,
);

let groupIdx = 0;
for (const [base, parts] of groups) {
  groupIdx++;
  console.log(`[${groupIdx}/${groups.size}] ${base} (${parts.length} части)`);

  // Склеиваем конспекты
  let merged = `# ${base}\n\n`;
  for (const part of parts) {
    const content = fs.readFileSync(path.join(CHUNKS_OUT, part), 'utf-8');
    merged += `${content}\n\n---\n\n`;
  }

  // Сохраняем склеенный конспект
  const mergedPath = path.join(MERGED_OUT, `${base}.md`);
  fs.writeFileSync(mergedPath, merged, 'utf-8');
  console.log(`  ✅ Склеен: ${mergedPath}`);

  // Запрашиваем разделение на части у Gemini
  const dividePrompt = DIVIDE_PROMPT.replace('{SUMMARY}', merged);
  try {
    console.log('  Запрашиваю разделение на части...');
    // Используем текстовый запрос (без видео)
    const divideResult = await callGeminiText(dividePrompt, apiKey);

    // Дописываем разделение в конец файла
    const divideSection = `\n\n---\n\n## Разделение на части для изучения\n\n${divideResult}`;
    fs.appendFileSync(mergedPath, divideSection, 'utf-8');
    console.log(`  ✅ Разделение добавлено\n`);
  } catch (err: any) {
    console.error(`  ⚠️ Не удалось получить разделение: ${err.message}\n`);
  }
}

console.log('🏁 Готово!');

/** Отправляет текстовый промпт в Gemini и возвращает ответ. */
async function callGeminiText(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`[${resp.status}] ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Пустой ответ';
}
