import { AppController } from '@u7-scl/bot/app/app-controller';
import type { ApiApp } from '@u7-scl/core/api';
import type { BotConfig } from './config';
import { CoursesController } from './controllers/courses/controller';
import { LearningController } from './controllers/learning/controller';
import { MentorController } from './controllers/mentor/controller';
import { OnboardingController } from './controllers/onboarding/controller';
import { QuestionnaireController } from './controllers/questionnaire/controller';
import { StreamsController } from './controllers/streams/controller';
import type { U7BotAppMeta } from './core/u7-bot-app-meta';
import { U7BotUiApp } from './core/ui-app';
import type { ApiAppBundle } from './create-api-app';

/**
 * Результат фабрики UiApp — UI-слой бота.
 */
export interface UiAppBundle {
  uiApp: U7BotUiApp;
  appController: AppController;
  onboardingController: OnboardingController;
  streamController: StreamsController;
  courseController: CoursesController;
  learningController: LearningController;
  mentorController: MentorController;
  questionnaireController: QuestionnaireController;
}

/**
 * Создаёт U7BotUiApp и все контроллеры.
 *
 * Получает модули из ApiAppBundle, создаёт контроллеры,
 * собирает их в U7BotUiApp и выполняет каскадную инициализацию.
 */
export function createUiApp(
  apiApp: ApiApp<U7BotAppMeta>,
  bundle: ApiAppBundle,
  config: BotConfig,
): UiAppBundle {
  const onboardingController = new OnboardingController();
  const streamController = new StreamsController();
  const courseController = new CoursesController();
  const learningController = new LearningController();
  const mentorController = new MentorController();
  const questionnaireController = new QuestionnaireController(
    bundle.questionnaireModule,
  );
  const appController = new AppController(config.schoolGroupUrl);

  const uiApp = new U7BotUiApp([
    appController,
    onboardingController,
    streamController,
    courseController,
    learningController,
    mentorController,
    questionnaireController,
  ]);

  // Каскадная инициализация: ApiApp → контроллеры → стори
  // actorResolver: резолвит User по telegramId через userFacade
  uiApp.init(apiApp, (tgId: number) => bundle.userFacade.getByTgId(tgId));

  return {
    uiApp,
    appController,
    onboardingController,
    streamController,
    courseController,
    learningController,
    mentorController,
    questionnaireController,
  };
}
