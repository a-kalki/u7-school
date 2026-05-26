import type { ContentSnapshot } from './types';

/**
 * Фасад модуля курсов для доступа из других модулей.
 */
export interface CourseFacade {
  /** Получить снимок контента модуля */
  getModuleSnapshot(moduleId: string): Promise<ContentSnapshot>;
}
