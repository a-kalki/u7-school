import type { User } from '@u7-scl/app/domain';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
  UiEventSubscription,
} from '@u7-scl/core/ui';
import { eventSubscription } from '@u7-scl/core/ui';
import type {
  Stream,
  StudentAbandonedEvent,
  StudentInactivityRemoveCandidateEvent,
  StudentInactivityWarningEvent,
} from '@u7-scl/stream/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';

/**
 * Проактивные уведомления о бездействии и уходе из учёбы.
 *
 * Подписки на события job'а inactivity-sweep и агрегата Student:
 * - student.inactivity-warning (5+ дней) → студенту предупреждение;
 * - student.inactivity-remove-candidate (7+ дней) → ментору потока
 *   «Студент A из группы B не занимался N дней» (+ строка о ранее
 *   отправленных предупреждениях);
 * - student.abandoned → мягкий кик из TG-группы потока.
 *
 * И3: проактив — notify-текст без кнопок, сессию получателя не трогает;
 * получателю без открытого диалога в тексте подсказан /start.
 * Кнопочные сценарии ушли из проактивов: самовыход — через меню (self-drop,
 * трек 3), снятие ментором — через monitor (трек 5).
 * Текстовые уведомления (#3/#4) отправляют UC drop-student /
 * mark-abandoned через userFacade.notify (трек user-notify).
 */
export class InactivityStory extends U7BotUiStory {
  readonly name = 'inactivity';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<StudentInactivityWarningEvent>(
        'student.inactivity-warning',
        (event) => this.#handleWarningEvent(event),
      ),
      eventSubscription<StudentInactivityRemoveCandidateEvent>(
        'student.inactivity-remove-candidate',
        (event) => this.#handleCandidateEvent(event),
      ),
      eventSubscription<StudentAbandonedEvent>('student.abandoned', (event) =>
        this.#handleAbandonedEvent(event),
      ),
    ];
  }

  /** Предупреждение студенту о бездействии (ступень 5+ дней, FR-1). */
  async #handleWarningEvent(
    event: StudentInactivityWarningEvent,
  ): Promise<void> {
    const { telegramId, daysInactive } = event.payload;

    await this.proactiveSender.notify(telegramId, {
      text: mdJoin([
        md`⏳ *Учёба стоит*`,
        md``,
        md`Ты не занимаешься уже ${this.#pluralizeDays(daysInactive)}\\.`,
        md``,
        md`Если бездействие продлится больше недели, ментор может снять тебя с учёбы за бездействие\\.`,
        md``,
        md`Меню бота: /start`,
      ]),
      kind: 'notify',
    });
  }

  /** Уведомление ментору о кандидате на снятие с учёбы (ступень 7+ дней). */
  async #handleCandidateEvent(
    event: StudentInactivityRemoveCandidateEvent,
  ): Promise<void> {
    const { mentorTelegramId, userId, streamId, daysInactive, wasWarned } =
      event.payload;

    const [studentName, streamTitle] = await Promise.all([
      this.#resolveName(userId),
      this.#resolveStreamTitle(streamId),
    ]);

    const lines: MdText[] = [
      md`🛑 *Кандидат на снятие с учёбы*`,
      md``,
      md`Студент *${studentName}* из группы «${streamTitle}» не занимался ${this.#pluralizeDays(daysInactive)}\\.`,
    ];
    if (wasWarned) {
      lines.push(md``, md`ℹ️ Уведомления были ранее отправлены студенту\\.`);
    }
    lines.push(md``, md`Действия по студенту — в меню: /start`);

    await this.proactiveSender.notify(mentorTelegramId, {
      text: mdJoin(lines),
      kind: 'notify',
    });
  }

  /**
   * Событие ухода из учёбы — мягкий кик из Telegram-группы потока (FR-6).
   * Текстовые уведомления отправляют UC drop-student / mark-abandoned
   * через userFacade.notify.
   */
  async #handleAbandonedEvent(event: StudentAbandonedEvent): Promise<void> {
    const { userId, streamId } = event.payload;

    // FR-6: мягкое исключение из Telegram-группы потока — для обоих сценариев
    await this.#kickFromGroup(streamId, userId);
  }

  // ── Callback ──

  /** Кнопочных сценариев больше нет (И3) — любое нажатие ничего не делает. */
  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    return this.unknownCommand(action, actor, session);
  }

  // ── Приватные методы ──

  /** Имя пользователя по uuid (fallback — первые 8 символов id). */
  async #resolveName(userId: string): Promise<string> {
    try {
      const user = await this.appApi.execute('get-user', { uuid: userId });
      if (user) return user.name;
    } catch {
      // профиль недоступен — покажем id
    }
    return userId.slice(0, 8);
  }

  /** telegramId пользователя по uuid. */
  async #resolveTelegramId(userId: string): Promise<number | undefined> {
    try {
      const user = await this.appApi.execute('get-user', { uuid: userId });
      return user?.telegramId;
    } catch {
      return undefined;
    }
  }

  /** Название потока (fallback — id). */
  async #resolveStreamTitle(streamId: string): Promise<string> {
    const stream = await this.#resolveStream(streamId);
    if (stream) return stream.title;
    return streamId.slice(0, 8);
  }

  /** Поток по id (undefined, если недоступен). */
  async #resolveStream(streamId: string): Promise<Stream | undefined> {
    try {
      const stream: Stream | undefined = await this.appApi.execute(
        'get-stream',
        { streamId },
      );
      return stream;
    } catch {
      return undefined;
    }
  }

  /**
   * Мягко исключает студента из Telegram-группы потока (FR-6).
   * Нет группы у потока или нет telegramId у студента — пропуск.
   * Ошибки кика изолированы в транспорте и не всплывают наружу.
   */
  async #kickFromGroup(streamId: string, userId: string): Promise<void> {
    const [stream, telegramId] = await Promise.all([
      this.#resolveStream(streamId),
      this.#resolveTelegramId(userId),
    ]);
    const groupId = stream?.telegramGroupId;
    if (groupId === undefined || telegramId === undefined) return;
    await this.proactiveSender.kickFromGroup(groupId, telegramId);
  }

  /** Склоняет «N дней» (1 день, 2 дня, 5 дней). */
  #pluralizeDays(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    const word =
      mod100 >= 11 && mod100 <= 19
        ? 'дней'
        : mod10 === 1
          ? 'день'
          : mod10 >= 2 && mod10 <= 4
            ? 'дня'
            : 'дней';
    return `${n} ${word}`;
  }
}
