import { errNotFound } from "@u7/core/domain";
import {
  type GetLessonCmd,
  type GetLessonCmdMeta,
  GetLessonCmdSchema,
} from "#domain/lesson/commands/get-lesson-cmd";
import type { LessonNotFoundUcError } from "#domain/lesson/commands/errors";
import type { Lesson } from "#domain/lesson/entity";
import { LessonSchema } from "#domain/lesson/entity";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case получения урока по UUID.
 * Доступно всем.
 */
export class GetLessonUc extends CourseUseCase<GetLessonCmdMeta> {
  protected readonly commandName = "get-lesson" as const;
  protected readonly description = "Получить урок по UUID" as const;
  protected readonly arName = "lesson" as const;
  protected readonly arLabel = "Урок" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetLessonCmdSchema;
  protected readonly outputSchema = LessonSchema;

  async execute(command: GetLessonCmd): Promise<Lesson> {
    const lesson = await this.resolve.lessonRepo.getByUuid(command.uuid);
    if (!lesson) {
      this.throwError(
        errNotFound<LessonNotFoundUcError>(
          "LESSON_NOT_FOUND",
          "Урок не найден",
          { uuid: command.uuid },
        ),
      );
    }
    return lesson;
  }
}
