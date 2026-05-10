import type { CourseRepo } from "./course/repo";
import type { FileMetadataRepo } from "./file-metadata/repo";
import type { LessonRepo } from "./lesson/repo";
import type { StepRepo } from "./step/repo";
import type { UserFacade } from "./facade";

/** Метаданные модуля курсов */
export interface CourseModuleMeta {
  name: "course";
  url: "/course";
}

/** Резолвер зависимостей API-модуля курсов */
export interface CourseApiModuleResolver {
  courseRepo: CourseRepo;
  lessonRepo: LessonRepo;
  stepRepo: StepRepo;
  fileMetadataRepo: FileMetadataRepo;
  userFacade: UserFacade;
}
