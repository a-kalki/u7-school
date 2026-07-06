/**
 * distribute-lesson.ts — рассылка шагов урока в Telegram-канал потока.
 *
 * ## Назначение
 * Отправляет шаги уроков в Telegram точно так же, как это делает бот
 * в реальном приложении. Одновременно является интеграционным тестом:
 *   - `get-module-snapshot` use-case (структура проектов и уроков)
 *   - `get-lesson` use-case (LessonJsonRepo, visibility-политики)
 *   - `get-step` use-case (StepJsonRepo, все kind: text/code/file)
 *   - `safeConvert` — конвертация Markdown → Telegram MarkdownV2
 *   - Полный пайплайн форматирования и отправки (parse_mode: 'MarkdownV2')
 *
 * ## Использование
 *   bun run scripts/distribute-lesson.ts mA-pB-lC [опции]
 *   bun run scripts/distribute-lesson.ts A:B:C [опции]
 *
 * ### Примеры
 *   # Отправить все шаги урока 2:1:3 себе в личку (по умолчанию)
 *   bun run scripts/distribute-lesson.ts m2-p1-l3
 *
 *   # Отправить в группу потока
 *   bun run scripts/distribute-lesson.ts 2:1:3 --group
 *
 *   # Отправить один шаг (№2) конкретному человеку
 *   bun run scripts/distribute-lesson.ts 2:1:3 2 --to=773084180
 *
 *   # Предпросмотр в консоли (без отправки) — как увидит студент
 *   bun run scripts/distribute-lesson.ts 2:1:3 --preview
 *
 *   # Отправить ВСЕ шаги ВСЕХ уроков проекта 2:1 — полный студенческий опыт
 *   bun run scripts/distribute-lesson.ts 2:1 --all
 *
 *   # Предпросмотр всего проекта в консоли
 *   bun run scripts/distribute-lesson.ts 2:1 --all --preview
 *
 * ### Флаги
 *   --preview     Вывод в консоль вместо отправки в Telegram
 *   --group       Отправка в группу потока (по умолчанию — в личку)
 *   --to=<id>     Отправка в чат с указанным Telegram ID
 *   --all         Все шаги всех уроков проекта (требует формат A:B)
 *
 * ## Режим предпросмотра (--preview)
 * Выводит шаги в консоль с тем же форматированием MarkdownV2,
 * которое получит студент. Позволяет проверить:
 *   - Корректность контента (опечатки, ссылки)
 *   - Корректность форматирования (жирный, код, списки)
 *   - Порядок шагов и нумерацию
 *
 * ## Полный прогон (--all)
 * Отправляет ВСЕ шаги ВСЕХ уроков проекта последовательно.
 * Имитирует полный путь студента через проект: каждый шаг
 * форматируется и отправляется точно так же, как в боте.
 * Позволяет проверить:
 *   - Связность уроков (переходы, нарастание сложности)
 *   - Отсутствие пропущенных шагов
 *   - Общее впечатление от прохождения
 *
 * ## Временные отступления
 * - **Менторские шаги не отправляются**: скрипт работает только с stepIds,
 *   не с mentorStepIds. Когда менторские шаги будут интегрированы,
 *   добавится флаг `--mentor` для их рассылки.
 */
import { safeConvert } from '../packages/core/src/shared/markdown.ts';
import { createApp, NUR_UUID } from './_app-factory';

const BOT_TOKEN = '8781337572:AAGWv3f924aZisUW3z47n8BPDusyfKAjIWg';
const DEFAULT_CHAT_ID = '-1003960918937'; // группа потока
const MENTOR_CHAT_ID = '773084180'; // личка ментора

// ─── Типы данных API ───

type SnapshotLesson = { lessonId: string; lessonTitle: string };
type SnapshotProject = { projectTitle: string; lessons: SnapshotLesson[] };

interface LessonDetail {
  stepIds: string[];
  mentorStepIds: string[];
}

interface StepDetail {
  description: string;
  kind: 'text' | 'code' | 'file';
  content?: string;
  code?: string;
  order?: number;
}

// ─── Справка ───

function showHelp() {
  console.log(`
distribute-lesson — рассылка шагов урока в Telegram.
Отправляет шаги точно так же, как это делает бот (MarkdownV2 через safeConvert).

Использование:
  bun run scripts/distribute-lesson.ts M:P:L [опции]
  bun run scripts/distribute-lesson.ts M:P:L:S [опции]    # конкретный шаг

Примеры:
  bun run scripts/distribute-lesson.ts 2:1:3               # урок → в личку
  bun run scripts/distribute-lesson.ts 2:1:3:2             # шаг 2 → в личку
  bun run scripts/distribute-lesson.ts 2:1:3 --group        # урок → в группу
  bun run scripts/distribute-lesson.ts 2:1:3:2 --to=123456  # шаг → юзеру
  bun run scripts/distribute-lesson.ts 2:1:3 --preview      # урок → в консоль
  bun run scripts/distribute-lesson.ts 2:1 --all --preview   # весь проект → консоль

Формат: M:P:L[:S] — модуль, проект, урок, шаг (вложенность)

Флаги:
  --preview     Вывод в консоль вместо отправки
  --group       Отправка в группу потока (по умолчанию — личка)
  --to=<id>     Отправка в чат с указанным Telegram ID
  --all         Все шаги всех уроков проекта (формат M:P)

Принцип: каждый запуск = интеграционный тест. Данные проходят
ModuleJsonRepo → list-modules → get-module-snapshot → get-lesson → get-step.
Форматирование — safeConvert (Markdown → Telegram MarkdownV2).
Если сломается любое звено — скрипт упадёт с ошибкой.
`);
}

// ─── Утилиты ───

/** Экранирует текст для Telegram MarkdownV2 (без разметки) */
function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~>#+\-=|{}.!]/g, '\\$&');
}

async function sendToTelegram(
  token: string,
  chatId: string,
  text: string,
): Promise<boolean> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = { chat_id: chatId, text, parse_mode: 'MarkdownV2' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

// ─── Парсинг аргументов ───

interface LessonId {
  module: number; // 1-based
  project: number; // 1-based
  lesson?: number; // 1-based (опционально для --all)
  step?: number; // 1-based (опционально — конкретный шаг)
}

function parseLessonId(arg: string): LessonId | null {
  // M:P:L:S
  const m1 = arg.match(/^(\d+):(\d+):(\d+):(\d+)$/);
  if (m1) {
    const mod = m1[1] as string;
    const proj = m1[2] as string;
    const les = m1[3] as string;
    const step = m1[4] as string;
    return { module: +mod, project: +proj, lesson: +les, step: +step };
  }

  // M:P:L
  const m2 = arg.match(/^(\d+):(\d+):(\d+)$/);
  if (m2) {
    const mod = m2[1] as string;
    const proj = m2[2] as string;
    const les = m2[3] as string;
    return { module: +mod, project: +proj, lesson: +les };
  }

  // M:P (для --all)
  const m3 = arg.match(/^(\d+):(\d+)$/);
  if (m3) {
    const mod = m3[1] as string;
    const proj = m3[2] as string;
    return { module: +mod, project: +proj };
  }

  return null;
}

// ─── Форматирование шага ───

/**
 * Форматирует шаг для отправки в Telegram.
 * Использует safeConvert — тот же конвертер, что и бот.
 */
function formatStep(
  lessonLabel: string,
  lessonTitle: string,
  step: StepDetail,
  order: number,
  total: number,
): string {
  const lines: string[] = [
    `*📚 ${escapeMarkdownV2(lessonLabel)}: ${escapeMarkdownV2(lessonTitle)}*`,
    '',
    `*Шаг ${order}/${total}:* ${escapeMarkdownV2(step.description)}`,
    '',
  ];

  if (step.kind === 'code' && step.code) {
    lines.push('```');
    lines.push(step.code);
    lines.push('```');
  } else if (step.kind === 'text' && step.content) {
    let text = safeConvert(step.content);
    // Убираем пустую строку перед списком
    text = text.replace(/\n\n(?=•)/g, '\n');
    lines.push(text);
  }

  return lines.join('\n');
}

// ─── Отправка одного шага ───

async function sendStep(
  lessonLabel: string,
  lessonTitle: string,
  step: StepDetail,
  order: number,
  total: number,
  chatId: string,
  preview: boolean,
) {
  const text = formatStep(lessonLabel, lessonTitle, step, order, total);

  if (preview) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`[ПРЕДПРОСМОТР] Шаг ${order}/${total}`);
    console.log(text);
    return;
  }

  const ok = await sendToTelegram(BOT_TOKEN, chatId, text);
  if (!ok) {
    // Fallback: без MarkdownV2
    const plain = [
      `${lessonLabel}: ${lessonTitle}`,
      `Шаг ${order}/${total}: ${step.description}`,
      '',
      step.kind === 'code' ? (step.code ?? '') : (step.content ?? ''),
    ];
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: plain.join('\n') }),
    });
  }
}

// ─── Основная логика ───

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  // Флаги
  const preview = args.includes('--preview');
  const allMode = args.includes('--all');
  const groupMode = args.includes('--group');

  // --to=<id>
  const toArg = args.find((a) => a.startsWith('--to='));
  const toId = toArg ? (toArg.split('=')[1] ?? '') : undefined;

  // Отфильтровать позиционные аргументы (всё что не флаг)
  const positional = args.filter((a) => !a.startsWith('--'));
  const lessonIdArg = positional[0];

  if (!lessonIdArg) {
    console.error(
      '❌ Укажи урок: bun run scripts/distribute-lesson.ts M:P:L [опции]',
    );
    console.error('   Формат: M:P:L[:S] — например: 2:1:3, 2:1:3:2');
    console.error('   Флаги: --preview | --all | --group | --to=<id>');
    process.exit(1);
  }

  const parsed = parseLessonId(lessonIdArg);
  if (!parsed) {
    console.error(
      '❌ Неверный формат: bun run scripts/distribute-lesson.ts M:P:L [опции]',
    );
    console.error('   Формат: M:P:L[:S] — например: 2:1:3, 2:1:3:2');
    console.error('   Флаги: --preview | --all | --group | --to=<id>');
    process.exit(1);
  }

  const stepNumber = parsed.step;

  // --all требует формат M:P (без урока)
  if (allMode && parsed.lesson !== undefined) {
    console.error('❌ --all требует формат M:P (без указания урока)');
    process.exit(1);
  }
  if (!allMode && parsed.lesson === undefined) {
    console.error(
      '❌ Укажи урок (M:P:L) или добавь флаг --all для всего проекта',
    );
    process.exit(1);
  }

  // Определяем chat_id: по умолчанию личка, --group = группа, --to=<id> = конкретный
  let chatId: string;
  if (toId) {
    chatId = toId;
  } else if (groupMode) {
    chatId = DEFAULT_CHAT_ID;
  } else {
    chatId = MENTOR_CHAT_ID;
  }

  // ─── Получаем данные через API ───

  const app = createApp(preview);

  // Загружаем список модулей для получения UUID
  type ModuleEntry = { uuid: string; title: string };
  const modules = (await app.execute(
    'list-modules',
    {},
    NUR_UUID,
  )) as ModuleEntry[];

  const moduleEntry = modules[parsed.module - 1];
  if (!moduleEntry) {
    console.error(
      `❌ Модуль ${parsed.module} не найден. Всего модулей: ${modules.length}`,
    );
    process.exit(1);
  }

  // Получаем снимок модуля
  const snapshot = (await app.execute(
    'get-module-snapshot',
    { moduleId: moduleEntry.uuid },
    NUR_UUID,
  )) as SnapshotProject[];

  const project = snapshot[parsed.project - 1];
  if (!project) {
    console.error(
      `❌ Проект ${parsed.project} не найден в модуле ${parsed.module}`,
    );
    process.exit(1);
  }

  console.log(`📦 Модуль ${parsed.module}: ${moduleEntry.title}`);
  console.log(
    `📖 Проект m${parsed.module}-p${parsed.project}: ${project.projectTitle}`,
  );

  if (allMode) {
    // Режим --all: все шаги всех уроков проекта
    console.log(
      `\n🔄 Режим: ВСЕ уроки проекта${preview ? ' (предпросмотр)' : ''}`,
    );
    console.log(`   Уроков: ${project.lessons.length}\n`);

    for (let li = 0; li < project.lessons.length; li++) {
      const lesson = project.lessons[li];
      if (!lesson) {
        console.error(`❌ Урок с индексом ${li} не найден в проекте`);
        continue;
      }
      const L = li + 1;
      const lessonLabel = `m${parsed.module}-p${parsed.project}-l${L}`;

      console.log(`${'═'.repeat(60)}`);
      console.log(`📚 ${lessonLabel}: ${lesson.lessonTitle}`);

      const detail = (await app.execute(
        'get-lesson',
        { uuid: lesson.lessonId },
        NUR_UUID,
      )) as LessonDetail;

      console.log(`   Шагов: ${detail.stepIds.length}`);

      for (let si = 0; si < detail.stepIds.length; si++) {
        const stepId = detail.stepIds[si];
        if (!stepId) continue;
        const step = (await app.execute(
          'get-step',
          { uuid: stepId },
          NUR_UUID,
        )) as StepDetail;

        const order = step.order ?? si + 1;
        console.log(
          `   [${order}/${detail.stepIds.length}] ${step.kind}: ${step.description}`,
        );

        await sendStep(
          lessonLabel,
          lesson.lessonTitle,
          step,
          order,
          detail.stepIds.length,
          chatId,
          preview,
        );

        // Пауза между шагами (в preview — без паузы)
        if (!preview && si < detail.stepIds.length - 1) {
          console.log('  ⏎ Enter — следующий шаг (q — выход)...');
          const input = await waitEnter();
          if (input.toLowerCase() === 'q') {
            console.log('  ⏹ Отменено');
            process.exit(0);
          }
        }
      }

      // Пауза между уроками
      if (!preview && li < project.lessons.length - 1) {
        console.log('\n  ⏎ Enter — следующий урок (q — выход)...');
        const input = await waitEnter();
        if (input.toLowerCase() === 'q') {
          console.log('  ⏹ Отменено');
          process.exit(0);
        }
      }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(
      `✅ Проект пройден: ${project.lessons.length} уроков${preview ? ' (предпросмотр)' : ''}`,
    );
    process.exit(0);
  }

  // ─── Режим одного урока ───

  if (parsed.lesson == null) {
    console.error('❌ Не указан номер урока (используйте формат M:P:L)');
    process.exit(1);
  }

  const lesson = project.lessons[parsed.lesson - 1];
  if (!lesson) {
    console.error(
      `❌ Урок ${parsed.lesson} не найден в проекте m${parsed.module}-p${parsed.project}`,
    );
    process.exit(1);
  }

  const lessonLabel = `m${parsed.module}-p${parsed.project}-l${parsed.lesson}`;
  const detail = (await app.execute(
    'get-lesson',
    { uuid: lesson.lessonId },
    NUR_UUID,
  )) as LessonDetail;

  console.log(
    `📖 ${lessonLabel}: ${lesson.lessonTitle}${preview ? ' (предпросмотр)' : ''}`,
  );
  console.log(`   Всего шагов: ${detail.stepIds.length}`);

  if (detail.stepIds.length === 0) {
    console.log('  ⚠️ В уроке нет шагов.');
    process.exit(0);
  }

  const stepsToSend =
    stepNumber !== undefined
      ? detail.stepIds.filter((_, i) => i + 1 === stepNumber)
      : detail.stepIds;

  if (stepsToSend.length === 0) {
    console.log(`  ⚠️ Шаг #${stepNumber ?? '?'} не найден`);
    process.exit(0);
  }

  for (let i = 0; i < stepsToSend.length; i++) {
    const stepId = stepsToSend[i];
    if (!stepId) continue;

    const step = (await app.execute(
      'get-step',
      { uuid: stepId },
      NUR_UUID,
    )) as StepDetail;

    const order = step.order ?? detail.stepIds.indexOf(stepId) + 1;
    const kindEmoji = step.kind === 'code' ? '📝' : '📄';

    console.log(`  ${'─'.repeat(50)}`);
    console.log(
      `  [${order}/${detail.stepIds.length}] ${kindEmoji} ${step.description}`,
    );

    await sendStep(
      lessonLabel,
      lesson.lessonTitle,
      step,
      order,
      detail.stepIds.length,
      chatId,
      preview,
    );

    if (stepNumber !== undefined) {
      console.log(`  ✅ ${preview ? 'Предпросмотр' : 'Отправлено'}`);
      process.exit(0);
    }

    if (i < stepsToSend.length - 1) {
      console.log('\n  ⏎ Enter — следующий (q — выход)...');
      const input = await waitEnter();
      if (input.toLowerCase() === 'q') {
        console.log('  ⏹ Отменено');
        process.exit(0);
      }
    }
  }

  console.log(`\n  ${'═'.repeat(50)}`);
  console.log(`  ✅ Все шаги ${preview ? 'показаны' : 'отправлены'}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Ошибка:', e);
  process.exit(1);
});
