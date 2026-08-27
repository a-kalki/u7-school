import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { StepRecord, Student, StudentArMeta } from './entity';
import { StudentSchema } from './entity';

/**
 * Агрегат StreamStudent — представляет запись студента на учебном потоке.
 * Управляет выдачей и завершением шагов, а также жизненным циклом студента.
 */
export class StudentAr extends Aggregate<StudentArMeta> {
  static readonly arName = 'Student';
  static readonly arLabel = 'Студент потока';

  /** Текущий статус студента в жизненном цикле потока. */
  get status(): Student['status'] {
    return this._state.status;
  }

  /** Детали отчисления (только если статус abandoned). */
  get abandonDetails(): Student['abandonDetails'] {
    return this._state.abandonDetails;
  }

  /** Детали завершения потока (только если статус advanced/not_advanced). */
  get completionDetails(): Student['completionDetails'] {
    return this._state.completionDetails;
  }

  /** Время последней активности (последний completedAt или issuedAt). */
  get lastActivityAt(): Date | null {
    let latest = 0;
    for (const s of this._state.steps) {
      const ts = s.completedAt ?? s.issuedAt;
      const ms = new Date(ts).getTime();
      if (ms > latest) latest = ms;
    }
    return latest > 0 ? new Date(latest) : null;
  }

  constructor(state: Student) {
    super(state, StudentSchema);
  }

  /**
   * Фабричный метод для зачисления студента на поток.
   * Добавляет доменное событие student.enrolled (публикуется UC'ом).
   */
  static enroll(
    streamId: string,
    userId: string,
    currentStepId: string,
    moduleId: string,
  ): StudentAr {
    const candidate: Student = {
      uuid: crypto.randomUUID(),
      streamId,
      userId,
      enrolledAt: isoNow(),
      status: 'enrolled',
      currentStepId,
      steps: [],
      createdAt: isoNow(),
    };

    const ar = new StudentAr(candidate);
    ar.addEvent({
      eventId: crypto.randomUUID(),
      eventName: 'student.enrolled',
      occurredAt: isoNow(),
      aggregateName: 'Student',
      aggregateId: candidate.uuid,
      payload: {
        studentId: candidate.uuid,
        userId,
        streamId,
        moduleId,
      },
    });
    return ar;
  }

  /**
   * Активировать студента: enrolled → active.
   */
  activate(): void {
    if (this._state.status !== 'enrolled') {
      this.throwBadRequest(
        `Нельзя активировать студента в статусе '${this._state.status}'.`,
      );
    }
    this.safeUpdate({
      status: 'active',
    });
  }

  /**
   * Самостоятельный выход из потока: active → abandoned.
   */
  drop(): void {
    if (this._state.status !== 'active') {
      this.throwBadRequest(
        `Нельзя отчислить студента в статусе '${this._state.status}'.`,
      );
    }
    this.safeUpdate({
      status: 'abandoned',
      abandonDetails: { who: 'self', cause: 'voluntary' },
    });
  }

  /**
   * Отчисление ментором: active → abandoned.
   */
  markAbandoned(cause: 'inactivity' | 'by_mentor'): void {
    if (this._state.status !== 'active') {
      this.throwBadRequest(
        `Нельзя отчислить студента в статусе '${this._state.status}'.`,
      );
    }
    this.safeUpdate({
      status: 'abandoned',
      abandonDetails: { who: 'mentor', cause },
    });
  }

  /**
   * Успешное завершение потока: active → advanced.
   * Также позволяет сменить исход с not_advanced → advanced.
   * Добавляет доменное событие student.completed (публикуется UC'ом).
   */
  advance(moduleId: string): void {
    if (
      this._state.status !== 'active' &&
      this._state.status !== 'advanced' &&
      this._state.status !== 'not_advanced'
    ) {
      this.throwBadRequest(
        `Нельзя завершить студента в статусе '${this._state.status}'.`,
      );
    }
    this.safeUpdate({
      status: 'advanced',
      completionDetails: { nextPreference: 'undecided' },
    });
    this.#addCompletedEvent(moduleId, 'advanced');
  }

  /**
   * Завершение потока без повышения: active → not_advanced.
   * Также позволяет сменить исход с advanced → not_advanced.
   * Добавляет доменное событие student.completed (публикуется UC'ом).
   */
  markNotAdvanced(moduleId: string): void {
    if (
      this._state.status !== 'active' &&
      this._state.status !== 'advanced' &&
      this._state.status !== 'not_advanced'
    ) {
      this.throwBadRequest(
        `Нельзя завершить студента в статусе '${this._state.status}'.`,
      );
    }
    this.safeUpdate({
      status: 'not_advanced',
      completionDetails: { nextPreference: 'undecided' },
    });
    this.#addCompletedEvent(moduleId, 'not_advanced');
  }

  /** Добавляет событие завершения модуля (student.completed). */
  #addCompletedEvent(
    moduleId: string,
    outcome: 'advanced' | 'not_advanced',
  ): void {
    this.addEvent({
      eventId: crypto.randomUUID(),
      eventName: 'student.completed',
      occurredAt: isoNow(),
      aggregateName: 'Student',
      aggregateId: this._state.uuid,
      payload: {
        studentId: this._state.uuid,
        userId: this._state.userId,
        streamId: this._state.streamId,
        moduleId,
        outcome,
      },
    });
  }

  /**
   * Установить пожелание по следующему шагу обучения.
   * Доступно только для студентов в статусе advanced или not_advanced.
   */
  setNextPreference(pref: 'wants_next' | 'wants_repeat' | 'undecided'): void {
    if (
      this._state.status !== 'advanced' &&
      this._state.status !== 'not_advanced'
    ) {
      this.throwBadRequest(
        `Нельзя установить предпочтение для студента в статусе '${this._state.status}'.`,
      );
    }
    this.safeUpdate({
      completionDetails: {
        ...this._state.completionDetails,
        nextPreference: pref,
      },
    });
  }

  /**
   * Выдать следующий шаг студенту.
   */
  issueStep(stepId: string): void {
    const exists = this._state.steps.some((s) => s.stepId === stepId);
    if (exists) {
      this.throwBadRequest(`Шаг с ID ${stepId} уже выдан этому студенту.`);
    }

    const record: StepRecord = {
      stepId,
      status: 'issued',
      issuedAt: isoNow(),
    };

    this._state.steps.push(record);
    this.safeUpdate({
      currentStepId: stepId,
    });
  }

  /**
   * Завершить шаг и выдать следующий.
   *
   * Идемпотентно: повторное завершение уже завершённого шага ничего не меняет
   * и возвращает 'already_completed'. Следующий шаг выдаётся только если он
   * ещё не был выдан.
   */
  completeStep(
    stepId: string,
    nextStepId: string | null,
  ): 'completed' | 'already_completed' | 'finished' {
    const record = this._state.steps.find((s) => s.stepId === stepId);
    if (!record) {
      this.throwBadRequest(
        `Нельзя завершить шаг ${stepId}, так как он не был выдан студенту.`,
      );
    }

    // Повторное завершение уже завершённого шага — no-op
    if (record.status === 'completed') {
      return 'already_completed';
    }

    record.status = 'completed';
    record.completedAt = isoNow();

    // Последний шаг потока — следующего нет
    if (!nextStepId) {
      this.safeUpdate({});
      return 'finished';
    }

    // Выдать следующий шаг только если он ещё не выдан
    const alreadyIssued = this._state.steps.some(
      (s) => s.stepId === nextStepId,
    );
    if (!alreadyIssued) {
      const step: StepRecord = {
        stepId: nextStepId,
        status: 'issued',
        issuedAt: isoNow(),
      };
      this._state.steps.push(step);
      this.safeUpdate({ currentStepId: nextStepId });
    } else {
      this.safeUpdate({});
    }

    return 'completed';
  }

  /**
   * Уровень отставания студента от графика (метод чтения).
   *
   * Вычисляет время с последней активности (completedAt > issuedAt),
   * затем классифицирует:
   * - >7 дней → 'critical'
   * - >4 дней → 'lagging'
   * - иначе → 'on_track'
   *
   * Неактивные статусы (abandoned, advanced, not_advanced) — всегда on_track.
   */
  computeLagLevel(now: Date = new Date()): 'critical' | 'lagging' | 'on_track' {
    if (this._state.status !== 'active' && this._state.status !== 'enrolled') {
      return 'on_track';
    }

    const last = this.lastActivityAt;
    if (!last) return 'on_track';

    const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

    if (hoursSince > 7 * 24) return 'critical';
    if (hoursSince > 4 * 24) return 'lagging';
    return 'on_track';
  }

  /**
   * Проверяет, отстаёт ли студент от медианы группы на 30% или более.
   */
  isLaggingFromMedian(medianHours: number): boolean {
    if (medianHours <= 0) return false;

    const last = this.lastActivityAt;
    if (!last) return false;

    const studentHours =
      (new Date(isoNow()).getTime() - last.getTime()) / (1000 * 60 * 60);
    return studentHours >= medianHours * 1.3;
  }
}
