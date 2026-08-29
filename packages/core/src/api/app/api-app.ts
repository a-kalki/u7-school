import { errBadRequest, throwError } from '#domain/errors/error-helpers';
import type { NoCommandFoundError } from '#domain/errors/errors';
import type {
  ApiExecutor,
  AppMeta,
  ExtractUcMetaFromMeta,
  GetUcNamesFromMeta,
} from '#domain/types';
import type { JobScheduler } from '../job/job-scheduler';
import { App } from './app';

/**
 * API-приложение. Модули передаются в конструктор (доменные зависимости),
 * планировщик заданий — через init() (техническая зависимость из core/infra).
 */
export class ApiApp<TMeta extends AppMeta>
  extends App
  implements ApiExecutor<TMeta>
{
  #scheduler: JobScheduler | undefined;

  /**
   * Приводит приложение в рабочее состояние: каскадная инициализация модулей
   * и получение технических зависимостей (планировщик заданий — реализация
   * из core/infra, например InProcJobScheduler).
   */
  init(scheduler: JobScheduler): void {
    this.#scheduler = scheduler;
    for (const module of this.getModules()) {
      module.init();
    }
  }

  /**
   * Запуск периодических заданий всех модулей через планировщик.
   * Вызывается после init() и после старта подписок UI (чтобы события
   * job'ов находили слушателей).
   */
  start(): void {
    if (this.#scheduler === undefined) {
      throw new Error('ApiApp: вызовите init(scheduler) перед start()');
    }
    const jobs = this.getModules().flatMap((module) => module.jobs);
    this.#scheduler.start(jobs);
  }

  /**
   * Остановка периодических заданий (graceful shutdown).
   * До init() останавливать нечего — безопасный no-op.
   */
  stop(): void {
    if (this.#scheduler === undefined) return;
    this.#scheduler.stop();
  }

  async execute<N extends GetUcNamesFromMeta<TMeta>>(
    ucName: N,
    attrs: ExtractUcMetaFromMeta<TMeta, N>['input'],
    actorId?: string,
  ): Promise<ExtractUcMetaFromMeta<TMeta, N>['output']> {
    const module = this.getModules().find((m) => m.hasCommand(ucName));
    if (!module) {
      return throwError(
        errBadRequest<NoCommandFoundError>(
          'NO_COMMAND_FOUND',
          `Команда '${ucName}' не найдена ни в одном зарегистрированном модуле`,
          { commandName: ucName, moduleName: 'ApiApp' },
        ),
      );
    }

    // Логирование — внутри module.execute
    return module.execute(ucName, attrs, actorId);
  }
}
