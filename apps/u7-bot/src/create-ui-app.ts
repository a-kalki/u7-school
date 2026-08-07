import { AppController } from '@u7-scl/bot/app/app-controller';
import type { ApiApp } from '@u7-scl/core/api';
import { CourseController } from '@u7-scl/course/ui';
import { OnboardingController } from '@u7-scl/onboarding';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { BotConfig } from './config';
import type { ApiAppBundle } from './create-api-app';
import type { U7BotAppMeta } from './u7-bot-app-meta';
import { U7BotUiApp } from './ui-app';

/**
 * Результат фабрики UiApp — UI-слой бота.
 */
export interface UiAppBundle {
  uiApp: U7BotUiApp;
  appController: AppController;
  onboardingController: OnboardingController;
  streamController: StreamController;
  courseController: CourseController;
}

/**
 * Создаёт U7BotUiApp и все контроллеры.
 *
 * Получает модули из ApiAppBundle, создаёт контроллеры,
 * собирает их в U7BotUiApp и выполняет каскадную инициализацию.
 */
export function createUiApp(
  apiApp: ApiApp<U7BotAppMeta>,
  _bundle: ApiAppBundle,
  config: BotConfig,
): UiAppBundle {
  const onboardingController = new OnboardingController();
  const streamController = new StreamController();
  const courseController = new CourseController();
  const appController = new AppController(config.schoolGroupUrl);

  const uiApp = new U7BotUiApp([
    appController,
    onboardingController,
    streamController,
    courseController,
  ]);

  // Каскадная инициализация: ApiApp → контроллеры → стори → publicActions
  uiApp.init(apiApp);

  return {
    uiApp,
    appController,
    onboardingController,
    streamController,
    courseController,
  };
}
