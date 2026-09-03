// Domain слой @u7-scl/wish

export type { WishApiModuleMeta, WishApiModuleResolver } from './module';
export { WishAr } from './wish/a-root';
export type {
  CancelWishCmd,
  CancelWishCmdMeta,
} from './wish/commands/cancel-wish-cmd';
export { CancelWishCmdSchema } from './wish/commands/cancel-wish-cmd';
export type {
  CreateCourseWishCmd,
  CreateCourseWishCmdError,
  CreateCourseWishCmdMeta,
  CreateCourseWishOutput,
} from './wish/commands/create-course-wish-cmd';
export {
  CreateCourseWishCmdSchema,
  CreateCourseWishOutputSchema,
} from './wish/commands/create-course-wish-cmd';
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
export { WishPolicy } from './wish/policy';
export { findCoursePool } from './wish/pools/course-pool';
export type { WishRepo } from './wish/repo';
