import { ApiApp } from '@u7-scl/core/api';
import { CourseApiModule } from '@u7-scl/course/api';
import { ModuleJsonRepo, LessonJsonRepo, StepJsonRepo } from '@u7-scl/course/infra';
import { UserApiModule } from '@u7-scl/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import { CliController } from './cli-controller';
import type { CliAppMeta } from './types';

async function main() {
  const userRepo = new UserJsonRepo();
  const userModule = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userModule);

  const courseModule = new CourseApiModule({
    courseRepo: new ModuleJsonRepo(),
    lessonRepo: new LessonJsonRepo(),
    stepRepo: new StepJsonRepo(),
    userFacade,
  });

  const app = new ApiApp<CliAppMeta>([userModule, courseModule]);
  const controller = new CliController(app);
  await controller.run();
}

main().catch(console.error);
