import type { UcDocType, UseCase } from '#api/uc/use-case';
import { errBadRequest, throwError } from '#domain/errors/error-helpers';
import type { NoCommandFoundError } from '#domain/errors/errors';
import type {
  ApiExecutor,
  ApiModuleMeta,
  AppEnvMode,
  ExtractUcMetaFromMeta,
  GetUcNamesFromMeta,
  ModuleCommand,
  ModuleResolver,
} from '#domain/types';
import type { Logger } from '#shared/logger';
import { ConsoleLogger, LogLevel } from '#shared/console-logger';

/**
 * Абстрактный API-модуль.
 *
 * @typeParam TMeta — метаданные модуля (команды, URL, имя)
 * @typeParam TResolve — резолвер зависимостей (расширяет ModuleResolver)
 */
export abstract class ApiModule<
  TMeta extends ApiModuleMeta,
  TResolve extends ModuleResolver,
> implements ApiExecutor<TMeta> {
  abstract readonly name: TMeta['name'];
  abstract readonly useCases: UseCase<ApiModuleMeta['ucMetas'], TResolve>[];

  protected resolve!: TResolve;

  /** Логгер, извлечённый из resolve.appResolver */
  logger!: Logger;

  /** Режим работы приложения, извлечённый из resolve.appResolver */
  mode!: AppEnvMode;

  // Кэш для быстрого поиска use-case по имени
  private useCaseMap = new Map<
    string,
    UseCase<ApiModuleMeta['ucMetas'], TResolve>
  >();

  /**
   * Вызывается наследником в конструкторе после super().
   * Инициализирует все use-case'ы переданным резолвером,
   * а также извлекает logger и mode из resolve.appResolver.
   */
  protected init(resolve: TResolve) {
    this.resolve = resolve;
    this.logger = resolve.appResolver.logger;
    this.mode = resolve.appResolver.mode;

    for (const uc of this.useCases) {
      uc.init(resolve);
      this.useCaseMap.set(uc.getUcName(), uc);
    }
  }

  hasCommand(commandName: string): boolean {
    return this.useCaseMap.has(commandName);
  }

  /**
   * Выполняет команду с полной типизацией ввода/вывода.
   * Реализует интерфейс ApiExecutor<TMeta>.
   */
  async execute<N extends GetUcNamesFromMeta<TMeta>>(
    ucName: N,
    attrs: ExtractUcMetaFromMeta<TMeta, N>['input'],
    actorId?: string,
  ): Promise<ExtractUcMetaFromMeta<TMeta, N>['output']> {
    return this.handle({
      name: ucName,
      attrs,
      actorId,
    }) as Promise<ExtractUcMetaFromMeta<TMeta, N>['output']>;
  }

  /**
   * Обрабатывает команду: находит use-case, выполняет и логирует.
   * Замер времени и телеметрия происходят здесь — единая точка
   * для вызовов как через ApiApp, так и напрямую через модуль.
   */
  async handle(command: ModuleCommand): Promise<unknown> {
    const start = performance.now();

    const uc = this.useCaseMap.get(command.name);

    if (!uc) {
      this.throwNoCommandFound(command.name);
    }

    const result = await uc.handle(command.attrs, command.actorId);

    const elapsed = (performance.now() - start).toFixed(1);
    this.logger.info(
      this.constructor.name,
      `Обработан запрос ${String(command.name)} за ${elapsed}ms`,
    );

    return result;
  }

  protected throwNoCommandFound(commandName: string): never {
    throwError(
      errBadRequest<NoCommandFoundError>(
        'NO_COMMAND_FOUND',
        `Команда '${commandName}' не найдена в модуле '${this.name}'`,
        {
          commandName,
          moduleName: this.name,
        },
      ),
    );
  }

  /**
   * Возвращает метаданные команд модуля.
   * Агрегирует getDocType() каждого use-case.
   */
  getDocTypes(): UcDocType[] {
    return this.useCases.map((uc) => uc.getDocType());
  }
}
