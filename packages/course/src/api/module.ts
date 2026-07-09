import { ApiModule } from '@u7-scl/core/api';
import type {
  CourseApiModuleMeta,
  CourseApiModuleResolver,
} from '#domain/module';
import { ResolveContentPathUc } from './content-path/resolve-content-path-uc';
import { AddModuleToCourseUc } from './course/add-module-to-course-uc';
import { AddPhaseToCourseUc } from './course/add-phase-to-course-uc';
import { CreateCourseUc } from './course/create-course-uc';
import { GetCourseUc } from './course/get-course-uc';
import { ListCoursesUc } from './course/list-courses-uc';
import { CreateLessonUc } from './lesson/create-lesson-uc';
import { GetLessonUc } from './lesson/get-lesson-uc';
import { AddProjectUc } from './module/add-project-uc';
import { CreateModuleUc } from './module/create-module-uc';
import { EnrichModuleUc } from './module/enrich-module-uc';
import { GetModuleSnapshotUc } from './module/get-module-snapshot-uc';
import { GetModuleUc } from './module/get-module-uc';
import { ListModulesUc } from './module/list-modules-uc';
import { PublishModuleUc } from './module/publish-module-uc';
import { CreateStepUc } from './step/create-step-uc';
import { GetStepUc } from './step/get-step-uc';

export class CourseApiModule extends ApiModule<
  CourseApiModuleMeta,
  CourseApiModuleResolver
> {
  readonly name = 'course' as const;
  readonly useCases = [
    new CreateModuleUc(),
    new EnrichModuleUc(),
    new AddProjectUc(),
    new PublishModuleUc(),
    new GetModuleUc(),
    new GetModuleSnapshotUc(),
    new ListModulesUc(),
    new CreateLessonUc(),
    new GetLessonUc(),
    new CreateStepUc(),
    new GetStepUc(),
    new ResolveContentPathUc(),
    new CreateCourseUc(),
    new AddPhaseToCourseUc(),
    new AddModuleToCourseUc(),
    new GetCourseUc(),
    new ListCoursesUc(),
  ];

  constructor(resolve: CourseApiModuleResolver) {
    super(resolve);
    this.init();
  }
}
