import type { ContentSnapshot } from '#domain/content-snapshot';
import type { CourseFacade } from '#domain/facade';
import type { Step } from '#domain/step/entity';
import type { CourseApiModule } from '../api/module';

/**
 * In-process реализация фасада курсов.
 * Делегирует вызовы CourseApiModule, не дублируя бизнес-логику.
 */
export class CourseInProcFacade implements CourseFacade {
  constructor(private readonly courseModule: CourseApiModule) {}

  async getModuleSnapshot(moduleId: string): Promise<ContentSnapshot> {
    return this.courseModule.execute('get-module-snapshot', { moduleId });
  }

  async getStep(stepId: string): Promise<Step> {
    return this.courseModule.execute('get-step', { uuid: stepId });
  }
}
