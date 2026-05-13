import type { BaseJsonDb } from "@u7/core/infra";
import type { UserFacade } from "@u7/user/domain";
import type { CourseRepo } from "./course/repo";
import type { LessonRepo } from "./lesson/repo";
import type { StepRepo } from "./step/repo";

/** Метаданные модуля курсов */
export interface CourseModuleMeta {
	name: "course";
	url: "/course";
}

/** Резолвер зависимостей API-модуля курсов */
export interface CourseApiModuleResolver {
	db?: BaseJsonDb;
	courseRepo: CourseRepo;
	lessonRepo: LessonRepo;
	stepRepo: StepRepo;
	userFacade: UserFacade;
}
