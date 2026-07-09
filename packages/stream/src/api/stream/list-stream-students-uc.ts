import * as v from 'valibot';
import {
  type ListStreamStudentsCmd,
  type ListStreamStudentsCmdMeta,
  ListStreamStudentsCmdSchema,
} from '#domain/stream/commands/list-stream-students-cmd';
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
    _actorId: string,
  ): Promise<ListStreamStudentsCmdMeta['output']> {
    const students = await this.resolve.streamStudentRepo.getByStream(
      command.streamId,
    );

    // Фильтрация по статусу, если указан
    if (command.status) {
      return students.filter((s) => s.status === command.status);
    }

    return students;
  }
}
