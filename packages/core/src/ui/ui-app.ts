import type { EventBus } from '#domain/events/event-bus';
import type { UiEventSubscription } from './event-subscription';
import type { UiController } from './ui-controller';

/**
 * Канально-независимый UiApp — общий хаб UI-слоя.
 *
 * Владеет реестром контроллеров и централизованно подписывает их подписки
 * на доменные события на шине EventBus. Не знает ни про Telegram, ни про
 * транспорт, ни про доставку наружу.
 *
 * @typeParam TController — тип контроллера (по умолчанию UiController)
 */
export class UiApp<TController extends UiController = UiController> {
  protected readonly controllers = new Map<string, TController>();

  private readonly unsubscribers: Array<() => void> = [];
  private subscribed = false;

  constructor(controllers: TController[]) {
    for (const controller of controllers) {
      if (this.controllers.has(controller.name)) {
        throw new Error(`Дубликат имени контроллера: ${controller.name}`);
      }
      this.controllers.set(controller.name, controller);
    }
  }

  /** Возвращает контроллер по имени */
  getController(name: string): TController | undefined {
    return this.controllers.get(name);
  }

  /** Количество зарегистрированных контроллеров */
  get size(): number {
    return this.controllers.size;
  }

  /** Подписки всех контроллеров */
  getEventSubscriptions(): UiEventSubscription[] {
    return [...this.controllers.values()].flatMap((controller) =>
      controller.getEventSubscriptions(),
    );
  }

  /**
   * Подписывает все подписки контроллеров на шину событий.
   * Повторный вызов не дублирует обработчики.
   */
  subscribeEvents(eventBus: EventBus): void {
    if (this.subscribed) return;
    for (const subscription of this.getEventSubscriptions()) {
      const unsubscribe = eventBus.subscribe(
        subscription.eventName,
        subscription.handle,
      );
      this.unsubscribers.push(unsubscribe);
    }
    this.subscribed = true;
  }

  /** Отписывает все подписки от шины событий. */
  unsubscribeAll(): void {
    const unsubscribers = this.unsubscribers.splice(0);
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
    this.subscribed = false;
  }
}
