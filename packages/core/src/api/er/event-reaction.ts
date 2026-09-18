import type { DomainEvent } from '#domain/events/domain-event';
import type { ModuleResolver } from '#domain/types';

/**
 * Контракт реакции на доменное событие.
 */
export interface ErMeta<TEvent extends DomainEvent = DomainEvent> {
  erName: string;
  event: TEvent;
}

/** Метаданные реакции для документации. */
export interface ErDocType {
  erName: ErMeta['erName'];
  erLabel: string;
  /** Имена всех событий, на которые подписана реакция. */
  eventNames: string[];
}

/**
 * Реакция на доменное событие (ER).
 *
 * @typeParam TMeta — метаданные реакции (связывают ER с типом события)
 * @typeParam TResolve — резолвер зависимостей (расширяет ModuleResolver)
 */
export abstract class EventReaction<
  TMeta extends ErMeta,
  TResolve extends ModuleResolver = ModuleResolver,
> {
  /**
   * Имена всех событий, на которые реакция подписывается.
   * Мультисобытийная подписка: `ErMeta` объявляется по точному юниону
   * событий (`ErMeta<A | B>`), тогда тип здесь — юнион имён,
   * а `handle(event: A | B)` сохраняет типизацию без деградации
   * до `DomainEvent`. Разбор внутри `handle` — сужением по
   * дискриминанту `eventName` с exhaustive-веткой.
   */
  protected abstract readonly eventNames: readonly TMeta['event']['eventName'][];

  protected abstract readonly erName: TMeta['erName'];

  /** Человекочитаемая метка (для документации) */
  protected abstract readonly erLabel: string;

  protected resolve!: TResolve;

  init(resolve: TResolve): void {
    this.resolve = resolve;
  }

  getErName(): TMeta['erName'] {
    return this.erName;
  }

  /** Имена всех событий подписки (для авто-подписки модуля). */
  getEventNames(): readonly TMeta['event']['eventName'][] {
    return this.eventNames;
  }

  /**
   * Обработчик события. Выполняет side-effect реакции.
   */
  abstract handle(event: TMeta['event']): Promise<void>;

  /**
   * Возвращает метаданные реакции для документации.
   */
  getDocType(): ErDocType {
    return {
      erName: this.erName,
      erLabel: this.erLabel,
      eventNames: [...this.eventNames],
    };
  }
}
