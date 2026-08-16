import type { UiEventSubscription } from './event-subscription';
import type { UiAppResolve } from './types';
import type { UiController } from './ui-controller';

/**
 * Канально-независимый UiApp — общий хаб UI-слоя.
 *
 * Владеет реестром контроллеров и централизованно подписывает их подписки
 * на доменные события на шине EventBus. Не знает ни про Telegram, ни про
 * транспорт, ни про доставку наружу.
 *
 * @typeParam TActor — тип актора (пользователя) приложения
 * @typeParam TResolve — зависимости приложения (расширяет UiAppResolve)
 */
export class UiApp<
  TActor = unknown,
  TResolve extends UiAppResolve<TActor> = UiAppResolve<TActor>,
> {
  protected readonly controllers = new Map<string, UiController<TResolve>>();

  private readonly unsubscribers: Array<() => void> = [];
  private subscribed = false;
  private resolve: TResolve | null = null;

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
   * Завершает загрузку приложения.
   */
  init(resolve: TResolve): void {
    this.resolve = resolve;
    for (const controller of this.controllers.values()) {
      controller.init(resolve);
    }
  }

  /** Резолвит актора приложения по канальному идентификатору. */
  protected async resolveActor(tgId: number): Promise<TActor> {
    if (!this.resolve) {
      throw new Error('UiApp не инициализирован: resolve не задан');
    }
    return this.resolve.actorResolver(tgId);
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
   * Подписывает все подписки контроллеров на шину событий из resolve.
   * Требует предварительного вызова init(resolve).
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
