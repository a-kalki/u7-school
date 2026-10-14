import type { ApiApp, UcMeta } from '@u7-scl/core/api';
import { ApiModule, UseCase } from '@u7-scl/core/api';
import type {
  ApiExecutor,
  ApiModuleMeta,
  AppMeta,
  AppResolver,
  ModuleResolver,
} from '@u7-scl/core/domain';
import type { School } from './school';
import type { User } from './user';

// ══ Специализация core/api на уровне приложения u7-school ══
//
// 1. Актор закрыт на User: домены наследуют U7UseCase/U7ApiModule
//    и не знают про дженерик актора.
// 2. Резолвер закрыт на U7AppResolver (содержит School) через U7ModuleResolver.

/**
 * Глобальные зависимости уровня приложения u7-school.
 * Содержит сквозные сервисы и сущность школы.
 */
export interface U7AppResolver extends AppResolver {
  school: School;
}

/**
 * Базовый резолвер модуля u7-school.
 * Закрывает дженерик ModuleResolver на U7AppResolver.
 */
export interface U7ModuleResolver extends ModuleResolver<U7AppResolver> {}

/**
 * Базовый класс use-case домена u7-school: актор закрыт на User,
 * резолвер по умолчанию закрыт на U7ModuleResolver.
 */
export abstract class U7UseCase<
  TMeta extends UcMeta,
  TResolve extends U7ModuleResolver = U7ModuleResolver,
> extends UseCase<TMeta, TResolve, User> {}

/**
 * Базовый класс API-модуля домена u7-school: актор закрыт на User,
 * резолвер по умолчанию закрыт на U7ModuleResolver.
 */
export abstract class U7ApiModule<
  TMeta extends ApiModuleMeta,
  TResolve extends U7ModuleResolver = U7ModuleResolver,
> extends ApiModule<TMeta, TResolve, User> {}

/** Тип API-приложения u7-school: актор закрыт на User */
export type U7ApiApp<TMeta extends AppMeta> = ApiApp<TMeta, User>;

/** Исполнитель команд с актором User (для фасадов и прямых вызовов) */
export type U7ApiExecutor<TMeta> = ApiExecutor<TMeta, User>;
