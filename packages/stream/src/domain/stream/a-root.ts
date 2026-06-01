import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import { StreamStatus } from '../status';
import type { CreateStreamCmd } from './commands/create-stream-cmd';
import type { ContentSnapshot, Stream, StreamArMeta } from './entity';
import { StreamSchema } from './entity';

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
    if (this._state.status === StreamStatus.ARCHIVED) {
      this.throwBadRequest('Поток уже находится в архиве.');
    }

    this.safeUpdate({
      status: StreamStatus.ARCHIVED,
    });
  }

  /**
   * Нахождение следующего шага в снимке контента потока.
   * Будет реализовано на следующем шаге.
   */
  findNextStep(_currentStepId: string): string | null {
    return null;
  }
}
