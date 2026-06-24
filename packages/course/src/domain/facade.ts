import type { ContentSnapshot } from './content-snapshot';
import type { Step } from './step/entity';

/**
 * Фасад модуля курсов для доступа из других модулей.
 */
export interface CourseFacade {
  /** Получить снимок контента модуля */
  getModuleSnapshot(moduleId: string): Promise<ContentSnapshot>;

  /** Получить шаг по UUID */
  getStep(stepId: string): Promise<Step>;
}
