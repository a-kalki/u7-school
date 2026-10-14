import type { User } from '@u7-scl/app';
import type { School, U7ApiApp, U7AppResolver } from '@u7-scl/app/domain';
import type { AppMeta } from '@u7-scl/core/domain';
import type { BotUiAppResolve } from '@u7-scl/core/ui';
import type { CourseApiModuleMeta } from '@u7-scl/course/domain';
import type { PeerReviewApiModuleMeta } from '@u7-scl/peer-review/domain';
import type { QuestionnaireApiModuleMeta } from '@u7-scl/questionnaire/domain';
import type { StreamApiModuleMeta } from '@u7-scl/stream';
import type { UserApiModuleMeta, UserFacade } from '@u7-scl/user/domain';
import type { WishApiModuleMeta } from '@u7-scl/wish/domain';
//
// ================= UI layer ===================

/**
 * Зависимости UI-слоя u7-бота: базовый резолв ядра + идемпотентная
 * гост-регистрация на /start (от имени системного актора-бота).
 */
export interface U7BotUiAppResolve extends BotUiAppResolve<U7BotAppMeta, User> {
  /** фасад пользователей — идемпотентная гост-регистрация на /start */
  userFacade: UserFacade;
  /** системный актор-бот (BOT_ADMIN_UUID, резолвится при старте) — регистрация гостя от его имени */
  botAdminUser: User;
  /** сущность школы (FR-4) */
  school: School;
  /** telegramId администраторов для админ-команд (/log_level и др.) (FR-4) */
  adminTelegramIds?: number[];
}

// ================= API layer ===================
/**
 * Метаданные API-приложения U7 Bot.
 */
export interface U7BotAppMeta extends AppMeta {
  name: 'u7-bot-app';
  moduleMetas:
    | UserApiModuleMeta
    | WishApiModuleMeta
    | StreamApiModuleMeta
    | CourseApiModuleMeta
    | QuestionnaireApiModuleMeta
    | PeerReviewApiModuleMeta;
}

/** Тип API-приложения U7 бота (актор закрыт на User в модуле app) */
export type U7BotApp = U7ApiApp<U7BotAppMeta>;

export type { U7AppResolver };
