// Domain слой @u7-scl/course

export type { ContentSnapshot, ContentSnapshotItem } from './content-snapshot';
export {
  ContentSnapshotItemSchema,
  ContentSnapshotSchema,
  LessonSnapshotSchema,
} from './content-snapshot';
// Агрегат Course
export { CourseAr } from './course/a-root';
export type {
  AddModuleToCourseCmd,
  AddModuleToCourseCmdMeta,
} from './course/commands/add-module-to-course-cmd';
export { AddModuleToCourseCmdSchema } from './course/commands/add-module-to-course-cmd';
export type {
  AddPhaseToCourseCmd,
  AddPhaseToCourseCmdMeta,
} from './course/commands/add-phase-to-course-cmd';
export { AddPhaseToCourseCmdSchema } from './course/commands/add-phase-to-course-cmd';
export type {
  CreateCourseCmd,
  CreateCourseCmdMeta,
} from './course/commands/create-course-cmd';
export { CreateCourseCmdSchema } from './course/commands/create-course-cmd';
export type {
  CourseAccessDeniedUcError,
  CourseNotFoundUcError,
} from './course/commands/errors';
export type {
  GetCourseCmd,
  GetCourseCmdMeta,
} from './course/commands/get-course-cmd';
export { GetCourseCmdSchema } from './course/commands/get-course-cmd';
export type {
  ListCoursesCmd,
  ListCoursesCmdMeta,
} from './course/commands/list-courses-cmd';
export { ListCoursesCmdSchema } from './course/commands/list-courses-cmd';
export type { Course, CourseArMeta, Phase } from './course/entity';
export { CourseSchema, PhaseSchema } from './course/entity';
export { CoursePolicy } from './course/policy';
export type { CourseListFilter, CourseRepo } from './course/repo';
export type { CourseFacade, CourseProgram } from './facade';
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
  CourseModuleError,
  ModuleAccessDeniedUcError,
  ModuleNotFoundUcError,
} from './module/commands/errors';
export type {
  GetModuleCmd,
  GetModuleCmdError,
  GetModuleCmdMeta,
} from './module/commands/get-module-cmd';
export { GetModuleCmdSchema } from './module/commands/get-module-cmd';
export type {
  GetModuleSnapshotCmd,
  GetModuleSnapshotCmdError,
  GetModuleSnapshotCmdMeta,
} from './module/commands/get-module-snapshot-cmd';
export { GetModuleSnapshotCmdSchema } from './module/commands/get-module-snapshot-cmd';
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
  CourseId,
  LessonId,
  ModuleId,
  StepId,
} from './types';
