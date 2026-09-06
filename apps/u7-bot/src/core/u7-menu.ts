/**
 * Декларативная кнопка главного меню (ФР-4, решения 2026-09-06):
 * данные (кнопка, описание, приоритет), не обработчик. Сбор —
 * `menuButtons(actor)` у стори/контроллеров, экран — uiApp.
 */
export type CbMenuButton = {
  kind: 'callback';
  text: string;
  /** Код `story:action[:id...]` — контроллер префиксует своим именем */
  action: string;
  priority: number;
  /** Описание для /help (если нет — пункт не включается в помощь) */
  description?: string;
};

export type UrlMenuButton = {
  kind: 'url';
  text: string;
  url: string;
  priority: number;
  /** Описание для /help */
  description?: string;
};

/** Кнопка главного меню бота */
export type MenuButton = CbMenuButton | UrlMenuButton;
