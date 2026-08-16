export type CbMainMenuAction = {
  kind: 'callback';
  text: string;
  action: string;
  priority: number;
  /** Описание для /help (если нет — пункт не включается в помощь) */
  description?: string;
};

export type UrlMainMenuAction = {
  kind: 'url';
  text: string;
  url: string;
  priority: number;
  /** Описание для /help */
  description?: string;
};

/** Элемент главного меню бота */
export type MainMenuAction = CbMainMenuAction | UrlMainMenuAction;

/** Агрегатор пунктов меню от всех контроллеров. Реализуется U7BotUiApp. */
export interface MenuAggregator<TActor = unknown> {
  collectAllMenuItems(actor: TActor): Promise<MainMenuAction[]>;
  collectAllHelpDescriptions(actor: TActor): Promise<string[]>;
}
