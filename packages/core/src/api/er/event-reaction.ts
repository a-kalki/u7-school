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
  eventName: string;
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
  protected abstract readonly eventName: TMeta['event']['eventName'];

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

  getEventName(): TMeta['event']['eventName'] {
    return this.eventName;
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
      eventName: this.eventName,
    };
  }
}
