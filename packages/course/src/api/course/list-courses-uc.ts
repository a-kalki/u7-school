import * as v from 'valibot';
import {
  type ListCoursesCmd,
  type ListCoursesCmdMeta,
  ListCoursesCmdSchema,
} from '#domain/course/commands/list-courses-cmd';
import type { Course } from '#domain/course/entity';
import { CourseSchema } from '#domain/course/entity';
import { Status } from '#domain/status';
import { CourseUseCase } from '../course-uc';

const CoursesListOutputSchema = v.array(CourseSchema);

/**
 * Use-case получения списка курсов.
 * Без actorId — только PUBLISHED.
 */
export class ListCoursesUc extends CourseUseCase<ListCoursesCmdMeta> {
  protected readonly ucName = 'list-courses' as const;
  protected readonly ucLabel = 'Получить список курсов' as const;
  protected readonly arMeta = {
    arName: 'Course' as const,
    arLabel: 'Курс' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ListCoursesCmdSchema;
  protected readonly outputSchema = CoursesListOutputSchema;

  async execute(command: ListCoursesCmd, _actorId?: string): Promise<Course[]> {
    const courses = await this.resolve.courseRepository.getAll({
      status: command.status ?? Status.PUBLISHED,
      authorId: command.authorId,
      title: command.title,
      sort: command.sort,
      limit: command.limit,
    });

    return courses;
  }
}
