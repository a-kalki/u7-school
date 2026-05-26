import type { Step } from './entity';

/** Интерфейс репозитория шагов */
export interface StepRepo {
  save(step: Step): Promise<void>;
  getByUuid(uuid: string): Promise<Step | undefined>;
  getByIds(ids: string[]): Promise<Step[]>;
  getByCourseId(moduleId: string): Promise<Step[]>;
}
