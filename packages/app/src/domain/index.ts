// @u7-scl/app/domain — доменные типы уровня приложения

export type {
  U7ApiApp,
  U7ApiExecutor,
  U7AppResolver,
  U7ModuleResolver,
} from './api';
export { U7ApiModule, U7UseCase } from './api';
export type { School } from './school';
export {
  createSchool,
  SchoolSchema,
  TEST_SCHOOL,
  U7_SCHOOL_ID,
  U7_SCHOOL_STATIC,
} from './school';
export type { User, UserArMeta } from './user';
export { Role, RoleSchema, UserSchema } from './user';
