import type { UiEventSubscription } from './event-subscription';
import type { UiAppResolve } from './types';
import type { UiController } from './ui-controller';

/**
 * UiApp — общий хаб UI-слоя.
 */
export class UiApp<TResolve extends UiAppResolve = UiAppResolve> {
  protected readonly controllers = new Map<string, UiController<TResolve>>();

  private readonly unsubscribers: Array<() => void> = [];
  private subscribed = false;
  protected resolve!: TResolve;

  constructor(controllers: UiController<TResolve>[]) {
    for (const controller of controllers) {
      if (this.controllers.has(controller.name)) {
        throw new Error(`Дубликат имени контроллера: ${controller.name}`);
      }
      this.controllers.set(controller.name, controller);
    }
  }

  /**
   * Каскадная инициализация: UiApp → контроллеры → стори.
   */
  init(resolve: TResolve): void {
    this.resolve = resolve;
    for (const controller of this.controllers.values()) {
      controller.init(resolve);
    }
  }

  /** Возвращает контроллер по имени */
  getController(name: string): UiController<TResolve> | undefined {
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
  subscribeEvents(): void {
    if (this.subscribed) return;
    if (!this.resolve) {
      throw new Error('UiApp не инициализирован: вызовите init(resolve)');
    }
    for (const subscription of this.getEventSubscriptions()) {
      const unsubscribe = this.resolve.eventBus.subscribe(
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
