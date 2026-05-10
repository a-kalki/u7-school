import { errAccessDenied } from "@u7/core/domain";
import { CourseAr } from "#domain/course/a-root";
import {
  type CreateCourseCmd,
  type CreateCourseCmdMeta,
  CreateCourseCmdSchema,
} from "#domain/course/commands/create-course-cmd";
import type { CourseAccessDeniedUcError } from "#domain/course/commands/errors";
import type { Course } from "#domain/course/entity";
import { CourseSchema } from "#domain/course/entity";
import { CoursePolicy } from "#domain/course/policy";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case создания курса.
 * Требует прав ADMIN или MENTOR.
 */
export class CreateCourseUc extends CourseUseCase<CreateCourseCmdMeta> {
  protected readonly commandName = "create-course" as const;
  protected readonly description = "Создать курс" as const;
  protected readonly arName = "course" as const;
  protected readonly arLabel = "Курс" as const;
  protected readonly type = "command" as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateCourseCmdSchema;
  protected readonly outputSchema = CourseSchema;

  async execute(command: CreateCourseCmd, actorId: string): Promise<Course> {
    // Получаем актора
    const actor = await this.resolve.userFacade.getUserByUuid(actorId);
    if (!actor) {
      this.throwError(
        errAccessDenied<CourseAccessDeniedUcError>(
          "COURSE_ACCESS_DENIED",
          "Пользователь не найден",
          undefined,
        ),
      );
    }

    // Проверка прав
    if (!CoursePolicy.canCreate(actor)) {
      this.throwError(
        errAccessDenied<CourseAccessDeniedUcError>(
          "COURSE_ACCESS_DENIED",
          "Недостаточно прав для создания курса",
          undefined,
        ),
      );
    }

    const ar = CourseAr.create(command);
    // Устанавливаем реальный authorId
    const state = { ...ar.state, authorId: actorId } as Course;
    await this.resolve.courseRepo.save(state);

    return state;
  }
}
