/**
 * Реэкспорт инфраструктурных типов UiRegistry из core.
 *
 * Сами типы и createUiRegistry жили в @u7-scl/core/ui/ui-registry,
 * но ui-registry удалён. PublicActions теперь управляются через UiApp.
 *
 * Этот файл оставлен для обратной совместимости импортов внутри apps/u7-bot.
 */
export type {
  StoryPublicActions,
  UiCallbackFactory,
} from '@u7-scl/core/ui';
