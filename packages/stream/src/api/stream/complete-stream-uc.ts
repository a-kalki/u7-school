import { errConflict } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import {
  type CompleteStreamCmd,
  type CompleteStreamCmdMeta,
  CompleteStreamCmdSchema,
} from '#domain/stream/commands/complete-stream-cmd';
import { StreamPolicy } from '#domain/stream/policy';
import type { StreamConflictUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case завершения потока.
 * Проверяет, что все студенты не в статусе active, и завершает поток.
 * Статусы студентов меняются заранее через complete-student / mark-abandoned.
 */
export class CompleteStreamUc extends StreamUseCase<CompleteStreamCmdMeta> {
  protected readonly ucName = 'complete-stream' as const;
  protected readonly ucLabel = 'Завершить поток' as const;
  protected readonly arMeta = {
    arName: 'Stream' as const,
    arLabel: 'Поток' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CompleteStreamCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: CompleteStreamCmd,
    actorId: string,
  ): Promise<undefined> {
    const streamEntity = await this.getStream(command.streamId);

    // Проверка прав: ментор потока или админ
    const actor = await this.getActor(actorId);
    if (!StreamPolicy.canEdit(actor, streamEntity)) {
      this.throwAccessDenied();
    }

    // Проверка: не должно остаться активных студентов
    const students = await this.resolve.streamStudentRepo.getByStream(
      command.streamId,
    );
    const activeStudents = students.filter((s) => s.status === 'active');
    if (activeStudents.length > 0) {
      this.throwError(
        errConflict<StreamConflictUcError>(
          'STREAM_CONFLICT',
          `Нельзя завершить поток: ${activeStudents.length} студентов ещё активны. Сначала укажите исход для каждого.`,
          { activeCount: activeStudents.length },
        ) as StreamUcErrors,
      );
    }

    const streamAr = new StreamAr(streamEntity);
    streamAr.complete();
    await this.resolve.streamRepo.save(streamAr.state);

    return undefined;
  }
}
