import * as v from 'valibot';
import {
  type GetModulePlaceCmd,
  type GetModulePlaceCmdMeta,
  GetModulePlaceCmdSchema,
  ModulePlaceSchema,
} from '#domain/course/commands/get-module-place-cmd';
import { CourseDs } from '#domain/course-ds';
import { Status } from '#domain/status';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case получения места модуля в программе курса.
 *
 * Ищет опубликованные курсы, содержащие модуль. Возвращает
 * isFirst/isLast/prev/next в линейном порядке фаз; undefined — модуль
 * не входит ни в один опубликованный курс.
 */
export class GetModulePlaceUc extends CourseUseCase<GetModulePlaceCmdMeta> {
  protected readonly ucName = 'get-module-place' as const;
  protected readonly ucLabel =
    'Получить место модуля в программе курса' as const;
  protected readonly arMeta = {
    arName: 'Course' as const,
    arLabel: 'Курс' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetModulePlaceCmdSchema;
  protected readonly outputSchema = v.optional(ModulePlaceSchema);

  async execute(
    command: GetModulePlaceCmd,
    _actorId?: string,
  ): Promise<GetModulePlaceCmdMeta['output']> {
    const courses = await this.resolve.courseRepo.getAll({
      status: Status.PUBLISHED,
    });

    const ds = new CourseDs();
    const containing = courses.filter((c) =>
      ds.includesModule(c, command.moduleId),
    );
    const course = containing[0];
    if (!course) return undefined;

    const allModuleIds = course.phases.flatMap((p) => p.moduleIds);
    const idx = allModuleIds.indexOf(command.moduleId);
    if (idx === -1) return undefined;

    return {
      courseId: course.uuid,
      isFirst: idx === 0,
      isLast: idx === allModuleIds.length - 1,
      prevModuleId: idx > 0 ? allModuleIds[idx - 1] : undefined,
      nextModuleId:
        idx < allModuleIds.length - 1 ? allModuleIds[idx + 1] : undefined,
    };
  }
}
