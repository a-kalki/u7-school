import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import { Status } from '../status';
import type { Course, CourseArMeta, Phase } from './entity';
import { CourseSchema } from './entity';

/**
 * Агрегат Course — объединяет модули в упорядоченную последовательность фаз.
 */
export class CourseAr extends Aggregate<CourseArMeta> {
  static readonly arName = 'Course';
  static readonly arLabel = 'Курс';

  constructor(state: Course) {
    super(state, CourseSchema);
  }

  /** Создание нового курса (статус: draft). */
  static create(
    title: string,
    description: string,
    authorId: string,
  ): CourseAr {
    const candidate: Course = {
      uuid: crypto.randomUUID(),
      title,
      description,
      authorId,
      phases: [],
      status: Status.DRAFT,
      createdAt: isoNow(),
    };

    return new CourseAr(candidate);
  }

  /** Добавление фазы в курс. */
  addPhase(title: string, track?: string): void {
    const phase: Phase = {
      id: crypto.randomUUID(),
      title,
      track,
      moduleIds: [],
    };

    this._state.phases.push(phase);
    this.safeUpdate({});
  }

  /** Добавление модуля в фазу курса. */
  addModuleToPhase(phaseId: string, moduleId: string): void {
    const phase = this._state.phases.find((p) => p.id === phaseId);
    if (!phase) this.throwBadRequest('Фаза не найдена');
    phase.moduleIds.push(moduleId);
    this.safeUpdate({});
  }

  /** Публикация курса. */
  publish(): void {
    if (this._state.status === Status.PUBLISHED) {
      this.throwBadRequest('Курс уже опубликован');
    }
    this.safeUpdate({ status: Status.PUBLISHED });
  }
}
