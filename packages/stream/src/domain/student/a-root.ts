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

  constructor(state: Student) {
    super(state, StudentSchema);
  }

  /**
   * Фабричный метод для зачисления студента на поток.
   */
  static enroll(
    streamId: string,
    userId: string,
    currentStepId: string,
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

    return new StudentAr(candidate);
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
   */
  advance(): void {
    if (this._state.status !== 'active') {
      this.throwBadRequest(
        `Нельзя завершить студента в статусе '${this._state.status}'.`,
      );
    }
    this.safeUpdate({
      status: 'advanced',
      completionDetails: { nextPreference: 'undecided' },
    });
  }

  /**
   * Завершение потока без повышения: active → not_advanced.
   */
  markNotAdvanced(): void {
    if (this._state.status !== 'active') {
      this.throwBadRequest(
        `Нельзя завершить студента в статусе '${this._state.status}'.`,
      );
    }
    this.safeUpdate({
      status: 'not_advanced',
      completionDetails: { nextPreference: 'undecided' },
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
   * Завершить шаг.
   */
  completeStep(stepId: string): void {
    const record = this._state.steps.find((s) => s.stepId === stepId);
    if (!record) {
      this.throwBadRequest(
        `Нельзя завершить шаг ${stepId}, так как он не был выдан студенту.`,
      );
    }

    record.status = 'completed';
    record.completedAt = isoNow();
    this.safeUpdate({});
  }
}
