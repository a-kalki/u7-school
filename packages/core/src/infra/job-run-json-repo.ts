import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { JobRunRepo } from './job-run-repo';

/** Формат файла хранилища */
interface JobRunFile {
  version: 1;
  lastRuns: Record<string, string>;
}

/**
 * Файловое JSON-хранилище моментов последних прогонов заданий.
 *
 * Читает файл лениво при первом обращении, пишет синхронно после каждого
 * прогона (файл мал — накладные расходы незначительны). Один экземпляр
 * рассчитан на один процесс.
 */
export class JobRunJsonRepo implements JobRunRepo {
  #filePath: string;
  #cache: JobRunFile | undefined;

  constructor(filePath: string) {
    this.#filePath = filePath;
  }

  getLastRunAt(jobName: string): string | undefined {
    return this.#read().lastRuns[jobName];
  }

  setLastRunAt(jobName: string, isoDateTime: string): void {
    const data = this.#read();
    data.lastRuns[jobName] = isoDateTime;
    this.#write(data);
  }

  #read(): JobRunFile {
    if (this.#cache) return this.#cache;

    if (!existsSync(this.#filePath)) {
      this.#cache = { version: 1, lastRuns: {} };
      return this.#cache;
    }

    try {
      const parsed = JSON.parse(
        readFileSync(this.#filePath, 'utf8'),
      ) as Partial<JobRunFile>;
      this.#cache = {
        version: 1,
        lastRuns: parsed.lastRuns ?? {},
      };
    } catch {
      // Повреждённый файл — начинаем историю заново (misfire не сработает
      // один цикл; для идемпотентных job'ов это безопаснее, чем падение)
      this.#cache = { version: 1, lastRuns: {} };
    }
    return this.#cache;
  }

  #write(data: JobRunFile): void {
    mkdirSync(dirname(this.#filePath), { recursive: true });
    writeFileSync(this.#filePath, `${JSON.stringify(data, null, 2)}\n`);
  }
}
