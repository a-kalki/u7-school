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
 * Story «Программы курсов» — каталог курсов.
 * Доступна всем ролям.
 *
 * Единая иерархия (как «Моя учёба → Уроки»):
 *   S00:  курсы + этапы inline
 *   S00b: этапы + модули inline
 *   S00c: модули + проекты inline
 *   S00d: проекты + уроки inline
 *   S00e: уроки + заголовки шагов (без тел)
 *
 * На каждом уровне: текущие объекты жирным + кнопками,
 * подуровень — inline текстом.
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
      description: '📖 Программы курсов — каталог учебных курсов и их структура',
    };
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
      case 'phases':
        return this.#handlePhases(ids[0] ?? '');
      case 'modules':
        return this.#handleModules(ids[0] ?? '', Number(ids[1]));
      case 'projects':
        return this.#handleProjects(
          ids[0] ?? '',
          Number(ids[1]),
          ids[2] ?? '',
        );
      case 'lessons':
        return this.#handleLessons(
          ids[0] ?? '',
          Number(ids[1]),
          ids[2] ?? '',
          Number(ids[3]),
        );
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

  // ═══ Уровень 0: Курсы + этапы inline ═══

  async #handleList(): Promise<BotResponse> {
    const courses = (await this.moduleApi.execute(
      'list-courses',
      {},
    )) as Course[];

    if (courses.length === 0) {
      return {
        sendMessage: {
          text: '📖 *Курсы*\n\nПока нет доступных курсов\\.',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [[{ text: '↩️ Главное меню', code: 'app:main-menu' }]],
            isMultiple: false,
          },
        },
      };
    }

    const lines: string[] = ['📖 *Курсы*', ''];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (const course of courses) {
      const direction = this.#getDirectionEmoji(course);

      lines.push(`${direction} *Курс: ${this.#esc(course.title)}*`);

      // Этапы курса inline (один уровень вниз)
      for (const phase of course.phases) {
        const phaseEmoji = phase.track
          ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
          : '🗂️';
        const modCount = phase.moduleIds?.length ?? 0;
        lines.push(
          `    ${phaseEmoji} Этап: ${this.#esc(phase.title)} — ${modCount} модул${this.#plural(modCount, 'ь', 'я', 'ей')}`,
        );
      }

      lines.push('');

      rows.push([
        {
          text: `${direction} ${course.title}`,
          code: this.cb('phases', course.uuid),
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

  // ═══ Уровень 1: Этапы + модули inline ═══

  async #handlePhases(courseId: string): Promise<BotResponse> {
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
      `📖 *Курс: ${this.#esc(course.title)}*`,
      '',
    ];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (let pi = 0; pi < course.phases.length; pi++) {
      const phase = course.phases[pi];
      if (!phase) continue;
      const emoji = phase.track
        ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
        : '🗂️';
      const modCount = phase.moduleIds?.length ?? 0;

      lines.push(
        `${emoji} *Этап: ${this.#esc(phase.title)}* — ${modCount} модул${this.#plural(modCount, 'ь', 'я', 'ей')}`,
      );

      // Модули этапа inline (один уровень вниз) — нужны заголовки
      for (const modId of phase.moduleIds ?? []) {
        try {
          const mod = (await this.moduleApi.execute('get-module', {
            uuid: modId,
          })) as { title: string; projects?: Array<{ lessonIds: string[] }> };
          const projCount = mod.projects?.length ?? 0;
          const lessonCount =
            mod.projects?.reduce(
              (s, p) => s + (p.lessonIds?.length ?? 0),
              0,
            ) ?? 0;
          lines.push(
            `    📦 Модуль: ${this.#esc(mod.title)} — ${projCount} проект${this.#plural(projCount, '', 'а', 'ов')}, ${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}`,
          );
        } catch {
          lines.push(
            `    📦 _модуль ${modId.slice(0, 8)}\\.\\.\\._`,
          );
        }
      }

      lines.push('');

      rows.push([
        {
          text: `${emoji} ${phase.title}`,
          code: this.cb('modules', courseId, String(pi)),
        },
      ]);
    }

    rows.push([{ text: '⬅️ Назад к курсам школы', code: this.cb('list') }]);

    return {
      sendMessage: {
        text: this.#truncate(lines.join('\n')),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ═══ Уровень 2: Модули + проекты inline ═══

  async #handleModules(
    courseId: string,
    phaseIdx: number,
  ): Promise<BotResponse> {
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

    const phase = course.phases[phaseIdx];
    if (!phase) {
      return { sendMessage: { text: '⚠️ Этап не найден' } };
    }

    const phaseEmoji = phase.track
      ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
      : '🗂️';

    const lines: string[] = [
      `📖 *Этап: ${this.#esc(phase.title)}*`,
      '',
    ];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (const modId of phase.moduleIds ?? []) {
      let mod: { title: string; projects?: Array<{ uuid: string; title: string; lessonIds: string[] }> };
      try {
        mod = (await this.moduleApi.execute('get-module', {
          uuid: modId,
        })) as typeof mod;
      } catch {
        continue;
      }

      const projects = mod.projects ?? [];
      const projCount = projects.length;
      const lessonCount = projects.reduce(
        (s, p) => s + (p.lessonIds?.length ?? 0),
        0,
      );

      lines.push(
        `📦 *Модуль: ${this.#esc(mod.title)}* — ${projCount} проект${this.#plural(projCount, '', 'а', 'ов')}, ${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}`,
      );

      // Проекты модуля inline (один уровень вниз)
      for (const proj of projects) {
        const lCount = proj.lessonIds?.length ?? 0;
        lines.push(
          `    📁 Проект: ${this.#esc(proj.title)} — ${lCount} урок${this.#plural(lCount, '', 'а', 'ов')}`,
        );
      }

      lines.push('');

      rows.push([
        {
          text: `📦 ${mod.title}`,
          code: this.cb('projects', courseId, String(phaseIdx), modId),
        },
      ]);
    }

    rows.push([
      { text: '⬅️ Назад к курсу', code: this.cb('phases', courseId) },
    ]);

    return {
      sendMessage: {
        text: this.#truncate(lines.join('\n')),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ═══ Уровень 3: Проекты + уроки inline ═══

  async #handleProjects(
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

    // Получаем название модуля для заголовка
    let modTitle = '';
    try {
      const mod = (await this.moduleApi.execute('get-module', {
        uuid: moduleId,
      })) as { title: string };
      modTitle = mod.title;
    } catch {
      // оставляем пустым
    }

    const lines: string[] = [
      `📖 *Модуль: ${this.#esc(modTitle)}*`,
      '',
    ];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (let pi = 0; pi < snapshot.length; pi++) {
      const project = snapshot[pi];
      if (!project) continue;
      const lessonCount = project.lessons.length;
      const totalSteps = project.lessons.reduce(
        (s, l) => s + l.stepIds.length,
        0,
      );

      lines.push(
        `📁 *Проект: ${this.#esc(project.projectTitle)}* — ${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}, ${totalSteps} шаг${this.#plural(totalSteps, '', 'а', 'ов')}`,
      );

      // Уроки проекта inline (один уровень вниз)
      for (let li = 0; li < project.lessons.length; li++) {
        const lesson = project.lessons[li];
        if (!lesson) continue;
        const sCount = lesson.stepIds.length;
        lines.push(
          `    📝 Урок: ${this.#esc(lesson.lessonTitle)} — ${sCount} шаг${this.#plural(sCount, '', 'а', 'ов')}`,
        );
      }

      lines.push('');

      // Кнопка — один проект
      rows.push([
        {
          text: `📁 ${project.projectTitle}`,
          code: this.cb(
            'lessons',
            courseId,
            String(phaseIdx),
            moduleId,
            String(pi),
          ),
        },
      ]);
    }

    rows.push([
      {
        text: '⬅️ Назад к этапу',
        code: this.cb('modules', courseId, String(phaseIdx)),
      },
    ]);

    return {
      sendMessage: {
        text: this.#truncate(lines.join('\n')),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ═══ Уровень 4: Уроки + заголовки шагов (тела скрыты) ═══

  async #handleLessons(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
    projectIdx: number,
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

    const lines: string[] = [
      `📖 *Проект: ${this.#esc(project.projectTitle)}*`,
      '',
    ];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    if (project.lessons.length === 0) {
      lines.push('_В этом проекте пока нет уроков_');
    } else {
      for (let li = 0; li < project.lessons.length; li++) {
        const lesson = project.lessons[li];
        if (!lesson) continue;
        const sCount = lesson.stepIds.length;

        lines.push(
          `📝 *Урок: ${this.#esc(lesson.lessonTitle)}* — ${sCount} шаг${this.#plural(sCount, '', 'а', 'ов')}`,
        );

        // Шаги урока inline
        if (sCount > 0) {
          const stepsByLesson = (await this.moduleApi.execute(
            'get-steps-by-lessons',
            { lessonIds: [lesson.lessonId] },
          )) as Record<string, Array<{ uuid: string; description: string }>>;

          const steps = stepsByLesson[lesson.lessonId] ?? [];
          const maxSteps = Math.min(steps.length, 3);
          for (let si = 0; si < maxSteps; si++) {
            const step = steps[si];
            if (!step) continue;
            lines.push(`    ${this.#esc(`${si + 1}.`)} ${this.#esc(step.description)}`);
          }
          if (steps.length > 3) {
            lines.push(`    ${this.#esc('...')}`);
          }
        }
      }
    }

    rows.push([
      {
        text: '⬅️ Назад к модулю',
        code: this.cb('projects', courseId, String(phaseIdx), moduleId),
      },
    ]);

    return {
      sendMessage: {
        text: this.#truncate(lines.join('\n')),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ═══ Утилиты ═══

  #esc(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  #getDirectionEmoji(course: Course): string {
    for (const phase of course.phases) {
      if (phase.track) {
        const emoji = TRACK_EMOJI[phase.track];
        if (emoji) return emoji;
      }
    }
    return DEFAULT_TRACK_EMOJI;
  }

  #plural(count: number, one: string, two: string, five: string): string {
    const n = count % 100;
    if (n >= 11 && n <= 19) return five;
    const r = n % 10;
    if (r === 1) return one;
    if (r >= 2 && r <= 4) return two;
    return five;
  }

  #truncate(text: string, maxLen = 4000): string {
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen - 15)}${this.#esc('...')}`;
  }
}
