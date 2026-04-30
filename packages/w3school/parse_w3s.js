import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

// Настройка для сохранения блоков кода
turndownService.addRule('w3-example', {
  filter: (node) => node.classList.contains('w3-example'),
  replacement: (content, node) => {
    const code = node.querySelector('pre, .w3-code')?.textContent || '';
    return '\n```javascript\n' + code.trim() + '\n```\n';
  }
});

const BASE_DIR = 'www.w3schools.com';
const OUTPUT_DIR = 'output';
const W3S_URL = 'https://www.w3schools.com';

// Список папок и файлов для исключения
const EXCLUDE_DIRS = ['lib', 'robots.txt'];

/**
 * Получает список курсов динамически, сканируя директорию
 */
function getAvailableCourses() {
  if (!existsSync(BASE_DIR)) return [];

  return readdirSync(BASE_DIR, { withFileTypes: true })
    .filter(dirent => {
      // Исключаем если в списке EXCLUDE_DIRS или не директория
      if (EXCLUDE_DIRS.includes(dirent.name)) return false;
      return dirent.isDirectory();
    })
    .map(dirent => dirent.name)
    .filter(name => {
      const coursePath = join(BASE_DIR, name);
      // Считаем курсом только если есть файл индекса
      return existsSync(join(coursePath, 'default.asp.html')) ||
        existsSync(join(coursePath, 'index.php.html'));
    });
}

// Карта замен для плейсхолдеров
const replacements = {
  '{{title}}': 'GitHub',
  '{{remoteName}}': 'github'
};

function applyReplacements(text) {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }
  return result;
}

/**
 * Основная функция парсинга курса
 */
function parseCourse(courseName, options = {}) {
  const coursePath = join(BASE_DIR, courseName);
  const courseOutDir = join(OUTPUT_DIR, courseName);

  // Если режим force, удаляем старую директорию курса
  if (options.force && existsSync(courseOutDir)) {
    console.log(`  [clean] Удаление старых файлов в ${courseOutDir}...`);
    rmSync(courseOutDir, { recursive: true, force: true });
  }

  if (!existsSync(courseOutDir)) mkdirSync(courseOutDir, { recursive: true });

  console.log(`\n>>> Обработка курса: ${courseName.toUpperCase()}`);

  const indexFile = existsSync(join(coursePath, 'default.asp.html'))
    ? 'default.asp.html'
    : (existsSync(join(coursePath, 'index.php.html')) ? 'index.php.html' : null);

  if (!indexFile) {
    console.warn(`  [!] Файл индекса не найден для ${courseName}`);
    return;
  }

  const html = readFileSync(join(coursePath, indexFile), 'utf-8');
  const $ = cheerio.load(html);

  const sections = [];
  let currentSection = null;

  $('#leftmenuinnerinner').children().each((_, el) => {
    const $el = $(el);

    if ($el.is('h2')) {
      currentSection = {
        topic: applyReplacements($el.text().trim()),
        lessons: []
      };
      sections.push(currentSection);
    } else if ($el.is('a') && $el.attr('target') === '_top') {
      if (!currentSection) {
        currentSection = { topic: "Introduction", lessons: [] };
        sections.push(currentSection);
      }

      const href = $el.attr('href');
      const cleanName = href.split('?')[0].replace(/%3F.*/, '');
      const lessonTitle = applyReplacements($el.text().trim());

      currentSection.lessons.push({
        title: lessonTitle,
        originalFile: href,
        fileName: cleanName,
        url: `${W3S_URL}/${courseName}/${cleanName}`
      });
    }
  });

  sections.forEach(section => {
    section.lessons.forEach(lesson => {
      const originalFile = decodeURIComponent(lesson.originalFile);
      let lessonFilePath = join(coursePath, originalFile);

      // Умная проверка расширения
      if (!existsSync(lessonFilePath)) {
        if (existsSync(lessonFilePath + '.html')) {
          lessonFilePath += '.html';
        } else {
          return;
        }
      }

      let outFileName = lesson.fileName;
      if (outFileName.includes('.')) {
        outFileName = outFileName.substring(0, outFileName.lastIndexOf('.')) + '.md';
      } else {
        outFileName += '.md';
      }

      const fullOutPath = join(courseOutDir, outFileName);

      if (options.onlyNew && existsSync(fullOutPath)) {
        lesson.mdFile = outFileName;
        return;
      }

      const lessonHtml = readFileSync(lessonFilePath, 'utf-8');
      const $l = cheerio.load(lessonHtml);

      let $content = $l('#main');
      if ($content.length === 0) $content = $l('#mainContent');
      if ($content.length === 0) return;

      $content.find('.nextprev, #mainLeaderboard, #midcontentadcontainer, .ws-hide-on-logged-in, #auth-bar-container, .pagemenu, script, style, .user-profile-bottom-wrapper, #remoteNameContent').remove();

      const h1 = $content.find('h1').first();
      const pageTitle = h1.length ? h1.text().trim() : lesson.title;
      h1.remove();

      let markdown = turndownService.turndown($content.html());
      markdown = applyReplacements(markdown);

      const cleanTitle = applyReplacements(pageTitle);
      writeFileSync(fullOutPath, `# ${cleanTitle}\n\n${markdown}`);
      lesson.mdFile = outFileName;
      console.log(`  [gen] Создан: ${outFileName}`);
    });
  });

  // Создаем очищенную версию для JSON (без технических полей)
  const cleanedSections = sections.map(section => ({
    ...section,
    lessons: section.lessons.map(({ originalFile, fileName, mdFile, ...lesson }) => lesson)
  })) ;

  writeFileSync(join(courseOutDir, 'syllabus.json'), JSON.stringify(cleanedSections, null, 2));

  let readme = `# ${courseName.toUpperCase()} Course\n\n`;
  sections.forEach(section => {
    readme += `## ${section.topic}\n`;
    section.lessons.forEach(lesson => {
      if (lesson.mdFile) {
        readme += `- [${lesson.title}](${lesson.mdFile}) ([Original](${lesson.url}))\n`;
      }
    });
    readme += '\n';
  });
  writeFileSync(join(courseOutDir, 'README.md'), readme);
}

function main() {
  const allAvailable = getAvailableCourses();
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force'),
    onlyNew: args.includes('--new'),
    course: null
  };

  const courseIdx = args.indexOf('--course');
  if (courseIdx !== -1 && args[courseIdx + 1]) {
    options.course = args[courseIdx + 1].toLowerCase();
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Использование: bun run parse_w3s.js [опции]

Опции:
  --new       Парсить только те файлы, которых еще нет в output/
  --force     Полная перезапись (удаляет папку курса перед началом)
  --course N  Парсить только определенный курс (например: --course git)
  --help      Показать эту справку
        `);
    return;
  }

  let targetCourses = allAvailable;
  if (options.course) {
    if (allAvailable.includes(options.course)) {
      targetCourses = [options.course];
    } else {
      console.error(`Ошибка: Курс "${options.course}" не найден или не содержит файлов индекса.`);
      console.log(`Доступные курсы: ${allAvailable.join(', ')}`);
      return;
    }
  }

  console.log('--- ЗАПУСК ПАРСЕРА ---');
  console.log(`Найдено доступных курсов: ${allAvailable.length}`);
  if (options.force) console.log('Режим: Полная перезапись');
  if (options.onlyNew) console.log('Режим: Только новые файлы');

  targetCourses.forEach(c => parseCourse(c, options));

  console.log('\n--- ПАРСИНГ ЗАВЕРШЕН ---');
}

main();
