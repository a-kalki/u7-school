import { Module } from "@u7/core/api";
import type { CourseApiModuleResolver, CourseModuleMeta } from "#domain/module";
import { CreateCourseUc } from "./course/create-course-uc";
import { GetCourseUc } from "./course/get-course-uc";
import { ListCoursesUc } from "./course/list-courses-uc";
import { CreateFileMetadataUc } from "./file-metadata/create-file-metadata-uc";
import { GetFileMetadataUc } from "./file-metadata/get-file-metadata-uc";
import { CreateLessonUc } from "./lesson/create-lesson-uc";
import { GetLessonUc } from "./lesson/get-lesson-uc";
import { CreateStepUc } from "./step/create-step-uc";
import { GetStepUc } from "./step/get-step-uc";

export class CourseApiModule extends Module<
	CourseModuleMeta,
	CourseApiModuleResolver
> {
	readonly name = "course" as const;
	readonly useCases = [
		new CreateCourseUc(),
		new GetCourseUc(),
		new ListCoursesUc(),
		new CreateLessonUc(),
		new GetLessonUc(),
		new CreateStepUc(),
		new GetStepUc(),
		new CreateFileMetadataUc(),
		new GetFileMetadataUc(),
	];
}
