import { CourseAr } from '#domain/course/a-root';
import {
  type AddModuleCmd,
  type AddModuleCmdMeta,
  AddModuleCmdSchema,
} from '#domain/course/commands/add-module-cmd';
import type { Course } from '#domain/course/entity';
import { CourseSchema } from '#domain/course/entity';
import { CoursePolicy } from '#domain/course/policy';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case добавления модуля в курс (этап 3a).
 * Редактировать может автор или ADMIN.
 */
export class AddModuleUc extends CourseUseCase<AddModuleCmdMeta> {
  protected readonly ucName = 'add-module' as const;
  protected readonly ucLabel = 'Добавить модуль в курс' as const;
  protected readonly arMeta = {
    arName: CourseAr.arName as 'Course',
    arLabel: CourseAr.arLabel as 'Курс',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = AddModuleCmdSchema;
  protected readonly outputSchema = CourseSchema;

  async execute(command: AddModuleCmd, actorId: string): Promise<Course> {
    const course = await this.getCourse(command.courseId);
    const actor = await this.getActor(actorId);

    if (!CoursePolicy.canEdit(actor, course)) {
      this.throwAccessDenied('Недостаточно прав для редактирования курса');
    }

    const ar = new CourseAr(course);
    ar.addModule(command);
    await this.resolve.courseRepo.save(ar.state);

    return ar.state;
  }
}
