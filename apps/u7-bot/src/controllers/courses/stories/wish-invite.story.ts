import type { User } from '@u7-scl/app/domain';
import { type MdText, md, mdConcat, mdJoin, mdRaw } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
  UiEventSubscription,
} from '@u7-scl/core/ui';
import { eventSubscription } from '@u7-scl/core/ui';
import type { WishInvitedEvent } from '@u7-scl/wish/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';
import { Routes } from '../../shared/routes';

/** Профиль ментора в карточке приглашения (telegramId может отсутствовать). */
type Mentor = Omit<User, 'telegramId'> & {
  telegramId?: number;
  nick?: string;
};

/**
 * S11 — приглашение желающему при открытии набора (проактивное, кнопочное).
 *
 * Подписка на wish.invited (публикует ER invite-wishers модуля wish).
 * Собирает поток / курс (модуль) / ментора через appApi и доставляет
 * кнопочный проактив канала invite — с кнопкой «🗑️ Отменить желание»,
 * ведущей в существующие экраны отмены W05 / W05-M (course-catalog).
 *
 * ⚠️ Временное решение: кнопочные проактивы до переезда в tasks-system
 * (см. TODO.md) — сторя самоликвидируется после ввода модуля задач.
 */
export class WishInviteStory extends U7BotUiStory {
  readonly name = 'wish-invite';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<WishInvitedEvent>('wish.invited', (event) =>
        this.#handleInvited(event),
      ),
    ];
  }

  async #handleInvited(event: WishInvitedEvent): Promise<void> {
    const { telegramId, streamId, targetKind, courseId, moduleId } =
      event.payload;

    let stream: {
      title: string;
      startDate: string;
      mentorId: string;
      enrollmentKey?: string;
    };
    try {
      stream = (await this.appApi.execute('get-stream', {
        streamId,
      })) as typeof stream;
    } catch {
      // Поток недоступен — приглашение невозможно (молчаливый пропуск)
      return;
    }

    // Заголовок желания и код отмены — по виду цели (ассоциация с кнопкой)
    const subject = await this.#wishSubject(targetKind, courseId, moduleId);
    if (!subject) return;
    const cancelCode =
      targetKind === 'course' && courseId
        ? Routes.course.cancelWishCourse(courseId)
        : moduleId
          ? Routes.course.cancelWishModule(moduleId)
          : undefined;
    if (!cancelCode) return;

    const mentorLine = await this.#mentorLine(stream.mentorId);

    // Ключ набора опционален: без него запись мгновенная, без кодового слова
    const enrollHint = stream.enrollmentKey
      ? md`Для записи нужен ключ — его выдаёт ментор\\. Запись: /start → 📚 Потоки курсов → «${stream.title}» → 📝 Записаться\\.`
      : md`Запись свободная: /start → 📚 Потоки курсов → «${stream.title}» → 📝 Записаться\\.`;

    const text = mdJoin([
      md`📣 *Открылся набор\\!*`,
      md``,
      subject,
      md``,
      md`📚 Поток: «${stream.title}»`,
      md`📅 Старт: ${this.formatDate(stream.startDate)}, ${this.#formatTime(stream.startDate)}`,
      ...mentorLine,
      md``,
      enrollHint,
    ]);

    await this.proactiveSender.invite(telegramId, {
      text,
      keyboard: this.kb([
        [
          this.btn('📝 Записаться', Routes.stream.enroll(streamId)),
          this.btn('🗑️ Отменить желание', cancelCode),
        ],
      ]),
    });
  }

  /** Строка «У тебя было желание пройти …» — заголовок карточки. */
  async #wishSubject(
    targetKind: 'course' | 'module',
    courseId: string | undefined,
    moduleId: string | undefined,
  ): Promise<MdText | undefined> {
    if (targetKind === 'course' && courseId) {
      const course = await this.#fetchCourse(courseId);
      const title = course?.title ?? courseId;
      return md`У тебя было желание пройти курс *${title}* — на него открыт набор\\.`;
    }
    if (moduleId) {
      const mod = await this.#fetchModule(moduleId);
      const title = mod?.title ?? moduleId;
      return md`У тебя было желание пройти модуль *${title}* — на него открыт набор\\.`;
    }
    // payload без опознаваемой цели — приглашение невозможно
    return undefined;
  }

  /**
   * Строка «👤 Ментор: …» (пустой массив — профиль недоступен, строка
   * опускается). Есть nick → рабочая ссылка t.me/{nick}; ника нет →
   * ЭКСПЕРИМЕНТ: tg://user?id (MarkdownV2 официально не поддерживает —
   * после живого теста либо оставить, либо заменить на простое имя).
   */
  async #mentorLine(mentorId: string): Promise<MdText[]> {
    const mentor = await this.#fetchMentor(mentorId);
    if (!mentor) return [];

    const label = md`${mentor.name}`;
    if (mentor.nick) {
      return [
        mdConcat(
          mdRaw('👤 Ментор: ['),
          label,
          mdRaw(`](https://t.me/${mentor.nick})`),
        ),
      ];
    }
    if (mentor.telegramId !== undefined) {
      return [
        mdConcat(
          mdRaw('👤 Ментор: ['),
          label,
          mdRaw(`](tg://user?id=${mentor.telegramId})`),
        ),
      ];
    }
    return [mdConcat(mdRaw('👤 Ментор: '), label)];
  }

  /** appApi.execute, не бросающий исключений (undefined — не найдено). */
  async #fetchCourse(uuid: string): Promise<{ title: string } | undefined> {
    try {
      return (await this.appApi.execute('get-course', {
        uuid,
      })) as { title: string };
    } catch {
      return undefined;
    }
  }

  async #fetchModule(uuid: string): Promise<{ title: string } | undefined> {
    try {
      return (await this.appApi.execute('get-module', {
        uuid,
      })) as { title: string };
    } catch {
      return undefined;
    }
  }

  async #fetchMentor(uuid: string): Promise<Mentor | undefined> {
    try {
      return (await this.appApi.execute('get-user', { uuid })) as Mentor;
    } catch {
      return undefined;
    }
  }

  /** Форматирует ISO-дату в чч:мм (UTC, как в карточке потока S02). */
  #formatTime(iso: string): string {
    try {
      const d = new Date(iso);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const min = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${min}`;
    } catch {
      return iso;
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
