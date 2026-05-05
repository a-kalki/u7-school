import { describe, expect, it } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { parseAboutMarkdown, loadAboutFile } from './about-parser';

describe('about-parser (Парсер about.md)', () => {
  it('должен корректно парсить markdown в заголовок и тело', () => {
    const markdown = `# Добро пожаловать в модуль Курсов!

Это описание.

**Для всех**
- Действие 1
`;
    const result = parseAboutMarkdown(markdown);
    expect(result.title).toBe('Добро пожаловать в модуль Курсов!');
    expect(result.body).toBe('Это описание.\n\n**Для всех**\n- Действие 1\n');
  });

  it('должен парсить markdown без заголовка', () => {
    const markdown = `Просто какой-то текст.`;
    const result = parseAboutMarkdown(markdown);
    expect(result.title).toBeUndefined();
    expect(result.body).toBe('Просто какой-то текст.');
  });
  
  it('должен загружать файл about.md из директории', async () => {
    const testDir = path.join(__dirname, 'test-data');
    await fs.promises.mkdir(testDir, { recursive: true });
    await fs.promises.writeFile(path.join(testDir, 'about.md'), '# Тестовый заголовок\nТекст тела');
    
    const result = await loadAboutFile(testDir);
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Тестовый заголовок');
    expect(result?.body).toBe('Текст тела');
    
    // Очистка
    await fs.promises.rm(testDir, { recursive: true, force: true });
  });

  it('должен выбрасывать ошибку, если about.md не существует', async () => {
    expect(loadAboutFile(__dirname)).rejects.toThrow(); // здесь нет about.md
  });
});
