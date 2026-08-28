import { errNotFound } from '@u7-scl/core/domain';
import type * as v from 'valibot';
import type { ContentSnapshot } from '#domain/content-snapshot';
import type { CourseNotFoundUcError } from '#domain/course/commands/errors';
import {
  CourseProgramSchema,
  type GetCourseProgramCmd,
  type GetCourseProgramCmdMeta,
  GetCourseProgramCmdSchema,
} from '#domain/course/commands/get-course-program-cmd';
import { CourseDs } from '#domain/course-ds';
import type { Lesson } from '#domain/lesson/entity';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case получения программы курса: агрегация снимков модулей по фазам.
 *
 * Снимки собираются в анонимной видимости (как раньше делал фасад):
 * getOutModule/getOutLesson применяются без актора. Сборка снимка — CourseDs.
 */
export class GetCourseProgramUc extends CourseUseCase<GetCourseProgramCmdMeta> {
  protected readonly ucName = 'get-course-program' as const;
  protected readonly ucLabel = 'Получить программу курса' as const;
  protected readonly arMeta = {
    arName: 'Course' as const,
    arLabel: 'Курс' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetCourseProgramCmdSchema;
  protected readonly outputSchema = CourseProgramSchema;

  async execute(
    command: GetCourseProgramCmd,
    _actorId?: string,
  ): Promise<v.InferOutput<typeof CourseProgramSchema>> {
    const course = await this.resolve.courseRepo.getByUuid(command.courseId);
    if (!course) {
      this.throwError(
        errNotFound<CourseNotFoundUcError>(
          'COURSE_NOT_FOUND',
          'Курс не найден',
          { uuid: command.courseId },
        ),
      );
    }

    const phases = await Promise.all(
      course.phases.map(async (phase) => ({
        title: phase.title,
        track: phase.track,
        modules: await Promise.all(
          phase.moduleIds.map((moduleId) => this.#moduleSnapshot(moduleId)),
        ),
      })),
    );

    return { course, phases };
  }

  /** Снимок контента модуля в анонимной видимости. */
  async #moduleSnapshot(moduleId: string): Promise<ContentSnapshot> {
    const module = await this.getModule(moduleId);
    this.getOutModule(module, undefined);

    const uniqueLessonIds = [
      ...new Set(module.projects.flatMap((p) => p.lessonIds)),
    ];

    const lessons: Lesson[] = [];
    for (const lessonId of uniqueLessonIds) {
      const lesson = await this.resolve.lessonRepo.getByUuid(lessonId);
      if (lesson) {
        lessons.push(await this.getOutLesson(lesson, undefined));
      }
    }

    const ds = new CourseDs();
    return ds.buildSnapshot(module, lessons);
  }
}
