import { ApiApp } from '@u7/core/api';
import { CourseApiModule } from '@u7/course/api';
import { CourseJsonRepo, LessonJsonRepo, StepJsonRepo } from '@u7/course/infra';
import { UserApiModule } from '@u7/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7/user/infra';
import { CliController } from './cli-controller';
import type { CliAppMeta } from './types';

async function main() {
  const userRepo = new UserJsonRepo();
  const userModule = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userModule);

  const courseModule = new CourseApiModule({
    courseRepo: new CourseJsonRepo(),
    lessonRepo: new LessonJsonRepo(),
    stepRepo: new StepJsonRepo(),
    userFacade,
  });

  const app = new ApiApp<CliAppMeta>([userModule, courseModule]);
  const controller = new CliController(app);
  await controller.run();
}

main().catch(console.error);
