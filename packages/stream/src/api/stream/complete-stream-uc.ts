import type { User } from '@u7-scl/app/domain';
import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import {
  type CompleteStreamCmd,
  type CompleteStreamCmdMeta,
  CompleteStreamCmdSchema,
} from '#domain/stream/commands/complete-stream-cmd';
import { StreamPolicy } from '#domain/stream/policy';
import { StreamDs } from '#domain/stream-ds';
import { StudentAr } from '#domain/student/a-root';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case завершения потока.
 * Оркестрация: инвариант терминальности студентов и переход — StreamDs
 * (ФР-2 трека peer-review); статусы студентов меняются заранее через
 * complete-student / mark-abandoned. UC доменных решений не принимает.
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

  async execute(command: CompleteStreamCmd, actor: User): Promise<undefined> {
    const streamEntity = await this.getStream(command.streamId);

    // Проверка прав: ментор потока или админ
    if (!StreamPolicy.canEdit(actor, streamEntity)) {
      this.throwAccessDenied();
    }

    // Инвариант терминальности + переход — StreamDs (ФР-2)
    const students = await this.resolve.streamStudentRepo.getByStream(
      command.streamId,
    );
    const streamAr = new StreamAr(streamEntity);
    StreamDs.completeStream(
      streamAr,
      students.map((s) => new StudentAr(s)),
    );

    await this.resolve.streamRepo.save(streamAr.state);

    // Событие stream.completed — триггер кампаний peer-review и других
    // подписчиков; публикуем только после успешного сохранения
    this.publishEvents(streamAr);

    return undefined;
  }
}
