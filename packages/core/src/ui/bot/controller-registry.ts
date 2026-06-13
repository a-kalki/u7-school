import type { BotController } from './controller/bot-controller';

/**
 * Реестр контроллеров бота.
 * Обеспечивает уникальность имён контроллеров и быстрый поиск.
 */
export class ControllerRegistry {
  private readonly controllers = new Map<string, BotController>();

  /**
   * Регистрирует контроллер.
   * @throws если контроллер с таким именем уже зарегистрирован
   */
  register(controller: BotController): void {
    if (this.controllers.has(controller.name)) {
      throw new Error(
        `Контроллер с именем '${controller.name}' уже зарегистрирован`,
      );
    }
    this.controllers.set(controller.name, controller);
  }

  /** Возвращает контроллер по имени или undefined */
  get(name: string): BotController | undefined {
    return this.controllers.get(name);
  }

  /** Возвращает все зарегистрированные контроллеры */
  getAll(): BotController[] {
    return [...this.controllers.values()];
  }
}
