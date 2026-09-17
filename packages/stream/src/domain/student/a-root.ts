import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import {
  AbandonSign,
  CompletionSign,
  StudentOutcomeCategory,
  type StudentOutcomeSign,
} from '../status';
import type {
  StepRecord,
  Student,
  StudentArMeta,
  StudentNoticeKind,
  StudentNoticeRecord,
} from './entity';
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

  // ── Чтение: API исходов студента (ФР-1) ──

  /**
   * Категория исхода студента: завершил / забросил / учится.
   * Клиенты не разбирают `status` сами — спрашивают агрегат.
   */
  outcomeCategory(): StudentOutcomeCategory {
    switch (this._state.status) {
      case 'advanced':
      case 'not_advanced':
        return StudentOutcomeCategory.COMPLETED;
      case 'abandoned':
        return StudentOutcomeCategory.ABANDONED;
      case 'enrolled':
      case 'active':
        return StudentOutcomeCategory.IN_PROGRESS;
    }
  }

  /** Есть ли у студента хотя бы один завершённый шаг */
  private hasCompletedStep(): boolean {
    return this._state.steps.some((step) => step.status === 'completed');
  }

  /**
   * Терминален ли студент: судьба разрешена (завершил или выбыл).
   * Инвариант завершения потока (ФР-2 трека peer-review): пока хотя бы
   * у одного студента статус нетерминален (enrolled/active), поток завершить
   * нельзя — ментор должен указать исход каждому.
   */
  isTerminal(): boolean {
    return this.outcomeCategory() !== StudentOutcomeCategory.IN_PROGRESS;
  }

  /**
   * Запись студента ещё «живая»: учится или зачислен (не терминальна).
   * Заменяет клиентам разбор `status === 'active' || status === 'enrolled'` (ФР‑10).
   */
  isInProgress(): boolean {
    return this.outcomeCategory() === StudentOutcomeCategory.IN_PROGRESS;
  }

  /**
   * Зачислен, но ещё не начал учиться (enrolled). Заменяет клиентам
   * сравнение `status === 'enrolled'` (ФР‑10, активация потока).
   */
  isEnrolled(): boolean {
    return this._state.status === 'enrolled';
  }

  /**
   * Прошёл поток (advanced) — основание записи на следующий модуль.
   * `not_advanced` не «прошёл». Заменяет `status === 'advanced'` (ФР‑10).
   */
  isPassed(): boolean {
    return this._state.status === 'advanced';
  }

  /**
   * Признак «не начал» (ФР-1, ФР-4): нет ни одного завершённого шага.
   * Выводимый признак — независим от деталей ухода; только для выбывших.
   */
  neverStarted(): boolean {
    return (
      this.outcomeCategory() === StudentOutcomeCategory.ABANDONED &&
      !this.hasCompletedStep()
    );
  }

  /**
   * Признаки исхода: завершения — для категории COMPLETED, ухода — для
   * ABANDONED. Признаки ухода независимы: «не начал» сочетается с причиной.
   */
  outcomeSigns(): StudentOutcomeSign[] {
    switch (this.outcomeCategory()) {
      case StudentOutcomeCategory.COMPLETED:
        return [
          this._state.status === 'advanced'
            ? CompletionSign.PASSED
            : CompletionSign.NOT_PASSED,
        ];
      case StudentOutcomeCategory.ABANDONED: {
        // Легаси-данные: abandoned без abandonDetails — без признаков причины
        const cause = this._state.abandonDetails?.cause;
        const signs: StudentOutcomeSign[] = [];
        if (this.neverStarted()) {
          signs.push(AbandonSign.NEVER_STARTED);
        }
        if (cause === 'voluntary') {
          signs.push(AbandonSign.LEFT_VOLUNTARILY);
        } else if (cause === 'by_mentor' || cause === 'inactivity') {
          signs.push(AbandonSign.REMOVED_BY_MENTOR);
        }
        return signs;
      }
      case StudentOutcomeCategory.IN_PROGRESS:
        return [];
    }
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
   * Возобновление учёбы сбрасывает цепочку уведомлений о бездействии.
   */
  activate(): void {
    if (this._state.status !== 'enrolled') {
      this.throwBadRequest(
        `Нельзя активировать студента в статусе '${this._state.status}'.`,
      );
    }
    this.safeUpdate({
      status: 'active',
      notices: [],
    });
  }

  /**
   * Пометить, что уведомление данного типа отправлено.
   * Даёт idempotentность повтора «через день» и проверяемость строки
   * «уведомления были ранее отправлены» в уведомлении ментору.
   */
  markNoticed(kind: StudentNoticeKind, at: Date = new Date()): void {
    const record: StudentNoticeRecord = {
      kind,
      // Формат до минут — общий стандарт хранения дат проекта (isoNow)
      sentAt: at.toISOString().slice(0, 16),
    };
    // Последняя запись по kind — единственная значимая: заменяем её,
    // историю всех отправок не храним.
    const rest = (this._state.notices ?? []).filter((n) => n.kind !== kind);
    this.safeUpdate({ notices: [...rest, record] });
  }

  /** Последняя отправленная запись уведомления данного типа (или undefined). */
  getLastNotice(kind: StudentNoticeKind): StudentNoticeRecord | undefined {
    const records = this._state.notices ?? [];
    return records.find((n) => n.kind === kind);
  }

  /**
   * Самостоятельный выход из учёбы: active/enrolled → abandoned.
   * Публикует событие student.abandoned (UC'ем).
   */
  drop(): void {
    const status = this._state.status;
    if (status !== 'active' && status !== 'enrolled') {
      this.throwBadRequest(
        `Нельзя снять студента с учёбы в статусе '${status}'.`,
      );
    }
    this.safeUpdate({
      status: 'abandoned',
      abandonDetails: { who: 'self', cause: 'voluntary' },
    });
    this.#addAbandonedEvent('self', 'voluntary');
  }

  /**
   * Снятие с учёбы ментором: active/enrolled → abandoned.
   * Публикует событие student.abandoned (UC'ем).
   */
  markAbandoned(cause: 'inactivity' | 'by_mentor'): void {
    const status = this._state.status;
    if (status !== 'active' && status !== 'enrolled') {
      this.throwBadRequest(
        `Нельзя снять студента с учёбы в статусе '${status}'.`,
      );
    }
    this.safeUpdate({
      status: 'abandoned',
      abandonDetails: { who: 'mentor', cause },
    });
    this.#addAbandonedEvent('mentor', cause);
  }

  /** Добавляет событие снятия с учёбы (student.abandoned). */
  #addAbandonedEvent(
    who: 'self' | 'mentor',
    cause: 'voluntary' | 'inactivity' | 'by_mentor',
  ): void {
    this.addEvent({
      eventId: crypto.randomUUID(),
      eventName: 'student.abandoned',
      occurredAt: isoNow(),
      aggregateName: 'Student',
      aggregateId: this._state.uuid,
      payload: {
        studentId: this._state.uuid,
        userId: this._state.userId,
        streamId: this._state.streamId,
        who,
        cause,
      },
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

    // Возобновление учёбы сбрасывает цепочку уведомлений о бездействии
    this._state.notices = [];

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
