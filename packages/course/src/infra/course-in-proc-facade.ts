import type { CourseFacade } from '#domain/facade';
import type { ContentSnapshot } from '#domain/types';
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
}
