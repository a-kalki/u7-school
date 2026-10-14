import { AppController } from '@u7-scl/bot/app/app-controller';
import type { ApiApp } from '@u7-scl/core/api';
import { CoursesController } from './controllers/courses/controller';
import { LearningController } from './controllers/learning/controller';
import { MentorController } from './controllers/mentor/controller';
import { PeerReviewController } from './controllers/peer-review/controller';
import { QuestionnaireController } from './controllers/questionnaire/controller';
import { StreamsController } from './controllers/streams/controller';
import { UserController } from './controllers/user/controller';
import type { U7BotAppMeta, U7BotUiAppResolve } from './core/u7-bot-app-meta';
import { U7BotUiApp } from './core/ui-app';
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
  peerReviewController: PeerReviewController;
}

/**
 * Параметры фабрики UiApp (только точечные UI/системные идентификаторы,
 * не зависящие от BotConfig).
 */
export interface CreateUiAppOptions {
  botAdminUuid: string;
  adminTelegramIds?: number[];
}

/**
 * Создаёт U7BotUiApp и все контроллеры, собирает resolve для init.
 *
 * Создание и init разделены: init (с передачей transport) выполняется
 * вызывающим кодом (main.ts) после создания BotTransport.
 */
export async function createUiApp(
  apiApp: ApiApp<U7BotAppMeta>,
  bundle: ApiAppBundle,
  options: CreateUiAppOptions,
): Promise<UiAppBundle> {
  const streamController = new StreamsController();
  const courseController = new CoursesController();
  const learningController = new LearningController();
  const mentorController = new MentorController();
  const questionnaireController = new QuestionnaireController();
  const peerReviewController = new PeerReviewController();
  const userController = new UserController();
  // Админ-гейт /log_level — app-контроллер (ФР-4)
  const appController = new AppController(
    bundle.school.communityGroup.url,
    options.adminTelegramIds,
  );

  // Гост-регистрация /start — uiApp через resolve (ФР-4)
  const uiApp = new U7BotUiApp([
    appController,
    streamController,
    userController,
    courseController,
    learningController,
    mentorController,
    questionnaireController,
    peerReviewController,
  ]);

  // resolve для каскадной инициализации UiApp → контроллеры → стори.
  // actorResolver: резолвит User по telegramId через userFacade;
  // userFacade + botAdminUser — идемпотентная гост-регистрация на /start.
  const botAdminUser = await bundle.userFacade.getUserByUuid(
    options.botAdminUuid,
  );
  if (!botAdminUser) {
    throw new Error(
      `BOT_ADMIN_UUID не найден: пользователь ${options.botAdminUuid} не существует`,
    );
  }
  const resolve: U7BotUiAppResolve = {
    eventBus: bundle.eventBus,
    actorResolver: async (tgId: number) => {
      const user = await bundle.userFacade.getUserByTelegramId(tgId);
      if (!user) throw new Error(`Пользователь с telegramId ${tgId} не найден`);
      return user;
    },
    appApi: apiApp,
    userFacade: bundle.userFacade,
    botAdminUser,
    school: bundle.school,
    adminTelegramIds: options.adminTelegramIds,
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
    peerReviewController,
  };
}
