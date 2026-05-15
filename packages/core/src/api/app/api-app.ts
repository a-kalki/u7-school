import { errBadRequest, throwError } from '#domain/errors/error-helpers';
import type { NoCommandFoundError } from '#domain/errors/errors';
import type { AppMeta } from '#domain/types';
import { App } from './app';

export type ExtractUcMetas<
  TAppMeta extends AppMeta,
  N extends string,
> = Extract<TAppMeta['moduleMetas']['ucMetas'], { ucName: N }>;

/**
 * Реализация приложения для backend-окружения
 */
export class ApiApp<TMeta extends AppMeta> extends App {
  async execute<N extends TMeta['moduleMetas']['ucMetas']['ucName']>(
    ucName: N,
    attrs: ExtractUcMetas<TMeta, N>['input'],
    actorId?: string,
  ): Promise<ExtractUcMetas<TMeta, N>['output']> {
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

    return module.handle({
      name: ucName,
      attrs,
      actorId,
    }) as Promise<ExtractUcMetas<TMeta, N>['output']>;
  }
}
