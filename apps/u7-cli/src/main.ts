import { ApiApp } from '@u7-scl/core/api';
import type { AppResolver } from '@u7-scl/core/domain';
import { ConsoleLogger, LogLevel } from '@u7-scl/core/shared';
import { CourseApiModule } from '@u7-scl/course/api';
import {
  CourseJsonRepo,
  LessonJsonRepo,
  ModuleJsonRepo,
  StepJsonRepo,
} from '@u7-scl/course/infra';
import { UserApiModule } from '@u7-scl/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import { CliController } from './cli-controller';
import type { CliAppMeta } from './types';

async function main() {
  const logger = new ConsoleLogger();
  logger.setLogLevel(LogLevel.DEBUG);
  const appResolver: AppResolver = { logger, mode: 'development' };

  const userRepo = new UserJsonRepo();
  const userModule = new UserApiModule({ userRepo, appResolver });
  const userFacade = new UserInProcFacade(userModule);

  const courseRepo = new CourseJsonRepo('data/courses/courses.json');

  const courseModule = new CourseApiModule({
    moduleRepo: new ModuleJsonRepo(),
    courseRepo,
    lessonRepo: new LessonJsonRepo(),
    stepRepo: new StepJsonRepo(),
    userFacade,
    appResolver,
  });

  const app = new ApiApp<CliAppMeta>([userModule, courseModule]);
  const controller = new CliController(app);
  await controller.run();
}

main().catch(console.error);
