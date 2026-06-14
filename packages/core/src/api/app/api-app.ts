import { errBadRequest, throwError } from '#domain/errors/error-helpers';
import type { NoCommandFoundError } from '#domain/errors/errors';
import type {
  ApiExecutor,
  ApiModuleMeta,
  AppMeta,
  ExtractUcMetaFromMeta,
  GetUcNamesFromMeta,
} from '#domain/types';
import type { ApiModule } from '../module/api-module';
import { App } from './app';

/**
 * Реализация приложения.
 * Принимает модули в конструкторе и реализует ApiExecutor.
 *
 * Логирование выполнения команд делегировано в ApiModule.handle —
 * здесь остаётся только диспетчеризация.
 */
export class ApiApp<TMeta extends AppMeta>
  extends App
  implements ApiExecutor<TMeta>
{
  constructor(modules: ApiModule<ApiModuleMeta, any>[]) {
    super(modules);
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
    return module.handle({
      name: ucName,
      attrs,
      actorId,
    }) as Promise<ExtractUcMetaFromMeta<TMeta, N>['output']>;
  }
}
