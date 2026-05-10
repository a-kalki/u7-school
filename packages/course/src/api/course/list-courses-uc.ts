import {
  type ListCoursesCmd,
  type ListCoursesCmdMeta,
  ListCoursesCmdSchema,
} from "#domain/course/commands/list-courses-cmd";
import type { Course } from "#domain/course/entity";
import { CourseSchema } from "#domain/course/entity";
import * as v from "valibot";
import { CourseUseCase } from "../course-uc";

/** Схема вывода: { courses: Course[] } */
const CoursesListOutputSchema = v.object({
  courses: v.array(CourseSchema),
});

/**
 * Use-case получения списка курсов.
 * Доступно всем. Поддерживает фильтрацию.
 */
export class ListCoursesUc extends CourseUseCase<ListCoursesCmdMeta> {
  protected readonly commandName = "list-courses" as const;
  protected readonly description = "Получить список курсов" as const;
  protected readonly arName = "course" as const;
  protected readonly arLabel = "Курс" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ListCoursesCmdSchema;
  protected readonly outputSchema = CoursesListOutputSchema;

  async execute(command: ListCoursesCmd): Promise<{ courses: Course[] }> {
    const courses = await this.resolve.courseRepo.getAll({
      status: command.status,
      authorId: command.authorId,
      title: command.title,
      kind: command.kind,
      tags: command.tags,
      sort: command.sort,
      limit: command.limit,
    });
    return { courses };
  }
}
