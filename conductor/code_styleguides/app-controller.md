# AppController — контроллер уровня приложения

## Назначение

`AppController` — контроллер в `packages/app/src/ui/`, который обрабатывает пользовательские сценарии (stories), **не привязанные к конкретному доменному модулю**.

Примеры таких сценариев:
- Кнопка «💬 Сообщество школы» (URL-ссылка на группу)
- Кнопка «↩️ Назад /start» (универсальная навигация)

## Отличие от доменных контроллеров

| Контроллер | Пакет | Доменный модуль | Примеры |
|---|---|---|---|
| `StreamController` | `@u7-scl/stream` | `StreamApiModule` | Каталог потоков, запись, прогресс |
| `OnboardingController` | `@u7-scl/onboarding` | `OnboardingApiModule` | Анкета |
| `AppController` | `@u7-scl/app` | _нет (заглушка)_ | Сообщество школы, навигация |

## Структура

```typescript
export class AppController extends U7BotController<AppOnlyApiModuleMeta> {
  readonly name = 'app';

  constructor(schoolGroupUrl?: string) {
    super({} as never); // Заглушка ApiModule — usecase не используются
    if (schoolGroupUrl) {
      this.stories.push(new CommunityStory(schoolGroupUrl));
    }
  }
}
```

## Ключевые правила

1. **AppController использует заглушку ApiModule** — он не делает вызовов usecase.
2. **Stories размещаются в `packages/app/src/ui/stories/`.**
3. **Регистрируется в `BotRouter` первым** — его пункты меню имеют низкий приоритет.
4. **Импорты внутри пакета — прямые (из файлов), минуя barrel `index.ts`** — для предотвращения циклических зависимостей.

## Регистрация

В `apps/u7-bot/src/api-app.ts`:

```typescript
import { AppController } from '@u7-scl/app/ui';

const appController = new AppController(config.schoolGroupUrl);
appController.init(apiApp);

const router = new BotRouter([appController, onboardingController, streamController]);
```

## Добавление новых stories

1. Создать файл в `packages/app/src/ui/stories/<name>.story.ts`
2. Унаследовать от `U7BotUserStory<AppOnlyApiModuleMeta>`
3. Импортировать `U7BotUserStory` напрямую: `import { U7BotUserStory } from '../u7-bot-user-story'`
4. Зарегистрировать в конструкторе `AppController`
