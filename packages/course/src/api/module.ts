import { ApiModule } from '@u7-scl/core/api';
import type {
  CourseApiModuleMeta,
  CourseApiModuleResolver,
} from '#domain/module';
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
  ];

  constructor(resolve: CourseApiModuleResolver) {
    super();
    this.init(resolve);
  }
}
