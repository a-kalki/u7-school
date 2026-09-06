import { AppController } from '@u7-scl/bot/app/app-controller';
import type { ApiApp } from '@u7-scl/core/api';
import type { BotConfig } from './config';
import { CoursesController } from './controllers/courses/controller';
import { LearningController } from './controllers/learning/controller';
import { MentorController } from './controllers/mentor/controller';
import { QuestionnaireController } from './controllers/questionnaire/controller';
import { StreamsController } from './controllers/streams/controller';
import { UserController } from './controllers/user/controller';
import type { U7BotAppMeta, U7BotUiAppResolve } from './core/u7-bot-app-meta';
import { type AppCommandGateOptions, U7BotUiApp } from './core/ui-app';
import type { ApiAppBundle } from './create-api-app';

/**
 * Результат фабрики UiApp — UI-слой бота.
 */
export interface UiAppBundle {
  uiApp: U7BotUiApp;
  resolve: U7BotUiAppResolve;
  appController: AppController;
  streamController: StreamsController;
  userController: UserController;
  courseController: CoursesController;
  learningController: LearningController;
  mentorController: MentorController;
  questionnaireController: QuestionnaireController;
}

/**
 * Создаёт U7BotUiApp и все контроллеры, собирает resolve для init.
 *
 * Создание и init разделены: init (с передачей transport) выполняется
 * вызывающим кодом (main.ts) после создания BotTransport.
 */
export function createUiApp(
  apiApp: ApiApp<U7BotAppMeta>,
  bundle: ApiAppBundle,
  config: BotConfig,
): UiAppBundle {
  const streamController = new StreamsController();
  const courseController = new CoursesController();
  const learningController = new LearningController();
  const mentorController = new MentorController();
  const questionnaireController = new QuestionnaireController();
  const userController = new UserController();
  const appController = new AppController(config.schoolGroupUrl);

  // appCommand-гейт (ФР-4): правила u7 на входе конвейера команд —
  // гост-регистрация /start, админ-гейт /log_level, main-help «на меню».
  const gate: AppCommandGateOptions = {
    adminTelegramIds: config.adminTelegramIds,
    userFacade: bundle.userFacade,
    botAdminUuid: config.botAdminUuid,
  };

  const uiApp = new U7BotUiApp(
    [
      appController,
      streamController,
      userController,
      courseController,
      learningController,
      mentorController,
      questionnaireController,
    ],
    gate,
  );

  // resolve для каскадной инициализации UiApp → контроллеры → стори.
  // actorResolver: резолвит User по telegramId через userFacade.
  const resolve: U7BotUiAppResolve = {
    eventBus: bundle.eventBus,
    actorResolver: async (tgId: number) => {
      const user = await bundle.userFacade.getUserByTelegramId(tgId);
      if (!user) throw new Error(`Пользователь с telegramId ${tgId} не найден`);
      return user;
    },
    appApi: apiApp,
    uiApp,
  };

  return {
    uiApp,
    resolve,
    appController,
    streamController,
    userController,
    courseController,
    learningController,
    mentorController,
    questionnaireController,
  };
}
