/** Системные callback-коды приложения (перехватываются U7BotUiApp до маршрутизации). */
export const APP_CODES = {
  mainMenu: 'app:main-menu',
  help: 'app:help',
} as const;

/** Виртуальные якоря диалогов (сущностных стори нет — якорь для seq/штампов). */
export const APP_DIALOG_PATHS = {
  menu: 'app/menu',
  invite: 'app/invite',
} as const;

/** Префикс системных кодов — транспорт не сжимает их в shortId. */
export const APP_CODE_PREFIX = 'app:';
