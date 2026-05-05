import * as fs from 'fs';
import * as path from 'path';

/**
 * Описание данных, загружаемых из about.md.
 */
export interface AboutData {
  /** Заголовок (строка с одним #), если есть */
  title?: string;
  /** Оставшееся тело документа без начальных пустых строк */
  body: string;
}

/**
 * Парсит текст markdown в заголовок и тело.
 * 
 * @param markdown Исходный текст в формате markdown
 * @returns Извлеченные данные AboutData
 */
export function parseAboutMarkdown(markdown: string): AboutData {
  const lines = markdown.split('\n');
  let title: string | undefined = undefined;
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    
    if (line.startsWith('# ')) {
      title = line.substring(2).trim();
      bodyStartIndex = i + 1;
      break;
    } else if (line.trim() !== '') {
      break;
    }
  }

  // Пропускаем начальные пустые строки для тела
  while (bodyStartIndex < lines.length && lines[bodyStartIndex] !== undefined && lines[bodyStartIndex]!.trim() === '') {
    bodyStartIndex++;
  }

  const body = lines.slice(bodyStartIndex).join('\n');

  return { title, body };
}

/**
 * Загружает и парсит файл about.md из указанной директории.
 * 
 * @param dirPath Путь к директории, где находится about.md
 * @returns Распарсенные данные
 * @throws Ошибка, если файл не найден или недоступен
 */
export async function loadAboutFile(dirPath: string): Promise<AboutData> {
  const aboutPath = path.join(dirPath, 'about.md');
  try {
    const content = await fs.promises.readFile(aboutPath, 'utf-8');
    return parseAboutMarkdown(content);
  } catch (err) {
    throw new Error(`Файл about.md не найден или не может быть загружен по пути: ${aboutPath}`);
  }
}
