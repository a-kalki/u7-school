import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import { Status } from '../status';
import type { Course, CourseArMeta, Phase } from './entity';
import { CourseSchema } from './entity';

/**
 * Агрегат Course — объединяет модули в упорядоченную последовательность фаз.
 * Фаза идентифицируется по title (уникален в пределах курса).
 * Инвариант: названия фаз уникальны.
 */
export class CourseAr extends Aggregate<CourseArMeta> {
  static readonly arName = 'Course';
  static readonly arLabel = 'Курс';

  constructor(state: Course) {
    super(state, CourseSchema);
  }

  /** Инвариант: названия фаз должны быть уникальны. */
  protected override checkInvariant(): void {
    super.checkInvariant();
    const titles = this._state.phases.map((p) => p.title);
    if (new Set(titles).size !== titles.length) {
      this.throwInvariant(
        { phases: this._state.phases },
        'Названия фаз должны быть уникальны в пределах курса',
      );
    }
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

  /** Добавление фазы в курс. Title должен быть уникален. */
  addPhase(title: string, track?: string): void {
    if (this._state.phases.some((p) => p.title === title)) {
      this.throwBadRequest('Фаза с таким названием уже существует');
    }

    const phase: Phase = {
      title,
      track,
      moduleIds: [],
    };

    this._state.phases.push(phase);
    this.safeUpdate({});
  }

  /** Добавление модуля в фазу курса по названию фазы. */
  addModuleToPhase(phaseTitle: string, moduleId: string): void {
    const phase = this._state.phases.find((p) => p.title === phaseTitle);
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

  /**
   * ID предыдущего модуля в линейном порядке фаз (статический).
   */
  static getPrevModuleId(
    course: Course,
    targetModuleId: string,
  ): string | undefined | null {
    const allModuleIds = course.phases.flatMap((p) => p.moduleIds);
    const targetIndex = allModuleIds.indexOf(targetModuleId);
    if (targetIndex === -1) return null;
    if (targetIndex === 0) return undefined;
    return allModuleIds[targetIndex - 1] ?? null;
  }
}
