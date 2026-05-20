import type { ApiModuleMeta } from '@u7-scl/core/domain';
import type { BaseJsonDb } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import type { AddModuleCmdMeta } from './course/commands/add-module-cmd';
import type { AddProjectCmdMeta } from './course/commands/add-project-cmd';
import type { AddProjectToModuleCmdMeta } from './course/commands/add-project-to-module-cmd';
import type { CreateCourseCmdMeta } from './course/commands/create-course-cmd';
import type { EnrichCourseCmdMeta } from './course/commands/enrich-course-cmd';
import type { GetCourseCmdMeta } from './course/commands/get-course-cmd';
import type { ListCoursesCmdMeta } from './course/commands/list-courses-cmd';
import type { PublishCourseCmdMeta } from './course/commands/publish-course-cmd';
import type { CourseRepo } from './course/repo';
import type { CreateLessonCmdMeta } from './lesson/commands/create-lesson-cmd';
import type { GetLessonCmdMeta } from './lesson/commands/get-lesson-cmd';
import type { LessonRepo } from './lesson/repo';
import type { CreateStepCmdMeta } from './step/commands/create-step-cmd';
import type { GetStepCmdMeta } from './step/commands/get-step-cmd';
import type { StepRepo } from './step/repo';

export type CourseUcMetas =
  | AddModuleCmdMeta
  | AddProjectCmdMeta
  | AddProjectToModuleCmdMeta
  | CreateCourseCmdMeta
  | EnrichCourseCmdMeta
  | GetCourseCmdMeta
  | ListCoursesCmdMeta
  | PublishCourseCmdMeta
  | CreateLessonCmdMeta
  | GetLessonCmdMeta
  | CreateStepCmdMeta
  | GetStepCmdMeta;

/** Метаданные модуля курсов */
export interface CourseApiModuleMeta extends ApiModuleMeta {
  name: 'course';
  url: '/course';
  ucMetas: CourseUcMetas;
}

/** Резолвер зависимостей API-модуля курсов */
export interface CourseApiModuleResolver {
  db?: BaseJsonDb;
  courseRepo: CourseRepo;
  lessonRepo: LessonRepo;
  stepRepo: StepRepo;
  userFacade: UserFacade;
}
