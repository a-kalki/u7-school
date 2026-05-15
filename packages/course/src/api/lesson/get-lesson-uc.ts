import { errNotFound } from '@u7/core/domain';
import { LessonAr } from '#domain/lesson/a-root';
import type { LessonNotFoundUcError } from '#domain/lesson/commands/errors';
import {
  type GetLessonCmd,
  type GetLessonCmdMeta,
  GetLessonCmdSchema,
} from '#domain/lesson/commands/get-lesson-cmd';
import type { Lesson } from '#domain/lesson/entity';
import { LessonSchema } from '#domain/lesson/entity';
import type { LessonRepo } from '#domain/lesson/repo';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case получения урока по UUID.
 * Без actorId — только PUBLISHED. С actorId — через LessonPolicy.
 */
export class GetLessonUc extends CourseUseCase<GetLessonCmdMeta> {
  protected readonly ucName = 'get-lesson' as const;
  protected readonly ucLabel = 'Получить урок по UUID' as const;
  protected readonly arMeta = {
    arName: LessonAr.arName as 'Lesson',
    arLabel: LessonAr.arLabel as 'Урок',
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetLessonCmdSchema;
  protected readonly outputSchema = LessonSchema;

  async execute(command: GetLessonCmd, actorId?: string): Promise<Lesson> {
    const lesson = await (this.resolve.lessonRepo as LessonRepo).getByUuid(
      command.uuid,
    );
    if (!lesson) {
      this.throwError(
        errNotFound<LessonNotFoundUcError>(
          'LESSON_NOT_FOUND',
          'Урок не найден',
          { uuid: command.uuid },
        ),
      );
    }

    const actor = actorId ? await this.getUser(actorId, actorId) : undefined;

    return this.getOutLesson(lesson, actor);
  }
}
