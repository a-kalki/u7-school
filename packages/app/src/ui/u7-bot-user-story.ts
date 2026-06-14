import { BotUserStory } from '@u7-scl/core/ui';
import type { ApiModuleMeta } from '@u7-scl/core/domain';
import type { U7BotAppMeta, User } from '../domain';

/**
 * Специализированный пользовательский сценарий для U7 Telegram-бота.
 *
 * Закрывает дженерики `U7BotAppMeta` и `User`, оставляя
 * открытым только `TMeta` — метаданные модуля, к которому
 * принадлежит сценарий.
 *
 * Здесь в будущем будет инкапсулирована общая логика
 * всех сценариев U7-бота:
 * - форматирование сообщений в стиле U7
 * - общие клавиатуры и кнопки
 * - трекинг действий
 * - и т.д.
 *
 * @typeParam TMeta — метаданные API-модуля
 */
export abstract class U7BotUserStory<
  TMeta extends ApiModuleMeta,
> extends BotUserStory<U7BotAppMeta, User> {
  // Будет расширен в Фазе 2 (добавление moduleApi и apiApp)
  // Пока наследует поведение BotUserStory без изменений
}
