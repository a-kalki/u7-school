import { Job, type JobMeta, type JobSchedule } from '@u7-scl/core/api';
import type { DomainEvent } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { StreamApiModuleResolver } from '#domain/module';
import { StudentAr } from '#domain/student/a-root';
import type { Student } from '#domain/student/entity';
import type {
  StudentInactivityRemoveCandidateEvent,
  StudentInactivityWarningEvent,
} from '#domain/student/events';

// ══ Пороги и периодичность (spec FR-2): именованные константы ══
// Задел на будущее: значения могут уехать в конфиг или поле потока
// (ментор задаёт своё) — константы станут значением по умолчанию.

/** Порог предупреждения студенту: бездействие 5 дней */
export const WARN_AFTER_DAYS = 5;

/** Порог уведомления ментору (кандидат на снятие с учёбы): 7 дней */
export const REMOVE_AFTER_DAYS = 7;

/** Периодичность повторов каждого уведомления: через день */
export const NOTICE_EVERY_DAYS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

const SOURCE = 'inactivity-sweep';

interface InactivitySweepJobMeta extends JobMeta {
  name: typeof SOURCE;
  label: 'Мониторинг бездействующих студентов';
}

/**
 * Ежедневный обход бездействующих студентов (spec FR-1).
 *
 * 19:00 UTC (00:00 Казахстана). Отслеживает active и enrolled:
 * бездействие считается от последней активности (последний шаг),
 * а при отсутствии шагов — от даты зачисления (enrolledAt).
 *
 * - ≥5 дней → событие student.inactivity-warning (студенту);
 * - ≥7 дней → событие student.inactivity-remove-candidate (ментору потока).
 *
 * Периодичность повторов — через день (5,7,9… студенту; 7,9,11… ментору),
 * idempotentность обеспечивает маркер notices в агрегате Student
 * (markNoticed/getLastNotice). Возобновление учёбы (activate, completeStep)
 * сбрасывает цепочку уведомлений.
 *
 * Ошибка обработки одного студента не прерывает обход.
 */
export class InactivitySweepJob extends Job<
  InactivitySweepJobMeta,
  StreamApiModuleResolver
> {
  readonly jobName = 'inactivity-sweep';
  readonly jobLabel = 'Мониторинг бездействующих студентов';
  readonly schedule: JobSchedule = { kind: 'dailyAt', hour: 19, minute: 0 };

  async execute(): Promise<void> {
    // Выборка кандидатов по статусам — ответственность репозитория
    const candidates = await this.resolve.streamStudentRepo.getByStatuses([
      'active',
      'enrolled',
    ]);

    const now = new Date();
    for (const state of candidates) {
      try {
        await this.#process(state, now);
      } catch (err) {
        this.resolve.appResolver.logger.warn(
          SOURCE,
          `Не удалось обработать студента ${state.uuid}: ${String(err)}`,
        );
      }
    }
  }

  /** Обработка одного студента: предупреждение студенту + кандидат ментору. */
  async #process(state: Student, now: Date): Promise<void> {
    const ar = new StudentAr(state);
    const days = this.#daysInactive(ar, now);
    if (days < WARN_AFTER_DAYS) return;

    // «Уведомления были ранее отправлены» — маркер существовал ДО этого прогона
    const wasWarnedBefore =
      ar.getLastNotice('inactivity_warn_student') !== undefined;

    const events: DomainEvent[] = [];

    // ── Предупреждение студенту (5, 7, 9… дней) ──
    if (this.#shouldNotice(ar, 'inactivity_warn_student', now)) {
      const telegramId = await this.#resolveTelegramId(state.userId);
      if (telegramId !== undefined) {
        ar.markNoticed('inactivity_warn_student', now);
        events.push({
          eventId: crypto.randomUUID(),
          eventName: 'student.inactivity-warning',
          occurredAt: isoNow(),
          aggregateName: 'Student',
          aggregateId: state.uuid,
          payload: {
            studentId: state.uuid,
            userId: state.userId,
            streamId: state.streamId,
            telegramId,
            daysInactive: days,
          },
        } satisfies StudentInactivityWarningEvent);
      }
    }

    // ── Кандидат на снятие с учёбы → ментору (7, 9, 11… дней) ──
    if (days >= REMOVE_AFTER_DAYS) {
      if (this.#shouldNotice(ar, 'inactivity_warn_mentor', now)) {
        const event = await this.#buildMentorEvent(ar, days, wasWarnedBefore);
        if (event) {
          ar.markNoticed('inactivity_warn_mentor', now);
          events.push(event);
        }
      }
    }

    if (events.length === 0) return;

    await this.resolve.streamStudentRepo.save(ar.state);
    this.#publishAll(events);
  }

  /**
   * Дней без активности: от последней активности (шаги) или,
   * если шагов нет, от даты зачисления (enrolledAt).
   */
  #daysInactive(ar: StudentAr, now: Date): number {
    const from = ar.lastActivityAt ?? new Date(ar.state.enrolledAt);
    return Math.floor((now.getTime() - from.getTime()) / DAY_MS);
  }

  /**
   * Настало ли время повторного уведомления данного типа:
   * нет маркера (первая отправка) или с последней прошло ≥ NOTICE_EVERY_DAYS.
   */
  #shouldNotice(
    ar: StudentAr,
    kind: 'inactivity_warn_student' | 'inactivity_warn_mentor',
    now: Date,
  ): boolean {
    const last = ar.getLastNotice(kind);
    if (!last) return true;
    const daysSince = Math.floor(
      (now.getTime() - new Date(last.sentAt).getTime()) / DAY_MS,
    );
    return daysSince >= NOTICE_EVERY_DAYS;
  }

  /** Событие для ментора потока; null — ментор/поток/telegramId недоступны. */
  async #buildMentorEvent(
    ar: StudentAr,
    days: number,
    wasWarned: boolean,
  ): Promise<StudentInactivityRemoveCandidateEvent | null> {
    const state = ar.state;
    const stream = await this.resolve.streamRepo.getByUuid(state.streamId);
    if (!stream) return null;

    const mentor = await this.resolve.userFacade.getUserByUuid(stream.mentorId);
    if (!mentor || mentor.telegramId === undefined) return null;

    return {
      eventId: crypto.randomUUID(),
      eventName: 'student.inactivity-remove-candidate',
      occurredAt: isoNow(),
      aggregateName: 'Student',
      aggregateId: state.uuid,
      payload: {
        studentId: state.uuid,
        userId: state.userId,
        streamId: state.streamId,
        mentorTelegramId: mentor.telegramId,
        daysInactive: days,
        // Были ли студенту предупреждения до текущего прогона
        wasWarned,
      },
    };
  }

  /** telegramId пользователя; undefined — пользователь недоступен. */
  async #resolveTelegramId(userId: string): Promise<number | undefined> {
    const user = await this.resolve.userFacade.getUserByUuid(userId);
    return user?.telegramId;
  }

  /** Публикует события через шину (носитель — массив). */
  #publishAll(events: DomainEvent[]): void {
    const eventBus = this.resolve.eventBus;
    if (!eventBus) return;
    for (const event of events) {
      eventBus.publish(event);
    }
  }
}
