import type { DomainEvent } from '#domain/events/domain-event';
import type { ModuleResolver } from '#domain/types';

/**
 * Контракт реакции на доменное событие.
 *
 * В отличие от {@link UcMeta}, минимальный: без type/requiresAuth/input/output/errors/arMeta.
 * Имя события не хранится отдельно — оно выводится из `TEvent['eventName']`,
 * поэтому переименование события ломает несоответствующие реакции на уровне типов.
 */
export interface ErMeta<TEvent extends DomainEvent = DomainEvent> {
  /** Уникальное имя реакции (например "record-wish") */
  erName: string;
  /** Тип события, на которое реагирует ER. Имя события захвачено как TEvent['eventName']. */
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
 * Декларативный аналог {@link UseCase}: модуль объявляет реакции в поле `reactions`,
 * а {@link ApiModule} автоматически подписывает их на события при инициализации.
 * «Вход» — само событие; выхода нет: реакция выполняет side-effect
 * (запись в repo, вызов фасада и т.п.). Ошибки наружу не бросаются.
 *
 * @typeParam TMeta — метаданные реакции (связывают ER с типом события)
 * @typeParam TResolve — резолвер зависимостей (расширяет ModuleResolver)
 */
export abstract class EventReaction<
  TMeta extends ErMeta,
  TResolve extends ModuleResolver = ModuleResolver,
> {
  /** Уникальное имя реакции */
  protected abstract readonly erName: TMeta['erName'];

  /** Человекочитаемая метка (для документации) */
  protected abstract readonly erLabel: string;

  /** Имя события — связано с типом через TMeta['event']['eventName'] */
  protected abstract readonly eventName: TMeta['event']['eventName'];

  protected resolve!: TResolve;

  /**
   * Инициализирует реакцию резолвером.
   * Вызывается модулем при авто-подписке.
   */
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
