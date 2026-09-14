import type { User } from '@u7-scl/app/domain';
import { md, mdJoin } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
  UiEventSubscription,
} from '@u7-scl/core/ui';
import { eventSubscription } from '@u7-scl/core/ui';
import type { WishConfirmedEvent } from '@u7-scl/wish/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';

/** Профиль ментора (telegramId может отсутствовать). */
type Mentor = Omit<User, 'telegramId'> & {
  telegramId?: number;
};

/**
 * Уведомление менторам о подтверждённом желании (проактивное).
 *
 * Подписка на wish.confirmed (публикует ER confirm-wish после
 * анкетной ветки). Собирает имя пользователя, название курса и всех
 * менторов, которые когда-либо вели потоки этого курса, и рассылает
 * им notify-проактив (без кнопок). Автор желания и менторы без
 * telegramId — пропуск; недоступные профиль/курс — молчаливый
 * пропуск (уведомление невозможно).
 */
export class WishConfirmedStory extends U7BotUiStory {
  readonly name = 'wish-confirmed';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<WishConfirmedEvent>('wish.confirmed', (event) =>
        this.#handleConfirmed(event),
      ),
    ];
  }

  async #handleConfirmed(event: WishConfirmedEvent): Promise<void> {
    const { userId, courseId } = event.payload;

    const user = await this.#fetchUser(userId);
    const course = await this.#fetchCourse(courseId);
    if (!user) return;

    const mentors = await this.#courseMentors(courseId);
    const text = mdJoin([
      md`📗 *${user.name}* подтвердил желание проходить курс *${course?.title ?? courseId}*.`,
    ]);

    for (const mentor of mentors) {
      // Автор не уведомляет сам себя; без telegramId доставить некому
      if (mentor.uuid === userId || mentor.telegramId === undefined) continue;
      await this.proactiveSender.notify(mentor.telegramId, { text });
    }
  }

  /**
   * Все менторы, когда-либо ведшие потоки курса: список потоков,
   * принадлежность moduleId → courseId (с кэшем запросов), дедупликация.
   */
  async #courseMentors(courseId: string): Promise<Mentor[]> {
    let streams: Array<{ mentorId: string; moduleId: string }>;
    try {
      streams = (await this.appApi.execute('list-streams', {})) as Array<{
        mentorId: string;
        moduleId: string;
      }>;
    } catch {
      return [];
    }

    const mentorIds = new Set<string>();
    const courseOfModule = new Map<string, string | undefined>();
    for (const s of streams) {
      if (!courseOfModule.has(s.moduleId)) {
        courseOfModule.set(
          s.moduleId,
          (await this.#fetchCourseByModule(s.moduleId))?.uuid,
        );
      }
      if (courseOfModule.get(s.moduleId) === courseId) {
        mentorIds.add(s.mentorId);
      }
    }

    const mentors: Mentor[] = [];
    for (const uuid of mentorIds) {
      const mentor = await this.#fetchUser(uuid);
      if (mentor) mentors.push(mentor);
    }
    return mentors;
  }

  /** appApi.execute, не бросающий исключений (undefined — не найдено). */
  async #fetchUser(uuid: string): Promise<Mentor | undefined> {
    try {
      return (await this.appApi.execute('get-user', { uuid })) as Mentor;
    } catch {
      return undefined;
    }
  }

  async #fetchCourse(uuid: string): Promise<{ title: string } | undefined> {
    try {
      return (await this.appApi.execute('get-course', {
        uuid,
      })) as { title: string };
    } catch {
      return undefined;
    }
  }

  async #fetchCourseByModule(
    moduleId: string,
  ): Promise<{ uuid: string } | undefined> {
    try {
      return (await this.appApi.execute('get-course-by-module', {
        moduleId,
      })) as { uuid: string };
    } catch {
      return undefined;
    }
  }

  // ── Story не интерактивна: callback не обрабатывает ──

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    return this.unknownCommand(action, actor, session);
  }
}
