import type { UcMeta } from '../api/uc/use-case';
import type { Logger } from '../shared/logger';

export interface ApiModuleMeta {
  name: string;
  url: string;
  ucMetas: UcMeta;
}

export interface AppMeta {
  name: string;
  moduleMetas: ApiModuleMeta;
}

// ══ Системные типы ══

/** Режим работы приложения */
export type AppEnvMode = 'test' | 'development' | 'production';

/**
 * Глобальные зависимости уровня приложения.
 * Содержит сквозные сервисы, доступные всем модулям.
 */
export interface AppResolver {
  logger: Logger;
  mode: AppEnvMode;
}

/**
 * Базовый резолвер модуля.
 * Каждый модуль расширяет его своими специфичными зависимостями.
 */
export interface ModuleResolver {
  appResolver: AppResolver;
}

// ══ Универсальный исполнитель команд ══

/** Извлекает имена use-case из метаданных (AppMeta или ApiModuleMeta) */
export type GetUcNamesFromMeta<TMeta> = TMeta extends AppMeta
  ? TMeta['moduleMetas']['ucMetas']['ucName']
  : TMeta extends ApiModuleMeta
  ? TMeta['ucMetas']['ucName']
  : never;

/** Извлекает метаданные конкретного use-case по имени */
export type ExtractUcMetaFromMeta<
  TMeta,
  N extends string,
> = TMeta extends AppMeta
  ? Extract<TMeta['moduleMetas']['ucMetas'], { ucName: N }>
  : TMeta extends ApiModuleMeta
  ? Extract<TMeta['ucMetas'], { ucName: N }>
  : never;

/**
 * Универсальный интерфейс выполнения команд.
 * Реализуется как ApiApp (для вызовов уровня приложения),
 * так и ApiModule (для вызовов внутри модуля).
 */
export interface ApiExecutor<TMeta> {
  execute<N extends GetUcNamesFromMeta<TMeta>>(
    ucName: N,
    attrs: ExtractUcMetaFromMeta<TMeta, N>['input'],
    actorId?: string,
  ): Promise<ExtractUcMetaFromMeta<TMeta, N>['output']>;
}
