import { BotController } from '@u7-scl/core/ui';
import type { ApiModuleMeta } from '@u7-scl/core/domain';
import type { U7BotAppMeta, User } from '../domain';

/**
 * Специализированный контроллер для U7 Telegram-бота.
 *
 * Закрывает дженерики `U7BotAppMeta` и `User`, оставляя
 * открытым только `TMeta` — метаданные конкретного модуля.
 *
 * Здесь в будущем будет инкапсулирована общая логика
 * всех контроллеров U7-бота:
 * - сквозная обработка ошибок
 * - локализация кнопок
 * - аналитика действий пользователя
 * - и т.д.
 *
 * @typeParam TMeta — метаданные API-модуля, к которому привязан контроллер
 */
export abstract class U7BotController<
  TMeta extends ApiModuleMeta,
> extends BotController<U7BotAppMeta, User> {
  // Конструктор будет расширен в Фазе 2 (добавление moduleApi)
  // Пока наследует поведение BotController без изменений
}
