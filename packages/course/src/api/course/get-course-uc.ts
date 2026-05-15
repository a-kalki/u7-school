import { CourseAr } from '#domain/course/a-root';
import type {
  GetCourseCmd,
  GetCourseCmdMeta,
} from '#domain/course/commands/get-course-cmd';
import { GetCourseCmdSchema } from '#domain/course/commands/get-course-cmd';
import type { Course } from '#domain/course/entity';
import { CourseSchema } from '#domain/course/entity';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case получения курса по UUID.
 */
export class GetCourseUc extends CourseUseCase<GetCourseCmdMeta> {
  protected readonly ucName = 'get-course' as const;
  protected readonly ucLabel = 'Получить курс по UUID' as const;
  protected readonly arMeta = {
    arName: CourseAr.arName as 'Course',
    arLabel: CourseAr.arLabel as 'Курс',
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetCourseCmdSchema;
  protected readonly outputSchema = CourseSchema;

  async execute(command: GetCourseCmd, actorId?: string): Promise<Course> {
    const course = await this.getCourse(command.uuid);
    const actor = actorId ? await this.getUser(actorId, actorId) : undefined;
    return this.getOutCourse(course, actor);
  }
}
