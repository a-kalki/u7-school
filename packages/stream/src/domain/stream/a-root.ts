import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import { StreamStatus } from '../status';
import type { CreateStreamCmd } from './commands/create-stream-cmd';
import type { ContentSnapshot, Stream, StreamArMeta } from './entity';
import { StreamSchema } from './entity';
import { StreamPolicy } from './policy';

/**
 * Агрегат Stream — корень учебного потока.
 */
export class StreamAr extends Aggregate<StreamArMeta> {
  static readonly arName = 'Stream';
  static readonly arLabel = 'Поток';

  constructor(state: Stream) {
    super(state, StreamSchema);
  }

  /**
   * Фабричный метод для создания нового потока.
   */
  static create(
    cmd: CreateStreamCmd,
    contentSnapshot: ContentSnapshot,
  ): StreamAr {
    const candidate: Stream = {
      uuid: crypto.randomUUID(),
      title: cmd.title,
      description: cmd.description,
      mentorId: cmd.mentorId,
      moduleId: cmd.moduleId,
      startDate: cmd.startDate,
      status: StreamStatus.ENROLLMENT,
      telegramGroupId: cmd.telegramGroupId,
      goal: cmd.goal,
      result: cmd.result,
      rules: cmd.rules,
      additional: cmd.additional,
      targetAudience: cmd.targetAudience,
      contentSnapshot,
      createdAt: isoNow(),
    };

    return new StreamAr(candidate);
  }

  /**
   * Запуск потока (перевод из открытой записи в активный статус).
   */
  activate(): void {
    if (this._state.status !== StreamStatus.ENROLLMENT) {
      this.throwBadRequest(
        `Недопустимый переход статуса. Поток в статусе '${this._state.status}' не может быть запущен.`,
      );
    }

    this.safeUpdate({
      status: StreamStatus.ACTIVE,
    });
  }

  /**
   * Успешное завершение потока.
   */
  complete(): void {
    if (this._state.status !== StreamStatus.ACTIVE) {
      this.throwBadRequest(
        `Недопустимый переход статуса. Поток в статусе '${this._state.status}' не может быть завершён.`,
      );
    }

    this.safeUpdate({
      status: StreamStatus.COMPLETED,
    });
  }

  /**
   * Отправка потока в архив.
   */
  archive(): void {
    if (StreamPolicy.isArchived(this._state)) {
      this.throwBadRequest('Поток уже находится в архиве.');
    }

    this.safeUpdate({
      status: StreamStatus.ARCHIVED,
    });
  }

  /**
   * Возвращает ID первого шага в потоке.
   */
  getFirstStepId(): string | null {
    for (const project of this._state.contentSnapshot) {
      for (const lesson of project.lessons) {
        if (lesson.stepIds.length > 0) {
          return lesson.stepIds[0] ?? null;
        }
      }
    }
    return null;
  }

  /**
   * Нахождение следующего шага в снимке контента потока.
   * Обходит дерево контента в глубину и возвращает UUID следующего шага.
   */
  findNextStep(currentStepId: string): string | null {
    const allStepIds: string[] = [];

    for (const project of this._state.contentSnapshot) {
      for (const lesson of project.lessons) {
        for (const stepId of lesson.stepIds) {
          allStepIds.push(stepId);
        }
      }
    }

    const index = allStepIds.indexOf(currentStepId);
    if (index === -1) {
      this.throwBadRequest('Шаг не найден в структуре потока');
    }

    if (index === allStepIds.length - 1) {
      return null;
    }

    return allStepIds[index + 1] ?? null;
  }

  /**
   * Контекст шага в дереве контента.
   * Определяет, является ли шаг последним в уроке, и является ли урок последним в проекте.
   */
  findStepContext(stepId: string): {
    lessonId: string;
    projectId: string;
    isLastStepInLesson: boolean;
    isLastLessonInProject: boolean;
  } {
    for (const project of this._state.contentSnapshot) {
      for (let li = 0; li < project.lessons.length; li++) {
        const lesson = project.lessons[li];
        if (!lesson) continue;
        for (let si = 0; si < lesson.stepIds.length; si++) {
          if (lesson.stepIds[si] === stepId) {
            return {
              lessonId: lesson.lessonId,
              projectId: project.projectId,
              isLastStepInLesson: si === lesson.stepIds.length - 1,
              isLastLessonInProject: li === project.lessons.length - 1,
            };
          }
        }
      }
    }
    this.throwBadRequest('Шаг не найден в структуре потока');
  }
}
