import type { ApiModuleMeta } from '@u7-scl/core/domain';
import type { BaseJsonDb } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import type { AddProjectCmdMeta } from './module/commands/add-project-cmd';
import type { CreateModuleCmdMeta } from './module/commands/create-module-cmd';
import type { EnrichModuleCmdMeta } from './module/commands/enrich-module-cmd';
import type { GetModuleCmdMeta } from './module/commands/get-module-cmd';
import type { ListModulesCmdMeta } from './module/commands/list-modules-cmd';
import type { PublishModuleCmdMeta } from './module/commands/publish-module-cmd';
import type { ModuleRepo } from './module/repo';
import type { CreateLessonCmdMeta } from './lesson/commands/create-lesson-cmd';
import type { GetLessonCmdMeta } from './lesson/commands/get-lesson-cmd';
import type { LessonRepo } from './lesson/repo';
import type { CreateStepCmdMeta } from './step/commands/create-step-cmd';
import type { GetStepCmdMeta } from './step/commands/get-step-cmd';
import type { StepRepo } from './step/repo';

export type ModuleUcMetas =
  | AddProjectCmdMeta
  | CreateModuleCmdMeta
  | EnrichModuleCmdMeta
  | GetModuleCmdMeta
  | ListModulesCmdMeta
  | PublishModuleCmdMeta
  | CreateLessonCmdMeta
  | GetLessonCmdMeta
  | CreateStepCmdMeta
  | GetStepCmdMeta;

/** Метаданные модуля course (имя пакета @u7-scl/course) */
export interface CourseApiModuleMeta extends ApiModuleMeta {
  name: 'course';
  url: '/course';
  ucMetas: ModuleUcMetas;
}

/** Резолвер зависимостей API-модуля курсов */
export interface CourseApiModuleResolver {
  db?: BaseJsonDb;
  courseRepo: ModuleRepo;
  lessonRepo: LessonRepo;
  stepRepo: StepRepo;
  userFacade: UserFacade;
}
