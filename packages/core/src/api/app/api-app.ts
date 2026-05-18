import { errBadRequest, throwError } from '#domain/errors/error-helpers';
import type { NoCommandFoundError } from '#domain/errors/errors';
import type { ApiModuleMeta, AppMeta } from '#domain/types';
import { ConsoleLogger } from '#shared/console-logger';
import { type Logger, LogLevel } from '#shared/logger';
import type { ApiModule } from '../module/api-module';
import { App } from './app';

export type ExtractUcMetas<
  TAppMeta extends AppMeta,
  N extends string,
> = Extract<TAppMeta['moduleMetas']['ucMetas'], { ucName: N }>;

/**
 * Реализация приложения для backend-окружения.
 * Принимает модули в конструкторе.
 * Опционально принимает логгер для телеметрии запросов.
 */
export class ApiApp<TMeta extends AppMeta> extends App {
  readonly #logger: Logger;

  constructor(modules: ApiModule<ApiModuleMeta, unknown>[], logger?: Logger) {
    super(modules);
    this.#logger = logger ?? new ConsoleLogger();
    this.#logger.setLogLevel(LogLevel.DEBUG);
  }

  async execute<N extends TMeta['moduleMetas']['ucMetas']['ucName']>(
    ucName: N,
    attrs: ExtractUcMetas<TMeta, N>['input'],
    actorId?: string,
  ): Promise<ExtractUcMetas<TMeta, N>['output']> {
    const start = performance.now();

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

    const result = (await module.handle({
      name: ucName,
      attrs,
      actorId,
    })) as Promise<ExtractUcMetas<TMeta, N>['output']>;

    const elapsed = (performance.now() - start).toFixed(1);
    this.#logger.info(
      this.constructor.name,
      `Обработан запрос ${String(ucName)} за ${elapsed}ms`,
    );

    return result;
  }
}
