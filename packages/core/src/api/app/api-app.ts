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

export class ApiApp<TMeta extends AppMeta>
  extends App
  implements ApiExecutor<TMeta>
{
  readonly #scheduler: JobScheduler | undefined;

  /**
   * @param mods — API-модули приложения
   * @param scheduler — планировщик job'ов (core/infra); опционален,
   *   если ни один модуль не регистрирует задания
   */
  constructor(
    mods: ConstructorParameters<typeof App>[0],
    scheduler?: JobScheduler,
  ) {
    super(mods);
    this.#scheduler = scheduler;
  }

  /**
   * Каскадная инициализация: вызывает init() у каждого модуля.
   * Должна вызываться после создания ApiApp и всех модулей.
   */
  init(): void {
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
    const jobs = this.getModules().flatMap((module) => module.jobs);
    if (jobs.length === 0) return;

    if (this.#scheduler === undefined) {
      throw new Error(
        'ApiApp: зарегистрированы задания, но планировщик не передан (второй аргумент конструктора)',
      );
    }
    this.#scheduler.start(jobs);
  }

  /**
   * Остановка периодических заданий (graceful shutdown).
   */
  stop(): void {
    this.#scheduler?.stop();
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

    // Делегируем выполнение модулю — логирование происходит внутри module.handle
    return module.execute(ucName, attrs, actorId);
  }
}
