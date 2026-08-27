import type {
  ApiModuleMeta,
  AppResolver,
  ModuleResolver,
} from '@u7-scl/core/domain';
import type { CourseFacade } from '@u7-scl/course/domain';
import type { QuestionnaireFacade } from '@u7-scl/questionnaire/domain';
import type { UserFacade } from '@u7-scl/user/domain';
import type { CancelWishCmdMeta } from './wish/commands/cancel-wish-cmd';
import type { CreateCourseWishCmdMeta } from './wish/commands/create-course-wish-cmd';
import type { CreateModuleWishCmdMeta } from './wish/commands/create-module-wish-cmd';
import type { WishRepo } from './wish/repo';

export type WishUcMetas =
  | CreateCourseWishCmdMeta
  | CreateModuleWishCmdMeta
  | CancelWishCmdMeta;

/** Метаданные API-модуля wish. */
export interface WishApiModuleMeta extends ApiModuleMeta {
  name: 'wish';
  url: '/wish';
  ucMetas: WishUcMetas;
}

/** Резолвер зависимостей API-модуля wish. */
export interface WishApiModuleResolver extends ModuleResolver {
  wishRepo: WishRepo;
  courseFacade: CourseFacade;
  questionnaireFacade: QuestionnaireFacade;
  userFacade: UserFacade;
  appResolver: AppResolver;
}
