import { ApiModule } from "@u7/core/api";
import type { CourseApiModuleMeta, CourseApiModuleResolver } from "#domain/module";
import { AddModuleUc } from "./course/add-module-uc";
import { AddProjectToModuleUc } from "./course/add-project-to-module-uc";
import { AddProjectUc } from "./course/add-project-uc";
import { CreateCourseUc } from "./course/create-course-uc";
import { EnrichCourseUc } from "./course/enrich-course-uc";
import { GetCourseUc } from "./course/get-course-uc";
import { ListCoursesUc } from "./course/list-courses-uc";
import { PublishCourseUc } from "./course/publish-course-uc";
import { CreateLessonUc } from "./lesson/create-lesson-uc";
import { GetLessonUc } from "./lesson/get-lesson-uc";
import { CreateStepUc } from "./step/create-step-uc";
import { GetStepUc } from "./step/get-step-uc";

export class CourseApiModule extends ApiModule<
	CourseApiModuleMeta,
	CourseApiModuleResolver
> {
	readonly name = "course" as const;
	readonly useCases = [
		new CreateCourseUc(),
		new EnrichCourseUc(),
		new AddModuleUc(),
		new AddProjectUc(),
		new AddProjectToModuleUc(),
		new PublishCourseUc(),
		new GetCourseUc(),
		new ListCoursesUc(),
		new CreateLessonUc(),
		new GetLessonUc(),
		new CreateStepUc(),
		new GetStepUc(),
	];
}
