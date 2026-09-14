import type { ApiApp, UcMeta } from '@u7-scl/core/api';
import { ApiModule, UseCase } from '@u7-scl/core/api';
import type {
  ApiExecutor,
  ApiModuleMeta,
  AppMeta,
  ModuleResolver,
} from '@u7-scl/core/domain';
import type { User } from './user';

// ══ Специализация core/api на акторе User ══
//
// Аналогично закрытию дженерика актора в UI-слое
// (BotUiApp<TAppMeta, TActor, TResolve> → приложение с конкретным User),
// здесь ядро API-слоя специализируется на каноническом User модуля app.
// Домены наследуют U7UseCase/U7ApiModule и не знают про дженерик актора.

/**
 * Базовый класс use-case домена u7-school: актор закрыт на User.
 * Объект User резолвится один раз на входе приложения и приходит
 * в execute(command, actor) готовым.
 */
export abstract class U7UseCase<
  TMeta extends UcMeta,
  TResolve extends ModuleResolver = ModuleResolver,
> extends UseCase<TMeta, TResolve, User> {}

/**
 * Базовый класс API-модуля домена u7-school: актор закрыт на User.
 */
export abstract class U7ApiModule<
  TMeta extends ApiModuleMeta,
  TResolve extends ModuleResolver,
> extends ApiModule<TMeta, TResolve, User> {}

/** Тип API-приложения u7-school: актор закрыт на User */
export type U7ApiApp<TMeta extends AppMeta> = ApiApp<TMeta, User>;

/** Исполнитель команд с актором User (для фасадов и прямых вызовов) */
export type U7ApiExecutor<TMeta> = ApiExecutor<TMeta, User>;
