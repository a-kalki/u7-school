import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import type { Course } from '@u7-scl/course/domain';
import type { StreamApiModuleMeta } from '../../../domain/module';

/** Эмодзи для направлений */
const TRACK_EMOJI: Record<string, string> = {
  tech: '💻',
  business: '💼',
};
const DEFAULT_TRACK_EMOJI = '📚';

/**
 * Story «Программы курсов» — каталог курсов (S00, S00a).
 * Доступна всем ролям (GUEST, CANDIDATE, STUDENT, MENTOR, ADMIN, AUTHOR).
 *
 * S00: список опубликованных курсов (title, описание, направление, сводка объёма).
 * S00a: карточка курса (phases, автор, сводка объёма, кнопки навигации).
 */
export class CourseCatalogStory extends U7BotUserStory<StreamApiModuleMeta> {
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
    const courseId = ids.join(':');

    switch (cmd) {
      case 'list':
        return this.#handleList();
      case 'view':
        return this.#handleView(courseId);
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
    const courses = (await this.appApi.execute('list-courses', {})) as Course[];

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
      course = (await this.appApi.execute('get-course', {
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
      (sum, phase) => sum + phase.moduleIds.length,
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
