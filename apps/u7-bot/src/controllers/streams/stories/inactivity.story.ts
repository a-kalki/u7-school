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
  Student,
  StudentAbandonedEvent,
  StudentInactivityRemoveCandidateEvent,
  StudentInactivityWarningEvent,
} from '@u7-scl/stream/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';
import { Routes } from '../../shared/routes';

/**
 * Проактивные уведомления о бездействии и уходе из учёбы.
 *
 * Подписки на события job'а inactivity-sweep и агрегата Student:
 * - student.inactivity-warning (5+ дней) → студенту предупреждение
 *   с кнопкой «🚪 Покинуть учёбу» (самовыход, FR-4);
 * - student.inactivity-remove-candidate (7+ дней) → ментору потока
 *   «Студент A из группы B не занимался N дней» с кнопкой
 *   «⚠️ Снять с учёбы» (FR-5, cause=inactivity);
 * - student.abandoned → мягкий кик из TG-группы потока.
 *
 * Кнопочные проактивы идут каналом invite: получателю без открытого
 * диалога открывается экран «invite»,
 * кнопки штампуются и валидны. Нажатие обрабатывает handleCallback:
 * confirm-диалог → UC drop-student / mark-abandoned.
 * Текстовые уведомления (#3/#4) отправляют UC drop-student /
 * mark-abandoned через userFacade.notify.
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
    const { telegramId, studentId, daysInactive } = event.payload;

    await this.proactiveSender.invite(telegramId, {
      text: mdJoin([
        md`⏳ *Учёба стоит*`,
        md``,
        md`Ты не занимаешься уже ${this.#pluralizeDays(daysInactive)}\\.`,
        md``,
        md`Если бездействие продлится больше недели, ментор может снять тебя с учёбы за бездействие\\.`,
      ]),
      keyboard: this.kb([
        [
          this.btn(
            '🚪 Покинуть учёбу',
            Routes.stream.inactivityDrop(studentId),
          ),
        ],
      ]),
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

    const lines: MdText[] = [
      md`🛑 *Кандидат на снятие с учёбы*`,
      md``,
      md`Студент *${studentName}* из группы «${streamTitle}» не занимался ${this.#pluralizeDays(daysInactive)}\\.`,
    ];
    if (wasWarned) {
      lines.push(md``, md`ℹ️ Уведомления были ранее отправлены студенту\\.`);
    }

    await this.proactiveSender.invite(mentorTelegramId, {
      text: mdJoin(lines),
      keyboard: this.kb([
        [
          this.btn(
            '⚠️ Снять с учёбы',
            Routes.stream.inactivityMarkAbandoned(studentId),
          ),
        ],
      ]),
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

  /**
   * Кнопки канала invite (FR-4 самовыход / FR-5 снятие ментором):
   * confirm-диалог → UC drop-student / mark-abandoned.
   */
  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, id] = action.split(':');

    // Самовыход: confirm → drop-student (FR-4)
    if (cmd === 'drop-student' && id) {
      return this.confirm(
        'drop-student',
        id,
        md`Покинуть учёбу?\n\nПрогресс сохранится, но ментор больше не будет тебя сопровождать\\.`,
        {
          confirmButton: '🚪 Да, покинуть',
          cancelButton: '❌ Остаться',
          cancelCode: Routes.app.mainMenu,
        },
      );
    }
    if (cmd === 'drop-student-confirm' && id) {
      return this.#executeDrop(id, actor);
    }

    // Снятие с учёбы ментором: confirm → mark-abandoned (FR-5)
    if (cmd === 'mark-abandoned' && id) {
      const student = await this.#getStudent(id, actor);
      if (!student) {
        return this.screen(md`⚠️ Запись студента не найдена`);
      }
      const name = await this.#resolveName(student.userId);
      return this.confirm(
        'mark-abandoned',
        id,
        md`Снять студента *${name}* с учёбы за бездействие?\n\nСтудент будет исключён из группы потока и получит уведомление\\.`,
        {
          confirmButton: '⚠️ Да, снять с учёбы',
          cancelButton: '❌ Отмена',
          cancelCode: Routes.app.mainMenu,
        },
      );
    }
    if (cmd === 'mark-abandoned-confirm' && id) {
      return this.#executeMarkAbandoned(id, actor);
    }

    return this.unknownCommand(action, actor, session);
  }

  // ── Приватные методы ──

  /** Самовыход студента (FR-4): UC drop-student + прощание. */
  async #executeDrop(studentId: string, actor: User): Promise<DialogResponse> {
    const student = await this.#getStudent(studentId, actor);
    if (!student) {
      return this.screen(md`⚠️ Запись студента не найдена`);
    }

    try {
      await this.appApi.execute(
        'drop-student',
        { streamId: student.streamId, studentId },
        actor.uuid,
      );
    } catch (err: unknown) {
      return this.handleError(err);
    }

    return this.screen(
      md`Ты покинул учёбу\\. Жаль, что не сложилось — возвращайся, когда будешь готов\\!`,
      this.kb([[this.btn('⬅️ В меню', Routes.app.mainMenu)]]),
    );
  }

  /** Снятие ментором за бездействие (FR-5): UC mark-abandoned. */
  async #executeMarkAbandoned(
    studentId: string,
    actor: User,
  ): Promise<DialogResponse> {
    const student = await this.#getStudent(studentId, actor);
    if (!student) {
      return this.screen(md`⚠️ Запись студента не найдена`);
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
    } catch (err: unknown) {
      return this.handleError(err);
    }

    const name = await this.#resolveName(student.userId);

    return this.screen(
      md`✅ Студент *${name}* снят с учёбы за бездействие и исключён из группы потока\\.`,
    );
  }

  /** Запись студента (streamId для команды UC); недоступна — undefined. */
  async #getStudent(
    studentId: string,
    actor: User,
  ): Promise<Student | undefined> {
    try {
      return await this.appApi.execute(
        'get-student-progress',
        { studentId },
        actor.uuid,
      );
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
