import * as v from 'valibot';
import {
  type ListStreamStudentsCmd,
  type ListStreamStudentsCmdMeta,
  ListStreamStudentsCmdSchema,
} from '#domain/stream/commands/list-stream-students-cmd';
import { StreamPolicy } from '#domain/stream/policy';
import { StudentSchema } from '#domain/student/entity';
import { StreamUseCase } from '../stream-uc';

export class ListStreamStudentsUc extends StreamUseCase<ListStreamStudentsCmdMeta> {
  protected readonly ucName = 'list-stream-students' as const;
  protected readonly ucLabel = 'Список студентов потока' as const;
  protected readonly arMeta = {
    arName: 'Student' as const,
    arLabel: 'Студент потока' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ListStreamStudentsCmdSchema;
  protected readonly outputSchema = v.array(StudentSchema);

  async execute(
    command: ListStreamStudentsCmd,
    actorId: string,
  ): Promise<ListStreamStudentsCmdMeta['output']> {
    // Загружаем поток для проверки прав
    const streamEntity = await this.getStream(command.streamId);

    // Проверка: ментор потока или админ
    const actor = await this.getActor(actorId);
    if (!StreamPolicy.canEdit(actor, streamEntity)) {
      this.throwAccessDenied();
    }

    return this.resolve.streamStudentRepo.getByStream(command.streamId);
  }
}
