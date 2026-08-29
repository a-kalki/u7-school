import { ApiApp } from '@u7-scl/core/api';
import type { AppResolver } from '@u7-scl/core/domain';
import { InProcEventBus, InProcJobScheduler } from '@u7-scl/core/infra';
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
  const appResolver: AppResolver = {
    logger,
    mode: 'development',
    eventBus: new InProcEventBus(),
  };

  const userRepo = new UserJsonRepo();
  const userModule = new UserApiModule({
    userRepo,
    appResolver,
    eventBus: appResolver.eventBus,
  });
  const userFacade = new UserInProcFacade(userModule);

  const courseRepo = new CourseJsonRepo('data/courses/courses.json');

  const courseModule = new CourseApiModule({
    moduleRepo: new ModuleJsonRepo(),
    courseRepo,
    lessonRepo: new LessonJsonRepo(),
    stepRepo: new StepJsonRepo(),
    userFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  });

  // CLI — короткоживущий процесс: планировщик передаётся (обязательный контракт
  // ApiApp), но start() не вызывается — фоновые задания не нужны.
  const app = new ApiApp<CliAppMeta>(
    [userModule, courseModule],
    new InProcJobScheduler({ logger }),
  );
  const controller = new CliController(app);
  await controller.run();
}

main().catch(console.error);
