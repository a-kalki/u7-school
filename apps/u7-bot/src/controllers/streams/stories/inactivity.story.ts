import type { User } from '@u7-scl/app/domain';
import {
  type BotResponse,
  eventSubscription,
  type SessionData,
  type UiEventSubscription,
} from '@u7-scl/core/ui';
import type {
  Stream,
  Student,
  StudentAbandonedEvent,
  StudentInactivityRemoveCandidateEvent,
  StudentInactivityWarningEvent,
} from '@u7-scl/stream/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';

/**
 * Проактивные уведомления о бездействии и уходе из учёбы.
 *
 * Подписки на события job'а inactivity-sweep и агрегата Student:
 * - student.inactivity-warning (5+ дней) → студенту предупреждение
 *   + кнопка «Покинуть учёбу» (confirm → drop-student);
 * - student.inactivity-remove-candidate (7+ дней) → ментору потока
 *   «Студент A из группы B не занимался N дней» (+ строка о ранее
 *   отправленных предупреждениях) + кнопка «Снять с учёбы»;
 * - student.abandoned → самовыход: ментору «покинул учёбу»;
 *   решение ментора: студенту «Ты снят с учёбы…».
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
    const { telegramId, daysInactive, studentId } = event.payload;

    await this.proactiveSender.send(telegramId, {
      sendMessage: {
        text: [
          '⏳ *Учёба стоит*',
          '',
          `Ты не занимаешься уже ${this.#pluralizeDays(daysInactive)}\\.`,
          '',
          'Если бездействие продлится больше недели, ментор может снять тебя с учёбы за бездействие\\.',
        ].join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '🚪 Покинуть учёбу',
                code: this.cb('drop-student', studentId),
                takeover: true,
              },
            ],
          ],
          isMultiple: false,
        },
      },
    });
  }

  /** Уведомление ментору о кандидате на снятие с учёбы (ступень 7+ дней). */
  async #handleCandidateEvent(
    event: StudentInactivityRemoveCandidateEvent,
  ): Promise<void> {
    const {
      mentorTelegramId,
      studentId,
      userId,
      streamId,
      daysInactive,
      wasWarned,
    } = event.payload;

    const [studentName, streamTitle] = await Promise.all([
      this.#resolveName(userId),
      this.#resolveStreamTitle(streamId),
    ]);

    const lines = [
      '🛑 *Кандидат на снятие с учёбы*',
      '',
      `Студент *${this.escapeMarkdown(studentName)}* из группы «${this.escapeMarkdown(streamTitle)}» не занимался ${this.#pluralizeDays(daysInactive)}.`,
    ];
    if (wasWarned) {
      lines.push('', 'ℹ️ Уведомления были ранее отправлены студенту\\.');
    }

    await this.proactiveSender.send(mentorTelegramId, {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '⚠️ Снять с учёбы',
                code: this.cb('mark-abandoned', studentId),
                takeover: true,
              },
            ],
          ],
          isMultiple: false,
        },
      },
    });
  }

  /**
   * Событие ухода из учёбы:
   * самовыход → ментору «покинул учёбу» (FR-4);
   * решение ментора → студенту мягкое уведомление (FR-5).
   */
  async #handleAbandonedEvent(event: StudentAbandonedEvent): Promise<void> {
    const { who, userId, streamId } = event.payload;

    if (who === 'self') {
      const [studentName, mentorTelegramId] = await Promise.all([
        this.#resolveName(userId),
        this.#resolveMentorTelegramId(streamId),
      ]);
      if (mentorTelegramId === undefined) return;

      await this.proactiveSender.notify(mentorTelegramId, {
        text: `🚪 Студент ${this.escapeMarkdown(studentName)} покинул учёбу\\.`,
        parseMode: 'MarkdownV2',
      });
      return;
    }

    const telegramId = await this.#resolveTelegramId(userId);
    if (telegramId === undefined) return;

    await this.proactiveSender.notify(telegramId, {
      text: 'Ты снят с учёбы из\\-за длительного отсутствия активности\\. Если захочешь вернуться — напиши ментору потока\\.',
      parseMode: 'MarkdownV2',
    });
  }

  // ── Callback ──

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, id] = action.split(':');

    // Самовыход: confirm → drop-student (FR-4)
    if (cmd === 'drop-student' && id) {
      return this.confirm(
        'drop-student',
        id,
        'Покинуть учёбу?\n\nПрогресс сохранится, но ментор больше не будет тебя сопровождать\\.',
        {
          confirmButton: '🚪 Да, покинуть',
          cancelButton: '❌ Остаться',
          cancelCode: 'app:main-menu',
        },
      );
    }
    if (cmd === 'drop-student-confirm' && id) {
      return this.#executeDrop(id, actor);
    }

    // Снятие с учёбы ментором: confirm → mark-abandoned (FR-5)
    if (cmd === 'mark-abandoned' && id) {
      return this.confirm(
        'mark-abandoned',
        id,
        'Снять студента с учёбы за бездействие?\n\nСтудент будет исключён из группы потока и получит уведомление\\.',
        {
          confirmButton: '⚠️ Да, снять с учёбы',
          cancelButton: '❌ Отмена',
          cancelCode: 'app:main-menu',
        },
      );
    }
    if (cmd === 'mark-abandoned-confirm' && id) {
      return this.#executeMarkAbandoned(id, actor);
    }

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  // ── Приватные методы ──

  async #executeDrop(studentId: string, actor: User): Promise<BotResponse> {
    const student = await this.#getStudent(studentId);
    if (!student) {
      return { sendMessage: { text: '⚠️ Запись студента не найдена' } };
    }

    try {
      await this.appApi.execute(
        'drop-student',
        { streamId: student.streamId, studentId },
        actor.uuid,
      );
    } catch (err) {
      return this.handleError(err);
    }

    return {
      sendMessage: {
        text: 'Ты покинул учёбу\\. Жаль, что не сложилось — возвращайся, когда будешь готов\\!',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [[{ text: '⬅️ В меню', code: 'app:main-menu' }]],
          isMultiple: false,
        },
      },
    };
  }

  async #executeMarkAbandoned(
    studentId: string,
    actor: User,
  ): Promise<BotResponse> {
    const student = await this.#getStudent(studentId);
    if (!student) {
      return { sendMessage: { text: '⚠️ Запись студента не найдена' } };
    }

    try {
      await this.appApi.execute(
        'mark-abandoned',
        {
          streamId: student.streamId,
          studentId,
          cause: 'inactivity' as const,
        },
        actor.uuid,
      );
    } catch (err) {
      return this.handleError(err);
    }

    return {
      sendMessage: {
        text: '✅ Студент снят с учёбы за бездействие и исключён из группы потока\\.',
        parseMode: 'MarkdownV2',
      },
    };
  }

  /** Запись студента (streamId для команды UC). */
  async #getStudent(studentId: string): Promise<Student | undefined> {
    try {
      return await this.appApi.execute('get-student-progress', { studentId });
    } catch {
      return undefined;
    }
  }

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
    try {
      const stream: Stream | undefined = await this.appApi.execute(
        'get-stream',
        { streamId },
      );
      if (stream) return stream.title;
    } catch {
      // поток недоступен
    }
    return streamId.slice(0, 8);
  }

  /** telegramId ментора потока. */
  async #resolveMentorTelegramId(
    streamId: string,
  ): Promise<number | undefined> {
    try {
      const stream: Stream | undefined = await this.appApi.execute(
        'get-stream',
        { streamId },
      );
      if (!stream) return undefined;
      return await this.#resolveTelegramId(stream.mentorId);
    } catch {
      return undefined;
    }
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
