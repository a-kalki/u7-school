/**
 * Типы и утилиты для типизированных кросс-ссылок между UserStory.
 *
 * Каждая стори объявляет `publicActions` — объект методов-фабрик колбэков.
 * Контроллер собирает их через `get publicActions()`.
 * `BotRouter`/`UiApp` объединяет в `UiRegistry` и инжектит в стори через `initUi()`.
 *
 * Кросс-ссылки: `this.ui.controllerName.storyName.action(...)` вместо `this.cbFor()`.
 */

/** Фабрика колбэка: принимает id и возвращает callback-код */
export type UiCallbackFactory = (...ids: string[]) => string;

/** Публичные действия одной стори: { actionName: (...ids) => callbackCode } */
export type StoryPublicActions = Record<string, UiCallbackFactory>;

/**
 * Извлекает тип публичных действий из контроллера.
 *
 * @example
 * const streamCtrl = new StreamController(...);
 * type StreamActions = ControllerActions<typeof streamCtrl>;
 * // { catalog: { view: (id: string) => string, ... }, learning: { ... }, ... }
 */
export type ControllerActions<C extends { publicActions: unknown }> =
  C['publicActions'];

/**
 * Реестр UI-действий всех контроллеров.
 *
 * Структура: { controllerName: { storyName: { actionName: factory } } }
 *
 * @example
 * registry.stream.catalog.view(streamId) // → callback-код
 */
export type UiRegistry = Record<string, Record<string, StoryPublicActions>>;

/** Контроллер с минимальным контрактом для createUiRegistry */
export interface HasPublicActions {
  readonly name: string;
  readonly publicActions: Record<string, StoryPublicActions>;
}

/**
 * Создаёт UiRegistry из массива контроллеров.
 *
 * @param controllers — массив объектов с name и publicActions
 * @returns реестр: controllerName → storyName → actionName → factory
 */
export function createUiRegistry(controllers: HasPublicActions[]): UiRegistry {
  const registry: UiRegistry = {};
  for (const ctrl of controllers) {
    registry[ctrl.name] = ctrl.publicActions;
  }
  return registry;
}
