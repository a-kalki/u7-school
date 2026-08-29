import type { Job } from '../api/job/job';
import type { JobExecutor } from '../api/job/job-executor';

/**
 * Исполнитель прогонов в текущем процессе.
 *
 * Прямая реализация порта JobExecutor. Будущее: WorkerJobExecutor —
 * вынос тяжёлых заданий в отдельный процесс (предусловие — внешнее
 * хранилище: in-memory JSON-репо недоступны из воркера).
 */
export class InProcJobExecutor implements JobExecutor {
  async execute(job: Job): Promise<void> {
    await job.execute();
  }
}
