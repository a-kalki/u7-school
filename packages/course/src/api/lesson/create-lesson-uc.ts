import { CourseDs } from '#domain/course-ds';
import { LessonAr } from '#domain/lesson/a-root';
import {
  type CreateLessonCmd,
  type CreateLessonCmdMeta,
  CreateLessonCmdSchema,
} from '#domain/lesson/commands/create-lesson-cmd';
import type { Lesson } from '#domain/lesson/entity';
import { LessonSchema } from '#domain/lesson/entity';
import { LessonPolicy } from '#domain/lesson/policy';
import { ModuleAr } from '#domain/module/a-root';
import { ModulePolicy } from '#domain/module/policy';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case создания урока.
 * Требует прав AUTHOR + проверка авторства курса через ModulePolicy.
 * Использует CourseDs для координации Course + Lesson + транзакционное сохранение.
 */
export class CreateLessonUc extends CourseUseCase<CreateLessonCmdMeta> {
  protected readonly ucName = 'create-lesson' as const;
  protected readonly ucLabel = 'Создать урок' as const;
  protected readonly arMeta = {
    arName: LessonAr.arName as 'Lesson',
    arLabel: LessonAr.arLabel as 'Урок',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateLessonCmdSchema;
  protected readonly outputSchema = LessonSchema;

  async execute(command: CreateLessonCmd, actorId: string): Promise<Lesson> {
    const actor = await this.getActor(actorId);

    if (!LessonPolicy.canCreate(actor)) {
      this.throwAccessDenied('Недостаточно прав для создания урока');
    }

    const courseState = await this.getModule(command.moduleId);
    if (!ModulePolicy.canEdit(actor, courseState)) {
      this.throwAccessDenied('Вы не являетесь автором модуля');
    }

    const courseAr = new ModuleAr(courseState);
    const ds = new CourseDs();
    const { module, lesson } = ds.createLesson(
      courseAr,
      command,
      command.projectId,
    );

    const db = this.resolve.db;
    if (db) {
      db.begin();
      try {
        await this.resolve.courseRepo.save(module.state);
        await this.resolve.lessonRepo.save(lesson.state);
        await db.commit();
      } catch (e) {
        db.rollback();
        throw e;
      }
    } else {
      await this.resolve.courseRepo.save(module.state);
      await this.resolve.lessonRepo.save(lesson.state);
    }

    return lesson.state;
  }
}
