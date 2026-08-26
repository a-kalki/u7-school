// Domain слой @u7-scl/wish

export type { WishApiModuleMeta, WishApiModuleResolver } from './module';
export { WishAr } from './wish/a-root';
export type {
  CancelWishCmd,
  CancelWishCmdMeta,
} from './wish/commands/cancel-wish-cmd';
export { CancelWishCmdSchema } from './wish/commands/cancel-wish-cmd';
export type {
  ExpressWishCmd,
  ExpressWishCmdMeta,
  ExpressWishOutput,
} from './wish/commands/express-wish-cmd';
export {
  ExpressWishCmdSchema,
  ExpressWishOutputSchema,
} from './wish/commands/express-wish-cmd';
export type {
  Wish,
  WishArMeta,
  WishStatus,
  WishTarget,
} from './wish/entity';
export {
  WishSchema,
  WishStatusSchema,
  WishTargetSchema,
} from './wish/entity';
export type {
  CourseNotFoundUcError,
  WishAlreadyExistsUcError,
  WishModuleError,
  WishNotFoundUcError,
} from './wish/errors';
export type { WishRepo } from './wish/repo';
export {
  hasQuestionnaire,
  registerQuestionnaireCourse,
  wishQuestionnairePool,
} from './wish/wish-questionnaire';
