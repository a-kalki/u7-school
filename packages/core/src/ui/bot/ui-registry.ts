/**
 * Типы и утилиты для типизированных кросс-ссылок между UserStory.
 *
 * Каждая стори объявляет `publicActions` — объект методов-фабрик готовых кнопок.
 * Контроллер собирает их через `get publicActions()`.
 * `UiApp` объединяет в `UiRegistry` и инжектит в стори через `initUi()`.
 *
 * Кросс-ссылки: вызов `this.ui.controllerName.storyName.action(id)` возвращает
 * готовую кнопку `UiBotButton`, которую можно положить в клавиатуру.
 */

/** Готовая кнопка для клавиатуры — результат фабрики публичного действия */
export interface UiBotButton {
  /** Текст на кнопке */
  text: string;
  /** Callback-код (можно переопределить text после получения) */
  code: string;
}

/** Фабрика кнопки: принимает id и возвращает готовый UiBotButton */
export type UiCallbackFactory = (...ids: string[]) => UiBotButton;

/** Публичные действия одной стори: { actionName: (...ids) => UiBotButton } */
export type StoryPublicActions = Record<string, UiCallbackFactory>;

/**
 * Извлекает тип публичных действий из контроллера.
 *
 * @example
 * const streamCtrl = new StreamController(...);
 * type StreamActions = ControllerActions<typeof streamCtrl>;
 * // { catalog: { view: (id: string) => UiBotButton, ... }, learning: { ... }, ... }
 */
export type ControllerActions<C extends { publicActions: unknown }> =
  C['publicActions'];

/**
 * Реестр UI-действий всех контроллеров.
 *
 * Структура: { controllerName: { storyName: { actionName: factory } } }
 *
 * @example
 * const btn = this.ui.stream.catalog.view(streamId); // UiBotButton
 * rows.push([{ text: btn.text, code: btn.code }]);
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
