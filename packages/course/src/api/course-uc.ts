import { type UcMeta, UseCase } from "@u7/core/api";
import { errNotFound } from "@u7/core/domain";
import type { CourseApiModuleResolver } from "#domain/module";
import type { CourseNotFoundUcError } from "#domain/course/commands/errors";
import type { Course } from "#domain/course/entity";

/**
 * Базовый абстрактный класс для всех use-case'ов модуля курсов.
 * Приватный для пакета @u7/course — не экспортируется наружу.
 */
export abstract class CourseUseCase<TMeta extends UcMeta> extends UseCase<
  TMeta,
  CourseApiModuleResolver
> {
  /**
   * Получает курс по его ID.
   * Выбрасывает COURSE_NOT_FOUND, если курс не найден.
   */
  protected async getCourse(courseId: string): Promise<Course> {
    const course = await this.resolve.courseRepo.getByUuid(courseId);
    if (!course) {
      this.throwError(
        errNotFound<CourseNotFoundUcError>(
          "COURSE_NOT_FOUND",
          "Курс не найден",
          { uuid: courseId },
        ),
      );
    }
    return course;
  }
}
