// Domain слой @u7/course

// Агрегат Course
export { CourseAr } from "./course/a-root";
export type {
	CreateCourseCmd,
	CreateCourseCmdError,
	CreateCourseCmdMeta,
} from "./course/commands/create-course-cmd";
export { CreateCourseCmdSchema } from "./course/commands/create-course-cmd";
export type {
	CourseAccessDeniedUcError,
	CourseModuleError,
	CourseNotFoundUcError,
} from "./course/commands/errors";
export type {
	GetCourseCmd,
	GetCourseCmdError,
	GetCourseCmdMeta,
} from "./course/commands/get-course-cmd";
export { GetCourseCmdSchema } from "./course/commands/get-course-cmd";
export type {
	ListCoursesCmd,
	ListCoursesCmdMeta,
} from "./course/commands/list-courses-cmd";
export { ListCoursesCmdSchema } from "./course/commands/list-courses-cmd";
export type {
	Course,
	CourseArMeta,
	CourseModules,
	CourseProjects,
	Module,
	Project,
} from "./course/entity";
export {
	CourseCommonSchema,
	CourseSchema,
	ModuleSchema,
	ProjectSchema,
} from "./course/entity";
export { CoursePolicy } from "./course/policy";
export type { CourseListFilter, CourseRepo } from "./course/repo";
export type { CourseId as CourseEntityId, CourseKind } from "./course/types";
export type { UserFacade } from "./facade";
// Агрегат FileMetadata
export { FileMetadataAr } from "./file-metadata/a-root";
export type {
	CreateFileMetadataCmd,
	CreateFileMetadataCmdError,
	CreateFileMetadataCmdMeta,
} from "./file-metadata/commands/create-file-metadata-cmd";
export { CreateFileMetadataCmdSchema } from "./file-metadata/commands/create-file-metadata-cmd";
export type {
	FileMetadataAccessDeniedUcError,
	FileMetadataModuleError,
	FileMetadataNotFoundUcError,
} from "./file-metadata/commands/errors";
export type {
	GetFileMetadataCmd,
	GetFileMetadataCmdError,
	GetFileMetadataCmdMeta,
} from "./file-metadata/commands/get-file-metadata-cmd";
export { GetFileMetadataCmdSchema } from "./file-metadata/commands/get-file-metadata-cmd";
export type { FileMetadata, FileMetadataArMeta } from "./file-metadata/entity";
export { FileMetadataSchema } from "./file-metadata/entity";
export { FileMetadataPolicy } from "./file-metadata/policy";
export type { FileMetadataRepo } from "./file-metadata/repo";
// Агрегат Lesson
export { LessonAr } from "./lesson/a-root";
export type {
	CreateLessonCmd,
	CreateLessonCmdError,
	CreateLessonCmdMeta,
} from "./lesson/commands/create-lesson-cmd";
export { CreateLessonCmdSchema } from "./lesson/commands/create-lesson-cmd";
export type {
	LessonAccessDeniedUcError,
	LessonModuleError,
	LessonNotFoundUcError,
} from "./lesson/commands/errors";
export type {
	GetLessonCmd,
	GetLessonCmdError,
	GetLessonCmdMeta,
} from "./lesson/commands/get-lesson-cmd";
export { GetLessonCmdSchema } from "./lesson/commands/get-lesson-cmd";
export type { Lesson, LessonArMeta } from "./lesson/entity";
export { LessonSchema } from "./lesson/entity";
export { LessonPolicy } from "./lesson/policy";
export type { LessonRepo } from "./lesson/repo";
export type { CourseApiModuleResolver, CourseModuleMeta } from "./module";
// Общие типы
export { Status, StatusSchema } from "./status";
// Агрегат Step
export { StepAr } from "./step/a-root";
export type {
	CreateStepCmd,
	CreateStepCmdError,
	CreateStepCmdMeta,
} from "./step/commands/create-step-cmd";
export { CreateStepCmdSchema } from "./step/commands/create-step-cmd";
export type {
	StepAccessDeniedUcError,
	StepModuleError,
	StepNotFoundUcError,
} from "./step/commands/errors";
export type {
	GetStepCmd,
	GetStepCmdError,
	GetStepCmdMeta,
} from "./step/commands/get-step-cmd";
export { GetStepCmdSchema } from "./step/commands/get-step-cmd";
export type {
	Step,
	StepArMeta,
	StepCode,
	StepFile,
	StepText,
} from "./step/entity";
export { StepCommonSchema, StepSchema } from "./step/entity";
export { StepPolicy } from "./step/policy";
export type { StepRepo } from "./step/repo";
export type {
	CourseId,
	FileMetadataId,
	LessonId,
	Order,
	StepId,
} from "./types";
