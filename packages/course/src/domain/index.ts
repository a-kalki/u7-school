// Domain слой @u7-scl/course

// Агрегат Module
export { ModuleAr } from './module/a-root';
export type {
  AddProjectCmd,
  AddProjectCmdError,
  AddProjectCmdMeta,
} from './module/commands/add-project-cmd';
export { AddProjectCmdSchema } from './module/commands/add-project-cmd';
export type {
  CreateModuleCmd,
  CreateModuleCmdError,
  CreateModuleCmdMeta,
} from './module/commands/create-module-cmd';
export { CreateModuleCmdSchema } from './module/commands/create-module-cmd';
export type {
  EnrichModuleCmd,
  EnrichModuleCmdError,
  EnrichModuleCmdMeta,
} from './module/commands/enrich-module-cmd';
export { EnrichModuleCmdSchema } from './module/commands/enrich-module-cmd';
export type {
  ModuleAccessDeniedUcError,
  CourseModuleError,
  ModuleNotFoundUcError,
} from './module/commands/errors';
export type {
  GetModuleCmd,
  GetModuleCmdError,
  GetModuleCmdMeta,
} from './module/commands/get-module-cmd';
export { GetModuleCmdSchema } from './module/commands/get-module-cmd';
export type {
  ListModulesCmd,
  ListModulesCmdMeta,
} from './module/commands/list-modules-cmd';
export { ListModulesCmdSchema } from './module/commands/list-modules-cmd';
export type {
  PublishModuleCmd,
  PublishModuleCmdError,
  PublishModuleCmdMeta,
} from './module/commands/publish-module-cmd';
export { PublishModuleCmdSchema } from './module/commands/publish-module-cmd';
export type {
  Module,
  ModuleArMeta,
  Project,
} from './module/entity';
export {
  ModuleSchema,
  ProjectSchema,
} from './module/entity';
export { ModulePolicy } from './module/policy';
export type { ModuleListFilter, ModuleRepo } from './module/repo';
export type { ModuleId as ModuleEntityId } from './module/types';

// Агрегат Lesson
export { LessonAr } from './lesson/a-root';
export type {
  CreateLessonCmd,
  CreateLessonCmdError,
  CreateLessonCmdMeta,
} from './lesson/commands/create-lesson-cmd';
export { CreateLessonCmdSchema } from './lesson/commands/create-lesson-cmd';
export type {
  LessonAccessDeniedUcError,
  LessonModuleError,
  LessonNotFoundUcError,
} from './lesson/commands/errors';
export type {
  GetLessonCmd,
  GetLessonCmdError,
  GetLessonCmdMeta,
} from './lesson/commands/get-lesson-cmd';
export { GetLessonCmdSchema } from './lesson/commands/get-lesson-cmd';
export type { Lesson, LessonArMeta } from './lesson/entity';
export { LessonSchema } from './lesson/entity';
export { LessonPolicy } from './lesson/policy';
export type { LessonRepo } from './lesson/repo';

export type { CourseApiModuleMeta, CourseApiModuleResolver } from './module';

// Общие типы
export { Status, StatusSchema } from './status';

// Агрегат Step
export { StepAr } from './step/a-root';
export type {
  CreateStepCmd,
  CreateStepCmdError,
  CreateStepCmdMeta,
} from './step/commands/create-step-cmd';
export { CreateStepCmdSchema } from './step/commands/create-step-cmd';
export type {
  StepAccessDeniedUcError,
  StepModuleError,
  StepNotFoundUcError,
} from './step/commands/errors';
export type {
  GetStepCmd,
  GetStepCmdError,
  GetStepCmdMeta,
} from './step/commands/get-step-cmd';
export { GetStepCmdSchema } from './step/commands/get-step-cmd';
export type {
  Step,
  StepArMeta,
  StepCode,
  StepFile,
  StepText,
} from './step/entity';
export { StepCommonSchema, StepSchema } from './step/entity';
export { StepPolicy } from './step/policy';
export type { StepRepo } from './step/repo';

export type {
  ModuleId,
  LessonId,
  StepId,
} from './types';
