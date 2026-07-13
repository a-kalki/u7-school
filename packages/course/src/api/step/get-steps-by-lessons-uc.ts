import * as v from 'valibot';
import type { LessonRepo } from '#domain/lesson/repo';
import {
  type GetStepsByLessonsCmd,
  type GetStepsByLessonsCmdMeta,
  GetStepsByLessonsCmdSchema,
  type StepsByLesson,
} from '#domain/step/commands/get-steps-by-lessons-cmd';
import type { Step } from '#domain/step/entity';
import type { StepRepo } from '#domain/step/repo';
import { CourseUseCase } from '../course-uc';

/**
 * Получение шагов по ID уроков.
 * Возвращает шаги, сгруппированные по уроку (uuid + description).
 * Применяет StepPolicy.getVisibleFor для фильтрации по статусу.
 */
export class GetStepsByLessonsUc extends CourseUseCase<GetStepsByLessonsCmdMeta> {
  protected readonly ucName = 'get-steps-by-lessons' as const;
  protected readonly ucLabel = 'Получить шаги по ID уроков' as const;
  protected readonly arMeta = {
    arName: 'Step' as const,
    arLabel: 'Шаг' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetStepsByLessonsCmdSchema;
  protected readonly outputSchema = v.record(
    v.string(),
    v.array(
      v.object({
        uuid: v.pipe(v.string(), v.uuid()),
        description: v.string(),
      }),
    ),
  );

  async execute(
    command: GetStepsByLessonsCmd,
    actorId?: string,
  ): Promise<StepsByLesson> {
    const repo = this.resolve.stepRepo as StepRepo;
    const lessonRepo = this.resolve.lessonRepo as LessonRepo;

    // Загружаем уроки
    const lessons = await lessonRepo.getByIds(command.lessonIds);
    if (lessons.length === 0) return {};

    // Собираем все stepIds
    const allStepIds: string[] = [];
    const lessonStepMap = new Map<string, string[]>();
    for (const l of lessons) {
      lessonStepMap.set(l.uuid, l.stepIds);
      allStepIds.push(...l.stepIds);
    }

    // Загружаем шаги одним запросом
    const steps = await repo.getByIds(allStepIds);
    const stepMap = new Map<string, Step>();
    for (const s of steps) {
      stepMap.set(s.uuid, s);
    }

    // Фильтруем видимые и группируем по уроку
    const result: StepsByLesson = {};
    const actor = actorId ? await this.getUser(actorId, actorId) : undefined;

    for (const l of lessons) {
      const ids = lessonStepMap.get(l.uuid) ?? [];
      const visible: Array<{ uuid: string; description: string }> = [];

      for (const sid of ids) {
        const step = stepMap.get(sid);
        if (!step) continue;

        try {
          const out = await this.getOutStep(step, actor);
          visible.push({ uuid: out.uuid, description: out.description });
        } catch {
          // Шаг недоступен — пропускаем
        }
      }

      if (visible.length > 0) {
        result[l.uuid] = visible;
      }
    }

    return result;
  }
}
