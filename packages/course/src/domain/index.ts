// Domain слой @u7/course
export type { CourseApiModuleResolver, CourseModuleMeta } from "./module";

// Общие типы
export { Status, StatusSchema } from "./status";
export type { CourseId, LessonId, StepId, FileMetadataId, Order } from "./types";
export type { UserFacade } from "./facade";

// Агрегат Course
export { CourseAr } from "./course/a-root";
export type { CreateCourseCmd, CreateCourseCmdError, CreateCourseCmdMeta } from "./course/commands/create-course-cmd";
export { CreateCourseCmdSchema } from "./course/commands/create-course-cmd";
export type { GetCourseCmd, GetCourseCmdError, GetCourseCmdMeta } from "./course/commands/get-course-cmd";
export { GetCourseCmdSchema } from "./course/commands/get-course-cmd";
export type { ListCoursesCmd, ListCoursesCmdMeta } from "./course/commands/list-courses-cmd";
export { ListCoursesCmdSchema } from "./course/commands/list-courses-cmd";
export type { CourseAccessDeniedUcError, CourseModuleError, CourseNotFoundUcError } from "./course/commands/errors";
export type { Course, CourseArMeta, CourseModules, CourseProjects } from "./course/entity";
export { CourseSchema, ModuleSchema, ProjectSchema } from "./course/entity";
export type { Module, Project } from "./course/entity";
export { CoursePolicy } from "./course/policy";
export type { CourseRepo, CourseListFilter } from "./course/repo";
export type { CourseId as CourseEntityId, CourseKind } from "./course/types";

// Агрегат Lesson
export { LessonAr } from "./lesson/a-root";
export type { CreateLessonCmd, CreateLessonCmdError, CreateLessonCmdMeta } from "./lesson/commands/create-lesson-cmd";
export { CreateLessonCmdSchema } from "./lesson/commands/create-lesson-cmd";
export type { GetLessonCmd, GetLessonCmdError, GetLessonCmdMeta } from "./lesson/commands/get-lesson-cmd";
export { GetLessonCmdSchema } from "./lesson/commands/get-lesson-cmd";
export type { LessonAccessDeniedUcError, LessonModuleError, LessonNotFoundUcError } from "./lesson/commands/errors";
export type { Lesson, LessonArMeta } from "./lesson/entity";
export { LessonSchema } from "./lesson/entity";
export { LessonPolicy } from "./lesson/policy";
export type { LessonRepo } from "./lesson/repo";

// Агрегат Step
export { StepAr } from "./step/a-root";
export type { CreateStepCmd, CreateStepCmdError, CreateStepCmdMeta } from "./step/commands/create-step-cmd";
export { CreateStepCmdSchema } from "./step/commands/create-step-cmd";
export type { GetStepCmd, GetStepCmdError, GetStepCmdMeta } from "./step/commands/get-step-cmd";
export { GetStepCmdSchema } from "./step/commands/get-step-cmd";
export type { StepAccessDeniedUcError, StepModuleError, StepNotFoundUcError } from "./step/commands/errors";
export type { Step, StepArMeta, StepText, StepCode, StepFile } from "./step/entity";
export { StepSchema } from "./step/entity";
export { StepPolicy } from "./step/policy";
export type { StepRepo } from "./step/repo";

// Агрегат FileMetadata
export { FileMetadataAr } from "./file-metadata/a-root";
export type { CreateFileMetadataCmd, CreateFileMetadataCmdError, CreateFileMetadataCmdMeta } from "./file-metadata/commands/create-file-metadata-cmd";
export { CreateFileMetadataCmdSchema } from "./file-metadata/commands/create-file-metadata-cmd";
export type { GetFileMetadataCmd, GetFileMetadataCmdError, GetFileMetadataCmdMeta } from "./file-metadata/commands/get-file-metadata-cmd";
export { GetFileMetadataCmdSchema } from "./file-metadata/commands/get-file-metadata-cmd";
export type { FileMetadataAccessDeniedUcError, FileMetadataModuleError, FileMetadataNotFoundUcError } from "./file-metadata/commands/errors";
export type { FileMetadata, FileMetadataArMeta } from "./file-metadata/entity";
export { FileMetadataSchema } from "./file-metadata/entity";
export { FileMetadataPolicy } from "./file-metadata/policy";
export type { FileMetadataRepo } from "./file-metadata/repo";
