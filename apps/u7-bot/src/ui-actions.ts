/**
 * Реэкспорт инфраструктурных типов UiRegistry из core.
 *
 * Сами типы и createUiRegistry живут в @u7-scl/core/ui/ui-registry.
 * Этот файл оставлен для обратной совместимости импортов внутри apps/u7-bot.
 */
export {
  type ControllerActions,
  createUiRegistry,
  type HasPublicActions,
  type StoryPublicActions,
  type UiCallbackFactory,
  type UiRegistry,
} from '@u7-scl/core/ui';
