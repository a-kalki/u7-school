import { Aggregate } from "@u7/core/domain";
import { isoNow } from "@u7/core/shared";
import type { CreateLessonCmd } from "./commands/create-lesson-cmd";
import type { Lesson, LessonArMeta } from "./entity";
import { LessonSchema } from "./entity";

/**
 * Агрегат Lesson — урок курса.
 * Архитектурно выделен в отдельный агрегат, но семантически является частью Course.
 * courseId задаётся при создании и никогда не меняется.
 * Права на редактирование делегируются CoursePolicy.
 */
export class LessonAr extends Aggregate<LessonArMeta> {
  constructor(state: Lesson) {
    super(state, LessonSchema);
  }

  /**
   * Фабричный метод создания нового урока из команды.
   */
  static create(command: CreateLessonCmd): LessonAr {
    const candidate: Lesson = {
      uuid: crypto.randomUUID(),
      courseId: command.courseId,
      title: command.title,
      additional: command.additional,
      status: command.status,
      order: command.order,
      createdAt: isoNow(),
      estimatedMinutes: command.estimatedMinutes,
      stepIds: command.stepIds ?? [],
      mentorStepIds: command.mentorStepIds ?? [],
    };

    return new LessonAr(candidate);
  }
}
