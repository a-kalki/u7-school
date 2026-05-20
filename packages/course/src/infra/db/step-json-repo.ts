import { JsonFileRepo } from '@u7-scl/core/infra';
import type { Step } from '#domain/step/entity';
import { StepSchema } from '#domain/step/entity';
import type { StepRepo } from '#domain/step/repo';

/**
 * JSON-реализация репозитория шагов.
 */
export class StepJsonRepo extends JsonFileRepo<Step> implements StepRepo {
  constructor(filePath = 'data/courses/steps.json') {
    super(StepSchema, filePath);
  }

  async save(step: Step): Promise<void> {
    const all = await this.readAll();
    const idx = all.findIndex((s) => s.uuid === step.uuid);
    if (idx !== -1) all[idx] = step;
    else all.push(step);
    await this.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<Step | undefined> {
    const all = await this.readAll();
    return all.find((s) => s.uuid === uuid);
  }

  async getByIds(ids: string[]): Promise<Step[]> {
    const all = await this.readAll();
    return all.filter((s) => ids.includes(s.uuid));
  }

  async getByCourseId(courseId: string): Promise<Step[]> {
    const all = await this.readAll();
    return all.filter((s) => s.courseId === courseId);
  }
}
