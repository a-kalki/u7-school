/** Готовая кнопка для клавиатуры — результат фабрики публичного действия */
export interface UiBotButton {
  text: string;
  code: string;
}

/** Фабрика кнопки: принимает id и возвращает готовый UiBotButton */
export type UiCallbackFactory = (...ids: string[]) => UiBotButton;

/** Публичные действия одной стори: { actionName: (...ids) => UiBotButton } */
export type StoryPublicActions = Record<string, UiCallbackFactory>;
