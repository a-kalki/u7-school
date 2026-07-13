import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
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
      text: '📚 Программы курсов',
      action: this.cb('list'),
      priority: 15,
    };
  }

  override async handleHelpDescription(_actor: User): Promise<string | null> {
    return '📚 Программы курсов — каталог учебных курсов и их структура';
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
          case 'phase':
            return this.#handlePhase(rest[0] ?? '', Number(rest[1]));
          case 'module':
            return this.#handleModuleProgram(rest[0] ?? '');
          case 'project':
            return this.#handleProject(rest[0] ?? '', Number(rest[1]));
          case 'lesson':
            return this.#handleLessonProgram(
              rest[0] ?? '',
              Number(rest[1]),
              Number(rest[2]),
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
          text: '📚 *Программы курсов*\n\nПока нет доступных курсов\\.',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [[{ text: '↩️ Главное меню', code: 'app:main-menu' }]],
            isMultiple: false,
          },
        },
      };
    }

    const lines: string[] = ['📚 *Программы курсов*', ''];

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

  // ── Приватные: S00b — программа курса (drill-down) ──

  /** S00b.0: список этапов курса */
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

    for (let i = 0; i < course.phases.length; i++) {
      const phase = course.phases[i];
      if (!phase) continue;
      const emoji = phase.track
        ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
        : '📌';
      const modCount = phase.moduleIds.length;

      lines.push(
        `${emoji} *${this.escapeMarkdown(phase.title)}* — ${modCount} модул${this.#plural(modCount, 'ь', 'я', 'ей')}`,
      );

      rows.push([
        {
          text: `${emoji} ${phase.title}`,
          code: this.cb('program:phase', courseId, String(i)),
        },
      ]);
    }

    rows.push([
      { text: '⬅️ Назад к карточке', code: this.cb('view', courseId) },
    ]);

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  /** S00b.1: модули этапа */
  async #handlePhase(courseId: string, phaseIdx: number): Promise<BotResponse> {
    if (!courseId || Number.isNaN(phaseIdx)) {
      return { sendMessage: { text: '⚠️ Некорректный запрос' } };
    }

    let course: Course;
    try {
      course = (await this.moduleApi.execute('get-course', {
        uuid: courseId,
      })) as Course;
    } catch {
      return { sendMessage: { text: '⚠️ Курс не найден или недоступен' } };
    }

    const phase = course.phases[phaseIdx];
    if (!phase) {
      return { sendMessage: { text: '⚠️ Этап не найден' } };
    }

    const emoji = phase.track
      ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
      : '📌';

    const lines: string[] = [
      `${emoji} *${this.escapeMarkdown(phase.title)}*`,
      '',
    ];

    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (const modId of phase.moduleIds) {
      let title = modId;
      try {
        const mod = (await this.moduleApi.execute('get-module', {
          uuid: modId,
        })) as { title: string };
        title = mod.title ?? modId;
      } catch {
        // модуль не загружен — показываем id
      }

      lines.push(`  📦 ${this.escapeMarkdown(title)}`);

      rows.push([
        {
          text: `📦 ${title}`,
          code: this.cb('program:module', modId),
        },
      ]);
    }

    rows.push([
      { text: '⬅️ Назад к этапам', code: this.cb('program', courseId) },
    ]);

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  /** S00b.2: проекты модуля */
  async #handleModuleProgram(moduleId: string): Promise<BotResponse> {
    if (!moduleId) {
      return { sendMessage: { text: '⚠️ Модуль не указан' } };
    }

    const snapshot = (await this.moduleApi.execute('get-module-snapshot', {
      moduleId,
    })) as Array<{
      projectId: string;
      projectTitle: string;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        stepIds: string[];
      }>;
    }>;

    if (!snapshot || snapshot.length === 0) {
      return {
        sendMessage: { text: '📦 В этом модуле пока нет проектов' },
      };
    }

    const lines: string[] = ['📦 *Проекты модуля*', ''];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (let i = 0; i < snapshot.length; i++) {
      const project = snapshot[i];
      if (!project) continue;
      const lessonCount = project.lessons.length;
      const stepCount = project.lessons.reduce(
        (sum: number, l) => sum + l.stepIds.length,
        0,
      );

      lines.push(
        `  🗂️ *${this.escapeMarkdown(project.projectTitle)}* — ${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}, ${stepCount} шаг${this.#plural(stepCount, '', 'а', 'ов')}`,
      );

      rows.push([
        {
          text: `🗂️ ${project.projectTitle}`,
          code: this.cb('program:project', moduleId, String(i)),
        },
      ]);
    }

    rows.push([{ text: '⬅️ Назад', code: 'app:main-menu' }]);

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  /** S00b.3: уроки проекта */
  async #handleProject(
    moduleId: string,
    projectIdx: number,
  ): Promise<BotResponse> {
    if (!moduleId || Number.isNaN(projectIdx)) {
      return { sendMessage: { text: '⚠️ Некорректный запрос' } };
    }

    const snapshot = (await this.moduleApi.execute('get-module-snapshot', {
      moduleId,
    })) as Array<{
      projectId: string;
      projectTitle: string;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        stepIds: string[];
      }>;
    }>;

    const project = snapshot[projectIdx];
    if (!project) {
      return { sendMessage: { text: '⚠️ Проект не найден' } };
    }

    const lines: string[] = [
      `🗂️ *${this.escapeMarkdown(project.projectTitle)}*`,
      '',
    ];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (let i = 0; i < project.lessons.length; i++) {
      const lesson = project.lessons[i];
      if (!lesson) continue;
      const sCount = lesson.stepIds.length;

      lines.push(
        `  📝 *${this.escapeMarkdown(lesson.lessonTitle)}* — ${sCount} шаг${this.#plural(sCount, '', 'а', 'ов')}`,
      );

      rows.push([
        {
          text: `📝 ${lesson.lessonTitle}`,
          code: this.cb(
            'program:lesson',
            moduleId,
            String(projectIdx),
            String(i),
          ),
        },
      ]);
    }

    rows.push([
      {
        text: '⬅️ Назад к проектам',
        code: this.cb('program:module', moduleId),
      },
    ]);

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  /** S00b.4: заголовки шагов урока */
  async #handleLessonProgram(
    moduleId: string,
    projectIdx: number,
    lessonIdx: number,
  ): Promise<BotResponse> {
    if (!moduleId || Number.isNaN(projectIdx) || Number.isNaN(lessonIdx)) {
      return { sendMessage: { text: '⚠️ Некорректный запрос' } };
    }

    const snapshot = (await this.moduleApi.execute('get-module-snapshot', {
      moduleId,
    })) as Array<{
      projectId: string;
      projectTitle: string;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        stepIds: string[];
      }>;
    }>;

    const project = snapshot[projectIdx];
    if (!project) {
      return { sendMessage: { text: '⚠️ Проект не найден' } };
    }

    const lesson = project.lessons[lessonIdx];
    if (!lesson) {
      return { sendMessage: { text: '⚠️ Урок не найден' } };
    }

    const stepsByLesson = (await this.moduleApi.execute(
      'get-steps-by-lessons',
      { lessonIds: [lesson.lessonId] },
    )) as Record<string, Array<{ uuid: string; description: string }>>;

    const steps = stepsByLesson[lesson.lessonId] ?? [];

    const lines: string[] = [
      `📝 *${this.escapeMarkdown(lesson.lessonTitle)}*`,
      '',
    ];

    if (steps.length === 0) {
      lines.push('_В этом уроке пока нет шагов_');
    } else {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step) continue;
        lines.push(
          `  ${this.escapeMarkdown(`${i + 1}.`)} ${this.escapeMarkdown(step.description)}`,
        );
      }
    }

    const rows: Array<Array<{ text: string; code: string }>> = [
      [
        {
          text: '⬅️ Назад к урокам',
          code: this.cb('program:project', moduleId, String(projectIdx)),
        },
      ],
    ];

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ── Утилиты ──

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
}
