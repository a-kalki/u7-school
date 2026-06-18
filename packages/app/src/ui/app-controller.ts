import type { ApiModuleMeta } from '@u7-scl/core/domain';
import { U7BotController } from './u7-bot-controller';
import { CommunityStory } from './stories/community.story';
import type { AppOnlyApiModuleMeta } from './stories/community.story';

/**
 * Контроллер уровня приложения для stories без привязки к доменным модулям.
 * Например: кнопка «Сообщество школы», /help и т.д.
 */
export class AppController extends U7BotController<AppOnlyApiModuleMeta> {
  readonly name = 'app';

  /**
   * @param schoolGroupUrl — URL группы школы (если не задан, кнопка «Сообщество школы» не добавляется)
   */
  constructor(schoolGroupUrl?: string) {
    // Передаём заглушку ApiModule — контроллер не делает вызовов usecase
    super({} as never);
    if (schoolGroupUrl) {
      this.stories.push(new CommunityStory(schoolGroupUrl));
    }
  }
}
