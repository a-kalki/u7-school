import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import type { ContentSnapshot } from '../../../domain/content-snapshot';
import type { Course } from '../../../domain/course/entity';
import type { CourseApiModuleMeta } from '../../../domain/module';

/** Эмодзи для направлений */
const TRACK_EMOJI: Record<string, string> = {
  tech: '💻',
  business: '💼',
};
const DEFAULT_TRACK_EMOJI = '📚';

/**
 * Story «Программы курсов» — каталог курсов (S00, S00a, S00b).
 * Доступна всем ролям.
 *
 * S00:  список опубликованных курсов.
 * S00a: карточка курса.
 * S00b: программа курса (drill-down этап→модуль→проект→урок→шаги).
 */
export class CourseCatalogStory extends U7BotUserStory<CourseApiModuleMeta> {
  readonly name = 'course-catalog';

  // ── Главное меню ──

  override async handleStart(_actor: User): Promise<MainMenuAction | null> {
    return {
      kind: 'callback',
      text: '📖 Программы курсов',
      action: this.cb('list'),
      priority: 10,
    };
  }

  override async handleHelpDescription(_actor: User): Promise<string | null> {
    return '📖 Программы курсов — каталог учебных курсов и их структура';
  }

  // ── Callback ──

  override async handleCallback(
    action: string,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, ...ids] = action.split(':');

    switch (cmd) {
      case 'list':
        return this.#handleList();
      case 'view':
        return this.#handleView(ids.join(':'));
      case 'program': {
        const sub = ids[0] ?? '';
        const rest = ids.slice(1);
        switch (sub) {
          case 'module':
            return this.#handleModuleProgram(
              rest[0] ?? '',
              Number(rest[1]),
              rest[2] ?? '',
            );
          case 'lesson':
            return this.#handleLessonProgram(
              rest[0] ?? '',
              Number(rest[1]),
              rest[2] ?? '',
              Number(rest[3]),
              Number(rest[4]),
            );
          default:
            return this.#handleProgram(ids.join(':'));
        }
      }
      default:
        return {
          sendMessage: { text: '⚠️ Неизвестная команда каталога курсов' },
        };
    }
  }

  // ── Сообщения ──

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  // ── Приватные: S00 — список курсов ──

  async #handleList(): Promise<BotResponse> {
    const courses = (await this.moduleApi.execute(
      'list-courses',
      {},
    )) as Course[];

    if (courses.length === 0) {
      return {
        sendMessage: {
          text: '📖 *Программы курсов*\n\nПока нет доступных курсов\\.',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [[{ text: '↩️ Главное меню', code: 'app:main-menu' }]],
            isMultiple: false,
          },
        },
      };
    }

    const lines: string[] = ['📖 *Программы курсов*', ''];

    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (const course of courses) {
      const direction = this.#getDirectionEmoji(course);
      const desc =
        course.description.length > 60
          ? `${this.escapeMarkdown(course.description.slice(0, 60))}...`
          : this.escapeMarkdown(course.description);
      const moduleCount = this.#countModules(course);

      lines.push(
        `${direction} *${this.escapeMarkdown(course.title)}*`,
        `  ${desc}`,
        `  📦 ${moduleCount} модул${this.#plural(moduleCount, 'ь', 'я', 'ей')}`,
        '',
      );

      rows.push([
        {
          text: `${direction} ${course.title}`,
          code: this.cb('view', course.uuid),
        },
      ]);
    }

    rows.push([{ text: '↩️ Главное меню', code: 'app:main-menu' }]);

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ── Приватные: S00a — карточка курса ──

  async #handleView(courseId: string): Promise<BotResponse> {
    if (!courseId) {
      return { sendMessage: { text: '⚠️ Курс не указан' } };
    }

    let course: Course;
    try {
      course = (await this.moduleApi.execute('get-course', {
        uuid: courseId,
      })) as Course;
    } catch {
      return {
        sendMessage: { text: '⚠️ Курс не найден или недоступен' },
      };
    }

    const direction = this.#getDirectionEmoji(course);
    const moduleCount = this.#countModules(course);
    const phaseCount = course.phases.length;

    const lines: string[] = [
      `${direction} *${this.escapeMarkdown(course.title)}*`,
      '',
      `_${this.escapeMarkdown(course.description)}_`,
      '',
      `📊 *Сводка:* ${phaseCount} этап${this.#plural(phaseCount, '', 'а', 'ов')} · ${moduleCount} модул${this.#plural(moduleCount, 'ь', 'я', 'ей')}`,
      '',
      '*Этапы:*',
    ];

    for (const phase of course.phases) {
      const phaseEmoji = phase.track
        ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
        : '📌';
      lines.push(
        `  ${phaseEmoji} ${this.escapeMarkdown(phase.title)} — ${phase.moduleIds.length} модул${this.#plural(phase.moduleIds.length, 'ь', 'я', 'ей')}`,
      );
    }

    const rows: Array<Array<{ text: string; code: string }>> = [
      [
        {
          text: '📖 Развернуть программу',
          code: this.cb('program', courseId),
        },
      ],
      [
        {
          text: '📚 Найти поток',
          code: this.cbFor('catalog', 'list'),
        },
      ],
      [{ text: '⬅️ Назад к списку', code: this.cb('list') }],
    ];

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ── Приватные: S00b — программа курса (drill-down, 3 уровня) ──

  /** S00b.1: этапы + модули каждого этапа inline */
  async #handleProgram(courseId: string): Promise<BotResponse> {
    if (!courseId) {
      return { sendMessage: { text: '⚠️ Курс не указан' } };
    }

    let course: Course;
    try {
      course = (await this.moduleApi.execute('get-course', {
        uuid: courseId,
      })) as Course;
    } catch {
      return { sendMessage: { text: '⚠️ Курс не найден или недоступен' } };
    }

    const lines: string[] = [
      `📖 *Программа: ${this.escapeMarkdown(course.title)}*`,
      '',
    ];

    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (let pi = 0; pi < course.phases.length; pi++) {
      const phase = course.phases[pi];
      if (!phase) continue;
      const emoji = phase.track
        ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
        : '📌';
      const modCount = phase.moduleIds.length;

      lines.push(
        `${emoji} *${this.escapeMarkdown(phase.title)}* — ${modCount} модул${this.#plural(modCount, 'ь', 'я', 'ей')}`,
      );

      // Модули этапа inline (один уровень вниз)
      for (const modId of phase.moduleIds) {
        try {
          const mod = (await this.moduleApi.execute('get-module', {
            uuid: modId,
          })) as { title: string };
          lines.push(`    📦 ${this.escapeMarkdown(mod.title)}`);
        } catch {
          lines.push(`    📦 _модуль ${modId.slice(0, 8)}\\.\\.\\._`);
        }

        rows.push([
          {
            text: `📦 ${modId.slice(0, 30)}`,
            code: this.cb('program:module', courseId, String(pi), modId),
          },
        ]);
      }

      lines.push('');
    }

    rows.push([
      { text: '⬅️ Назад к карточке', code: this.cb('view', courseId) },
    ]);

    return {
      sendMessage: {
        text: this.#truncate(lines.join('\n')),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  /** S00b.2: проекты + уроки каждого проекта inline */
  async #handleModuleProgram(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
  ): Promise<BotResponse> {
    if (!moduleId) {
      return { sendMessage: { text: '⚠️ Модуль не указан' } };
    }

    let snapshot: ContentSnapshot;
    try {
      snapshot = (await this.moduleApi.execute('get-module-snapshot', {
        moduleId,
      })) as ContentSnapshot;
    } catch {
      return { sendMessage: { text: '⚠️ Модуль не найден или недоступен' } };
    }

    const lines: string[] = [];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (let pi = 0; pi < snapshot.length; pi++) {
      const project = snapshot[pi];
      if (!project) continue;
      const lessonCount = project.lessons.length;
      const totalSteps = project.lessons.reduce(
        (s: number, l) => s + l.stepIds.length,
        0,
      );

      lines.push(
        `🗂️ *${this.escapeMarkdown(project.projectTitle)}* — ${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}, ${totalSteps} шаг${this.#plural(totalSteps, '', 'а', 'ов')}`,
      );

      // Уроки проекта inline (один уровень вниз)
      for (let li = 0; li < project.lessons.length; li++) {
        const lesson = project.lessons[li];
        if (!lesson) continue;
        const sCount = lesson.stepIds.length;
        lines.push(
          `    📝 ${this.escapeMarkdown(lesson.lessonTitle)} — ${sCount} шаг${this.#plural(sCount, '', 'а', 'ов')}`,
        );

        rows.push([
          {
            text: `📝 ${lesson.lessonTitle}`,
            code: this.cb(
              'program:lesson',
              courseId,
              String(phaseIdx),
              moduleId,
              String(pi),
              String(li),
            ),
          },
        ]);
      }

      lines.push('');
    }

    rows.push([
      { text: '⬅️ Назад к этапам', code: this.cb('program', courseId) },
    ]);

    return {
      sendMessage: {
        text: this.#truncate(lines.join('\n')),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  /** S00b.3: заголовки шагов урока (тела скрыты) */
  async #handleLessonProgram(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
    projectIdx: number,
    lessonIdx: number,
  ): Promise<BotResponse> {
    if (!moduleId) {
      return { sendMessage: { text: '⚠️ Модуль не указан' } };
    }

    let snapshot: ContentSnapshot;
    try {
      snapshot = (await this.moduleApi.execute('get-module-snapshot', {
        moduleId,
      })) as ContentSnapshot;
    } catch {
      return { sendMessage: { text: '⚠️ Модуль не найден или недоступен' } };
    }

    const project = snapshot[projectIdx];
    if (!project) {
      return { sendMessage: { text: '⚠️ Проект не найден' } };
    }

    const lesson = project.lessons[lessonIdx];
    if (!lesson) {
      return { sendMessage: { text: '⚠️ Урок не найден' } };
    }

    const lines: string[] = [
      `📝 *${this.escapeMarkdown(lesson.lessonTitle)}*`,
      '',
    ];

    if (lesson.stepIds.length === 0) {
      lines.push('_В этом уроке пока нет шагов_');
    } else {
      const stepsByLesson = (await this.moduleApi.execute(
        'get-steps-by-lessons',
        { lessonIds: [lesson.lessonId] },
      )) as Record<string, Array<{ uuid: string; description: string }>>;

      const steps = stepsByLesson[lesson.lessonId] ?? [];

      if (steps.length === 0) {
        lines.push('_В этом уроке пока нет шагов_');
      } else {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (!step) continue;
          lines.push(
            `    ${this.escapeMarkdown(`${i + 1}.`)} ${this.escapeMarkdown(step.description)}`,
          );
        }
      }
    }

    return {
      sendMessage: {
        text: this.#truncate(lines.join('\n')),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '⬅️ Назад к модулю',
                code: this.cb(
                  'program:module',
                  courseId,
                  String(phaseIdx),
                  moduleId,
                ),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  /** Определяет эмодзи направления курса по первому phase с track */
  #getDirectionEmoji(course: Course): string {
    for (const phase of course.phases) {
      if (phase.track) {
        const emoji = TRACK_EMOJI[phase.track];
        if (emoji) return emoji;
      }
    }
    return DEFAULT_TRACK_EMOJI;
  }

  /** Подсчитывает общее число модулей во всех фазах курса */
  #countModules(course: Course): number {
    return course.phases.reduce(
      (sum: number, phase) => sum + (phase.moduleIds?.length ?? 0),
      0,
    );
  }

  /** Склонение: plural(1, 'ь', 'я', 'ей') → 'ь', plural(3, 'ь', 'я', 'ей') → 'я' */
  #plural(count: number, one: string, two: string, five: string): string {
    const n = count % 100;
    if (n >= 11 && n <= 19) return five;
    const r = n % 10;
    if (r === 1) return one;
    if (r >= 2 && r <= 4) return two;
    return five;
  }

  /** Обрезает текст до maxLen символов (с экранированным многоточием) */
  #truncate(text: string, maxLen = 4000): string {
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen - 15)}${this.escapeMarkdown('...')}`;
  }
}
